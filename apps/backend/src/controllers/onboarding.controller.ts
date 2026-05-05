import type { NextFunction, Request, Response } from 'express';
import { successResponse } from '../utils/response';
import type { ClerkLocals } from '../types/locals';
import { getOnboardingStatus } from '../services/onboarding.service';

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
