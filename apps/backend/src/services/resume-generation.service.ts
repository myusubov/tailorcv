import { ApiError } from '@google/genai';
import { ErrorCode } from 'shared';
import { logger } from '../lib/logger';
import { resumeGenerationQueue } from '../lib/resume-queue';
import type {
  EnqueueResumeGenerationInput,
  FailResumeGenerationInput,
} from '../types/resume';
import { AppError } from '../utils/AppError';
import {
  getGithubConnection,
  getValidInstallationToken,
} from './github.service';
import {
  getResumeByIdForWorker,
  markResumeFailed,
  saveFailedRepoNames,
  saveResumeContent,
} from './resume.service';
import { analyzeGithubRepositories } from './github-analysis.service';
import { storeAnalyses } from './analysis.service';
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

/**
 * Runs one generation job: analyzes the source repositories, asks Gemini for the
 * content and saves it. A missing GitHub connection, a suspended app, failed
 * analysis or a failed Gemini call marks the resume `FAILED` and returns. Any
 * other error is thrown so BullMQ retries the job.
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
  const githubConnection = await getGithubConnection(resume.userId);
  if (!githubConnection) {
    logger.warn(
      { resumeId, userId: resume.userId },
      'GitHub connection is missing, marking resume as failed',
    );
    await markResumeFailed({
      resumeId,
      failureReason: ErrorCode.GITHUB_CONNECTION_REQUIRED,
    });
    return;
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
        { resumeId, userId: resume.userId },
        'GitHub app is suspended, marking resume as failed',
      );
      await markResumeFailed({
        resumeId,
        failureReason: ErrorCode.GITHUB_APP_SUSPENDED,
      });
      return;
    }
    throw error;
  }
  const analysis = await analyzeGithubRepositories({
    clerkUserId: resume.userId,
    repoIds: resume.sourceRepoIds.map((id) => Number(id)),
    accessToken: validConnection.installationAccessToken,
  });

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

  if (analysis.failedRepoNames.length > 0) {
    await saveFailedRepoNames({
      resumeId: resume.id,
      failedRepoNames: analysis.failedRepoNames,
    });
  }

  await storeAnalyses({
    userId: resume.userId,
    summaries: analysis.summaries,
  });

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
  if (isDatabaseUnavailableError(error)) return ErrorCode.SERVICE_UNAVAILABLE;
  return ErrorCode.INTERNAL_ERROR;
}

/**
 * Marks the resume failed once its generation job has used all attempts. The
 * failure reason is the error's code for an `AppError`, `SERVICE_UNAVAILABLE` for a
 * database connection error and `INTERNAL_ERROR` otherwise, so raw error messages
 * never reach the resume row.
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
