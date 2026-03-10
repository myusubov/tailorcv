import type { NextFunction, Request, Response } from 'express';
import { successResponse } from '../utils/response';
import type { ClerkLocals, GenerateOnboardingLocals } from '../types/locals';
import { getOnboardingStatus } from '../services/onboarding.service';
import {
  getOnboardingJob,
  startOnboardingJob,
  startOnboardingAboutMeJob,
  startOnboardingGithubJob,
} from '../services/onboarding-jobs.service';
import { extractTextFromFile } from '../utils/file-extraction';
import { logger } from '../lib/logger';
import { addConnection as addJobConnection } from '../services/job-notifier.service';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import {
  initSseResponse,
  setupStreamTermination,
  writeSseEvent,
} from 'src/utils/ai-stream-sse';

export const getOnboardingStatusController = async (
  _req: Request,
  res: Response<unknown, ClerkLocals>,
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
  res: Response<unknown, GenerateOnboardingLocals>,
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
  res: Response<unknown, ClerkLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId } = res.locals;
    const job = await getOnboardingJob({ clerkUserId, jobId: req.params.id });
    return successResponse(res, job, 200);
  } catch (err) {
    next(err);
  }
};

export const generateFromAboutMeController = async (
  req: Request,
  res: Response<unknown, ClerkLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId } = res.locals;
    const file = req.file;

    if (!file) {
      throw new AppError('No file uploaded', ErrorCode.BAD_REQUEST, 400);
    }

    logger.info(
      { clerkUserId, filename: file.originalname },
      'extracting text from about-me file',
    );
    const text = await extractTextFromFile(file.buffer, file.mimetype);

    if (!text || text.trim().length < 50) {
      throw new AppError(
        'The uploaded file is too short or empty. Please provide a more detailed document.',
        ErrorCode.INSUFFICIENT_DATA,
        400,
      );
    }

    logger.info({ clerkUserId }, 'onboarding about-me enqueue start');
    const result = await startOnboardingAboutMeJob({ clerkUserId, text });

    return successResponse(res, result, 202);
  } catch (err) {
    next(err);
  }
};

export const generateFromGithubController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { clerkUserId } = res.locals as ClerkLocals;
    const { repositoryIds } = req.body as { repositoryIds: string[] };

    logger.info(
      { clerkUserId, repositoryCount: repositoryIds.length },
      'onboarding github enqueue start',
    );
    const result = await startOnboardingGithubJob({
      clerkUserId,
      repositoryIds,
    });

    return successResponse(res, result, 202);
  } catch (err) {
    next(err);
  }
};

export const streamOnboardingJobController = async (
  req: Request<{ id: string }>,
  res: Response<unknown, ClerkLocals>,
  _next: NextFunction,
) => {
  const jobId = req.params.id;
  const { clerkUserId } = res.locals;

  // Set SSE headers
  initSseResponse(res);

  // Keep connection alive with retry instruction
  res.write('retry: 10000\n\n');

  // Immediately send the current status if possible
  try {
    const job = await getOnboardingJob({ jobId, clerkUserId });
    writeSseEvent(res, job);
  } catch (err) {
    logger.warn(
      { jobId, clerkUserId, err },
      'Failed to fetch initial job state for stream',
    );
  }

  // Subscribe to updates
  const unsubscribe = addJobConnection(jobId, (data) => {
    writeSseEvent(res, data);
  });

  setupStreamTermination(req, {
    clerkUserId,
    conversationId: jobId, // Passing jobId here for the logger
    onTerminate: () => unsubscribe(),
  });
};
