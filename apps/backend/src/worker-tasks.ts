import type { TaskList } from 'graphile-worker';
import { ErrorCode } from 'shared';

import { prisma } from './lib';
import { Prisma } from '../prisma/generated/client/client.js';
import { AppError } from './utils/AppError';
import type { OnboardingGenerateBaseBody } from './schemas/onboarding-generate.schema';
import { generateOnboarding } from './services/onboarding.service';
import { logger } from './lib/logger';

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
    logger.info({ jobId }, 'worker onboarding.generate start');

    const job = await prisma.onboardingJob.findUnique({
      where: { id: jobId },
      select: { id: true, userId: true, payload: true },
    });

    if (!job) throw new AppError('Job not found', ErrorCode.NOT_FOUND, 404);

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

      const result = await generateOnboarding({
        clerkUserId: job.userId,
        body: job.payload as OnboardingGenerateBaseBody,
      });

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
          resultBaseResumeId: result.baseResumeId,
          error: Prisma.JsonNull,
        },
      });
      logger.info(
        {
          jobId: job.id,
          userId: job.userId,
          baseResumeId: result.baseResumeId,
          elapsedMs: Date.now() - startedAt,
        },
        'worker onboarding.generate success',
      );
    } catch (err) {
      logger.error(
        {
          jobId: job.id,
          userId: job.userId,
          elapsedMs: Date.now() - startedAt,
          message:
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message?: unknown }).message)
              : undefined,
        },
        'worker onboarding.generate failed',
      );
      await prisma.onboardingJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          stage: 'FAILED',
          progressPct: 100,
          error: toJobError(err),
        },
      });
    }
  },
};
