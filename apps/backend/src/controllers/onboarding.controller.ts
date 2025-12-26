import type { NextFunction, Request, Response } from 'express';
import { successResponse } from '../utils/response';
import type { ClerkLocals, GenerateOnboardingLocals } from '../types/locals';
import { getOnboardingStatus } from '../services/onboarding.service';
import {
  getOnboardingJob,
  startOnboardingJob,
} from '../services/onboarding-jobs.service';
import { logger } from '../lib/logger';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';

export const getOnboardingStatusController = async (
  _req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId } = res.locals;
    const { hasBaseResume, latestBaseResumeId } = await getOnboardingStatus({
      clerkUserId,
    });
    return successResponse(res, { hasBaseResume, latestBaseResumeId }, 200);
  } catch (err) {
    next(err);
  }
};

export const generateOnboardingController = async (
  _req: Request,
  res: Response<any, GenerateOnboardingLocals>,
  next: NextFunction,
) => {
  try {
    const { body, clerkUserId } = res.locals;
    logger.info(
      { clerkUserId, model: body.model ?? null },
      'onboarding enqueue start',
    );
    logger.debug(
      {
        clerkUserId,
        experiencesCount: body.experiences?.length ?? 0,
        projectsCount: body.projects?.length ?? 0,
        skillsCount: body.skills?.length ?? 0,
        hasSummary: Boolean(body.summary?.trim?.()),
      },
      'onboarding enqueue input stats',
    );
    const result = await startOnboardingJob({ clerkUserId, body });
    logger.info({ clerkUserId, jobId: result.jobId }, 'onboarding job queued');
    return successResponse(res, result, 202);
  } catch (err) {
    next(err);
  }
};

export const getOnboardingJobController = async (
  req: Request<{ id: string }>,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId } = res.locals;
    logger.debug(
      { clerkUserId, jobId: req.params.id },
      'onboarding job status request',
    );
    const job = await getOnboardingJob({ clerkUserId, jobId: req.params.id });
    logger.info(
      {
        clerkUserId,
        jobId: job.id,
        status: job.status,
        stage: job.stage,
        progressPct: job.progressPct,
        resultBaseResumeId: job.resultBaseResumeId ?? null,
      },
      'onboarding job status',
    );
    return successResponse(res, job, 200);
  } catch (err) {
    next(err);
  }
};
