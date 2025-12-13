import { Router } from 'express';
import { requireClerkAuth } from '../middleware/auth';
import { getOnboardingStatusController } from '../controllers/onboarding.controller';

export const onboardingRouter = Router();

onboardingRouter.get(
  '/status',
  requireClerkAuth,
  getOnboardingStatusController,
)