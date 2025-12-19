import type { NextFunction, Request, Response } from 'express';
import { successResponse } from '../utils/response';
import type { ClerkLocals, GenerateOnboardingLocals } from '../types/locals';
import { generateOnboarding, getOnboardingStatus } from '../services/onboarding.service';

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
    const result = await generateOnboarding({
      body,
      clerkUserId,
    });
    return successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};
