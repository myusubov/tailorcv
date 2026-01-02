import type { TaskList } from 'graphile-worker';
import { ErrorCode } from 'shared';
import type { OnboardingJobPayload } from './types/onboarding-job';
import { prisma } from './lib';
import { AppError } from './utils/AppError';
import type { OnboardingGenerateBaseBody } from './schemas/onboarding-generate.schema';
import {
  generateOnboarding,
  generateFromAboutMe,
} from './services/onboarding.service';
import { logger } from './lib/logger';
import { Prisma } from '../prisma/generated/client/client.js';
import { getAnalysisJob, updateJobStatus } from './services/analysis.service';
import { detectRepoTechStack, fetchRepoCommits, fetchRepoPullRequests, getGithubConnection } from './services/github.service';

function toJobError(err: unknown) {
  if (err instanceof AppError) {
    return {
      message: err.message,
      code: err.errorCode,
      details: err.details,
    };
  }

  return {
    message:
      (err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message)
        : null) ?? 'Unknown error',
    code: ErrorCode.INTERNAL_ERROR,
  };
}

export const tasks: TaskList = {
  'onboarding.generate': async (payload) => {
    const payloadObj =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : null;

    if (
      !payloadObj ||
      !('jobId' in payloadObj) ||
      typeof payloadObj.jobId !== 'string'
    ) {
      logger.error({ payload }, 'worker onboarding.generate invalid payload');
      throw new AppError(
        'Invalid job payload',
        ErrorCode.VALIDATION_ERROR,
        400,
        payload,
      );
    }

    const jobId = payloadObj.jobId;
    const startedAt = Date.now();

    logger.info({ jobId }, 'worker onboarding.generate task picked up');

    const job = await prisma.onboardingJob.findUnique({
      where: { id: jobId },
      select: { id: true, userId: true, payload: true },
    });

    if (!job) {
      logger.warn({ jobId }, 'worker onboarding.generate job not found');
      return;
    }

    await prisma.onboardingJob.update({
      where: { id: job.id },
      data: {
        status: 'RUNNING',
        stage: 'CALLING_AI',
        progressPct: 10,
        error: Prisma.JsonNull,
      },
    });
    logger.info(
      {
        jobId: job.id,
        userId: job.userId,
        stage: 'CALLING_AI',
        progressPct: 10,
      },
      'worker onboarding.generate running',
    );

    try {
      await prisma.onboardingJob.update({
        where: { id: job.id },
        data: { stage: 'CALLING_AI', progressPct: 25 },
      });
      logger.info(
        {
          jobId: job.id,
          stage: 'CALLING_AI',
          progressPct: 25,
        },
        'worker onboarding.generate stage',
      );

      const payload = job.payload as unknown as OnboardingJobPayload;

      let result;
      logger.info(
        { jobId: job.id, type: payload._type },
        'worker onboarding.generate routing',
      );

      if (payload._type === 'about-me') {
        result = await generateFromAboutMe({
          clerkUserId: job.userId,
          text: payload.text,
        });
      } else if (payload._type === 'form') {
        result = await generateOnboarding({
          clerkUserId: job.userId,
          body: payload,
        });
      }

      await prisma.onboardingJob.update({
        where: { id: job.id },
        data: { stage: 'SAVING', progressPct: 90 },
      });
      logger.info(
        {
          jobId: job.id,
          stage: 'SAVING',
          progressPct: 90,
        },
        'worker onboarding.generate stage',
      );

      await prisma.onboardingJob.update({
        where: { id: job.id },
        data: {
          status: 'SUCCEEDED',
          stage: 'DONE',
          progressPct: 100,
          result,
          rawAiResponse: result?.rawAiResponse || Prisma.JsonNull,
          resultBaseResumeId: result?.baseResumeId,
          error: Prisma.JsonNull,
        },
      });
      logger.info(
        {
          jobId: job.id,
          userId: job.userId,
          baseResumeId: result?.baseResumeId,
          elapsedMs: Date.now() - startedAt,
        },
        'worker onboarding.generate success',
      );
    } catch (err) {
      logger.error(
        {
          err,
          jobId: job.id,
          userId: job.userId,
          elapsedMs: Date.now() - startedAt,
        },
        'worker onboarding.generate failed',
      );

      const jobError = toJobError(err);
      const rawAiResponse =
        err instanceof AppError && err.details?.rawAiResponse
          ? err.details.rawAiResponse
          : Prisma.JsonNull;

      await prisma.onboardingJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          stage: 'FAILED',
          progressPct: 100,
          error: jobError,
          rawAiResponse,
        },
      });
    }
  },
  'analysis.process': async (payload) => {
    const payloadObj =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : null;

    if (
      !payloadObj ||
      !('jobId' in payloadObj) ||
      typeof payloadObj.jobId !== 'string'
    ) {
      logger.error({ payload }, 'worker analysis.process invalid payload');
      throw new AppError(
        'Invalid job payload',
        ErrorCode.VALIDATION_ERROR,
        400,
        payload,
      );
    }

    const { jobId } = payloadObj as { jobId: string };
    const startedAt = Date.now();

    logger.info({ jobId }, 'worker analysis.process task picked up');

    const job = await getAnalysisJob(jobId);

    if (!job) {
      logger.warn({ jobId }, 'worker analysis.process job not found');
      return;
    }

    try {

    await updateJobStatus({
      jobId,
      status: "PROCESSING",
    });

    const githubConnection = await getGithubConnection(job.userId);

    if (!githubConnection) {
      throw new AppError('GitHub connection not found', ErrorCode.NOT_FOUND, 404);
    }

    const accessToken = githubConnection.accessToken;

    for (const { repoOwner, repoName, id } of job.repositories){
      const [commits, prs, techStack] = await Promise.all([
        fetchRepoCommits({
          accessToken,
          owner: repoOwner,
          repo: repoName,
          limit: 100,
        }),
        fetchRepoPullRequests({
          accessToken,
          owner: repoOwner,
          repo: repoName,
          limit: 100,
        }),
        detectRepoTechStack({
          accessToken,
          owner: repoOwner,
          repo: repoName,
        })
      ]);      
      await prisma.analysisRepository.update({
        where: {
          id
        },
        data: {
          commits: commits as any,
          pullRequests: prs as any,
          techStack,
          status: "COMPLETED" as const,
        }
      })
    }

    // Aggregate all data from all repositories
    const updatedJob = await getAnalysisJob(jobId);
    const allCommits = updatedJob.repositories.flatMap(r => (r.commits as any) || []);
    const allPRs = updatedJob.repositories.flatMap(r => (r.pullRequests as any) || []);
    const allTechStack = [...new Set(updatedJob.repositories.flatMap(r => r.techStack || []))];

    logger.info({ 
      jobId, 
      totalCommits: allCommits.length, 
      totalPRs: allPRs.length, 
      techStack: allTechStack 
    }, 'Data aggregated from all repositories');

    // TODO: Call AI to generate resume bullets
    // const bullets = await generateResumeBullets({ commits: allCommits, prs: allPRs, techStack: allTechStack });
    // await saveAnalysisResults({ jobId, bullets, summary: '...', topSkills: allTechStack });

    // Update job status to COMPLETED
    await updateJobStatus({
      jobId: job.id,
      status: 'COMPLETED',
    });

    logger.info({
      jobId: job.id,
      userId: job.userId,
      elapsedMs: Date.now() - startedAt,
    }, 'worker analysis.process success');

    } catch (err) {
      logger.error({
        err,
        jobId: job.id,
        userId: job.userId,
        elapsedMs: Date.now() - startedAt,
      }, 'worker analysis.process failed');

      const jobError = toJobError(err);

      await updateJobStatus({
        jobId: job.id,
        status: 'FAILED',
        errorMessage: jobError.message,
      });

      throw err;
    }
  }
};
