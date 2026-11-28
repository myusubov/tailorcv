import { ApiError } from '@google/genai';
import { RequestError } from '@octokit/request-error';
import { ErrorCode } from 'shared';
import type { AnalyzeGithubReposResponse } from 'shared';
import { logger } from '../lib/logger';
import { mapOctokitErrorToAppError } from '../lib/octokit-error';
import { resumeGenerationQueue } from '../lib/resume-queue';
import type {
  EnqueueResumeGenerationInput,
  FailResumeGenerationInput,
  RemoveResumeGenerationJobInput,
  RetryResumeGenerationInput,
} from '../types/resume';
import { AppError } from '../utils/AppError';
import {
  getGithubConnection,
  getValidInstallationToken,
} from './github.service';
import {
  getResumeByIdForWorker,
  getResumeIdForUser,
  markResumeFailed,
  resetFailedResume,
  saveAnalyzedRepoIds,
  saveFailedRepoNames,
  saveResumeContent,
} from './resume.service';
import { analyzeGithubRepositories } from './github-analysis.service';
import { getStoredAnalyses, storeAnalyses } from './analysis.service';
import { Prisma } from '../../prisma/generated/client/client.js';
import type { GeneratedResumeContent } from '../types/resume-content';
import { generateResumeContent } from './resume-ai.service';

/**
 * Adds a generation job for the resume to the queue. The resume id doubles as
 * the job id, so enqueueing the same resume again is ignored while the job still exists.
 * Rejects if Redis is unreachable.
 */
export async function enqueueResumeGeneration(
  input: EnqueueResumeGenerationInput,
) {
  await resumeGenerationQueue.add(
    'generate-resume',
    { resumeId: input.resumeId },
    {
      jobId: input.resumeId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    },
  );
}

/**
 * Removes the queue job whose id is the resume id, so a retry can enqueue the
 * resume again. Does nothing when no such job exists.
 */
export async function removeResumeGenerationJob({
  resumeId,
}: RemoveResumeGenerationJobInput) {
  await resumeGenerationQueue.remove(resumeId);
}

/**
 * Restarts generation for a resume that failed with a retryable reason. Throws
 * `NOT_FOUND` when the user has no such resume and `RESUME_NOT_RETRYABLE` for any
 * other state. If the job cannot be queued, the resume is marked `FAILED` with
 * `SERVICE_UNAVAILABLE`, whatever its earlier reason, and that error is thrown.
 */
export async function retryResumeGeneration({
  resumeId,
  userId,
}: RetryResumeGenerationInput) {
  const userResume = await getResumeIdForUser({ resumeId, userId });
  if (!userResume) {
    throw new AppError('Resume not found', ErrorCode.NOT_FOUND, 404);
  }
  const resetStatus = await resetFailedResume({ resumeId, userId });

  if (!resetStatus) {
    throw new AppError(
      'Resume not retryable',
      ErrorCode.RESUME_NOT_RETRYABLE,
      409,
    );
  }

  try {
    await removeResumeGenerationJob({ resumeId });
    await enqueueResumeGeneration({ resumeId });
  } catch (err) {
    logger.error(
      { err, resumeId, userId },
      'Failed to queue retry, marking resume as failed',
    );
    await markResumeFailed({
      resumeId,
      failureReason: ErrorCode.SERVICE_UNAVAILABLE,
    });
    throw new AppError(
      "We couldn't restart your resume right now. Please try again in a moment.",
      ErrorCode.SERVICE_UNAVAILABLE,
      503,
    );
  }

  return { id: resumeId };
}

// Connection-level failures, where a retry can succeed, unlike constraint or query errors.
const DATABASE_UNAVAILABLE_CODES = ['P1001', 'P1008', 'P1017', 'P2037'];

function isDatabaseUnavailableError(err: unknown) {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    DATABASE_UNAVAILABLE_CODES.includes(err.code)
  );
}

// Gemini answers these when our request, key or model name is wrong, so a retry cannot help.
const PERMANENT_GEMINI_STATUSES = [400, 401, 403, 404];

// Any other failure, such as an overload, a timeout or a bad reply, is worth a later try.
function getContentFailureReason(err: unknown) {
  const isPermanent =
    err instanceof ApiError && PERMANENT_GEMINI_STATUSES.includes(err.status);
  return isPermanent ? ErrorCode.INTERNAL_ERROR : ErrorCode.SERVICE_UNAVAILABLE;
}

type ResumeForWorker = NonNullable<
  Awaited<ReturnType<typeof getResumeByIdForWorker>>
>;

// Everything that needs GitHub access lives here, so reusing a stored analysis
// never calls GitHub. Returns null after marking the resume failed.
async function analyzeAndStoreRepositories(resume: ResumeForWorker) {
  const githubConnection = await getGithubConnection(resume.userId);
  if (!githubConnection) {
    logger.warn(
      { resumeId: resume.id, userId: resume.userId },
      'GitHub connection is missing, marking resume as failed',
    );
    await markResumeFailed({
      resumeId: resume.id,
      failureReason: ErrorCode.GITHUB_CONNECTION_REQUIRED,
    });
    return null;
  }
  let validConnection: Awaited<ReturnType<typeof getValidInstallationToken>>;
  try {
    validConnection = await getValidInstallationToken(githubConnection);
  } catch (error) {
    if (
      error instanceof AppError &&
      error.errorCode === ErrorCode.GITHUB_APP_SUSPENDED
    ) {
      logger.warn(
        { resumeId: resume.id, userId: resume.userId },
        'GitHub app is suspended, marking resume as failed',
      );
      await markResumeFailed({
        resumeId: resume.id,
        failureReason: ErrorCode.GITHUB_APP_SUSPENDED,
      });
      return null;
    }
    throw error;
  }

  const analysis = await analyzeGithubRepositories({
    clerkUserId: resume.userId,
    repoIds: resume.sourceRepoIds.map((id) => Number(id)),
    accessToken: validConnection.installationAccessToken,
  });
  // allSettled lets both writes finish before a failure is rethrown, so
  // the job's retry never starts while one of them is still running.
  const writes = await Promise.allSettled([
    saveFailedRepoNames({
      resumeId: resume.id,
      failedRepoNames: analysis.failedRepoNames,
    }),
    storeAnalyses({
      userId: resume.userId,
      summaries: analysis.summaries,
    }).then(() =>
      saveAnalyzedRepoIds({
        resumeId: resume.id,
        analyzedRepoIds: analysis.summaries.map((summary) =>
          String(summary.repository.id),
        ),
      }),
    ),
  ]);
  const rejected = writes.find(
    (write): write is PromiseRejectedResult => write.status === 'rejected',
  );
  if (rejected) throw rejected.reason;
  return analysis;
}

// Returns null unless every repository saved on the resume still has a stored
// analysis, so the caller falls back to the full flow.
async function loadStoredAnalysis(
  resume: ResumeForWorker,
): Promise<AnalyzeGithubReposResponse | null> {
  if (resume.analyzedRepoIds.length === 0) return null;
  const summaries = await getStoredAnalyses({
    userId: resume.userId,
    repoIds: resume.analyzedRepoIds,
  });
  if (summaries.length !== resume.analyzedRepoIds.length) return null;
  return { failedRepoIds: [], failedRepoNames: [], summaries };
}

/**
 * Runs one generation job: reuses the stored analysis when every saved repo
 * still has one, else analyzes the source repositories, then asks Gemini and
 * saves the content. GitHub access loss, failed analysis or a failed Gemini call
 * marks the resume `FAILED`; any other error is thrown so BullMQ retries.
 */
export async function generateResume(resumeId: string) {
  const resume = await getResumeByIdForWorker({ resumeId });
  if (!resume) {
    logger.warn({ resumeId }, 'Resume not found, skipping generation job');
    return;
  }
  if (resume.status !== 'GENERATING') {
    logger.info(
      { resumeId, status: resume.status },
      'Resume is not generating, skipping generation job',
    );
    return;
  }
  const analysis =
    (await loadStoredAnalysis(resume)) ??
    (await analyzeAndStoreRepositories(resume));
  if (!analysis) return;

  if (analysis.failedRepoIds.length === resume.sourceRepoIds.length) {
    logger.warn(
      { resumeId, userId: resume.userId },
      'All source repositories failed analysis, marking resume as failed',
    );
    await markResumeFailed({
      resumeId,
      failureReason: ErrorCode.GITHUB_REPO_ANALYSIS_FAILED,
    });
    return;
  }

  let resumeContent: GeneratedResumeContent;
  try {
    resumeContent = await generateResumeContent({
      repositories: analysis.summaries,
    });
  } catch (err) {
    logger.error(
      { err, resumeId, userId: resume.userId },
      'Failed to generate resume content, marking resume as failed',
    );
    await markResumeFailed({
      resumeId,
      failureReason: getContentFailureReason(err),
    });
    return;
  }

  const saved = await saveResumeContent({
    resumeId,
    userId: resume.userId,
    content: resumeContent,
  });
  if (!saved) {
    logger.warn(
      { resumeId, userId: resume.userId },
      'Resume is no longer generating, generated content was not saved',
    );
  }
}

function getFailureReason(error: unknown) {
  if (error instanceof AppError) return error.errorCode;
  if (error instanceof RequestError) {
    const reason = mapOctokitErrorToAppError(error).errorCode;
    const isTemporaryGithubFailure =
      reason === ErrorCode.GITHUB_API_ERROR ||
      reason === ErrorCode.RATE_LIMIT_EXCEEDED;
    return isTemporaryGithubFailure ? ErrorCode.SERVICE_UNAVAILABLE : reason;
  }
  if (isDatabaseUnavailableError(error)) return ErrorCode.SERVICE_UNAVAILABLE;
  return ErrorCode.INTERNAL_ERROR;
}

/**
 * Marks the resume failed once its generation job has used all attempts. The
 * reason is the error's code for an `AppError` or a GitHub error, with
 * `SERVICE_UNAVAILABLE` for a database connection error or a GitHub outage or rate
 * limit, and `INTERNAL_ERROR` otherwise, so raw messages never reach the resume row.
 */
export async function failResumeGeneration({
  resumeId,
  error,
}: FailResumeGenerationInput) {
  await markResumeFailed({
    resumeId,
    failureReason: getFailureReason(error),
  });
}
