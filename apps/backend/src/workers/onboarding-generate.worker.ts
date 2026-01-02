/* eslint-disable import/no-anonymous-default-export */
import type { Job } from 'bullmq';
import { prisma } from '../lib';
import { logger } from '../lib/logger';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import type { OnboardingJobPayload } from '../types/onboarding-job';
import {
  generateOnboarding,
  generateFromAboutMe,
  generateFromGithub,
} from '../services/onboarding.service';
import { Prisma } from '../../prisma/generated/client/client.js';
import { publishJobUpdate } from '../services/job-notifier.service';

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

/**
 * BullMQ worker processor for onboarding job processing
 */
export default async function (job: Job<{ jobId: string }>) {
  const { jobId } = job.data;
  const startedAt = Date.now();

  logger.info({ jobId }, 'worker onboarding.generate task picked up');

  const dbJob = await prisma.onboardingJob.findUnique({
    where: { id: jobId },
    select: { id: true, userId: true, payload: true },
  });

  if (!dbJob) {
    logger.warn({ jobId }, 'worker onboarding.generate job not found');
    return;
  }

  const updatedJob1 = await prisma.onboardingJob.update({
    where: { id: dbJob.id },
    data: {
      status: 'RUNNING',
      stage: 'CALLING_AI',
      progressPct: 10,
      error: Prisma.JsonNull,
    },
  });
  await publishJobUpdate('job_updates', updatedJob1);
  logger.info(
    {
      jobId: dbJob.id,
      userId: dbJob.userId,
      stage: 'CALLING_AI',
      progressPct: 10,
    },
    'worker onboarding.generate running',
  );

  try {
    const updatedJob2 = await prisma.onboardingJob.update({
      where: { id: dbJob.id },
      data: { stage: 'CALLING_AI', progressPct: 25 },
    });
    await publishJobUpdate('job_updates', updatedJob2);
    logger.info(
      {
        jobId: dbJob.id,
        stage: 'CALLING_AI',
        progressPct: 25,
      },
      'worker onboarding.generate stage',
    );

    const payload = dbJob.payload as unknown as OnboardingJobPayload;

    let result;
    logger.info(
      { jobId: dbJob.id, type: payload._type },
      'worker onboarding.generate routing',
    );

    if (payload._type === 'about-me') {
      result = await generateFromAboutMe({
        clerkUserId: dbJob.userId,
        text: payload.text,
      });
    } else if (payload._type === 'form') {
      result = await generateOnboarding({
        clerkUserId: dbJob.userId,
        body: payload,
      });
    } else if (payload._type === 'github') {
      result = await generateFromGithub({
        clerkUserId: dbJob.userId,
        repositoryIds: payload.repositoryIds,
      });
    }

    const updatedJob3 = await prisma.onboardingJob.update({
      where: { id: dbJob.id },
      data: { stage: 'SAVING', progressPct: 90 },
    });
    await publishJobUpdate('job_updates', updatedJob3);
    logger.info(
      {
        jobId: dbJob.id,
        stage: 'SAVING',
        progressPct: 90,
      },
      'worker onboarding.generate stage',
    );

    const updatedJob4 = await prisma.onboardingJob.update({
      where: { id: dbJob.id },
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
    await publishJobUpdate('job_updates', updatedJob4);
    logger.info(
      {
        jobId: dbJob.id,
        userId: dbJob.userId,
        baseResumeId: result?.baseResumeId,
        elapsedMs: Date.now() - startedAt,
      },
      'worker onboarding.generate success',
    );
  } catch (err) {
    logger.error(
      {
        err,
        jobId: dbJob.id,
        userId: dbJob.userId,
        elapsedMs: Date.now() - startedAt,
      },
      'worker onboarding.generate failed',
    );

    const jobError = toJobError(err);
    const rawAiResponse =
      err instanceof AppError && err.details?.rawAiResponse
        ? err.details.rawAiResponse
        : Prisma.JsonNull;

    const failedJob = await prisma.onboardingJob.update({
      where: { id: dbJob.id },
      data: {
        status: 'FAILED',
        stage: 'FAILED',
        progressPct: 100,
        error: jobError,
        rawAiResponse,
      },
    });
    await publishJobUpdate('job_updates', failedJob);
    
    throw err; // Re-throw so BullMQ knows the job failed
  }
}
