import type { NextFunction, Request, Response } from 'express';
import { ErrorCode } from 'shared';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/AppError';
import type { ClerkLocals } from '../types/locals';
import { getResumeForUser } from '../services/resume.service';
import { retryResumeGeneration } from '../services/resume-generation.service';

export const getResumeController = async (
  req: Request,
  res: Response<unknown, ClerkLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId } = res.locals;
    const resume = await getResumeForUser({
      resumeId: req.params.id,
      userId: clerkUserId,
    });
    if (!resume) {
      throw new AppError('Resume not found', ErrorCode.NOT_FOUND, 404);
    }
    return successResponse(res, resume, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * Restarts generation for the user's resume and returns its id. Answers 404 for
 * a resume that is not theirs, 409 when it cannot be retried and 503 when the
 * retry could not be queued.
 */
export const retryResumeController = async (
  req: Request,
  res: Response<unknown, ClerkLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId } = res.locals;
    const retry = await retryResumeGeneration({
      resumeId: req.params.id,
      userId: clerkUserId,
    });

    return successResponse(res, retry, 200);
  } catch (err) {
    next(err);
  }
};
