import { Router } from 'express';
import { requireClerkAuth } from '../middleware/auth';
import {
  getOnboardingStatusController,
  generateOnboardingController,
  getOnboardingJobController,
} from '../controllers/onboarding.controller';
import { validateBody } from '../middleware/validate';
import { onboardingGenerateBaseBodySchema } from '../schemas/onboarding-generate.schema';

export const onboardingRouter = Router();

onboardingRouter.get(
  '/status',
  requireClerkAuth,
  getOnboardingStatusController,
);

onboardingRouter.post(
  '/generate',
  requireClerkAuth,
  validateBody(onboardingGenerateBaseBodySchema),
  generateOnboardingController,
);

onboardingRouter.get(
  '/jobs/:id',
  requireClerkAuth,
  getOnboardingJobController,
);
