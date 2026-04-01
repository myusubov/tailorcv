import { Router } from 'express';
import { requireClerkAuth } from '../middleware/auth';
import {
  getOnboardingStatusController,
  generateOnboardingController,
  getOnboardingJobController,
  generateFromAboutMeController,
  generateFromGithubController,
  streamOnboardingJobController,
} from '../controllers/onboarding.controller';
import { upload } from '../middleware/upload';
import { validateBody } from '../middleware/validate';
import {
  onboardingGenerateBaseBodySchema,
  onboardingGithubBodySchema,
} from '../schemas/onboarding-generate.schema';
import { idempotency } from '../middleware/idempotency';

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
  idempotency(),
  generateOnboardingController,
);

onboardingRouter.post(
  '/about-me',
  requireClerkAuth,
  upload.single('file'),
  idempotency(),
  generateFromAboutMeController,
);

onboardingRouter.post(
  '/github',
  requireClerkAuth,
  validateBody(onboardingGithubBodySchema),
  idempotency(),
  generateFromGithubController,
);

onboardingRouter.get('/jobs/:id', requireClerkAuth, getOnboardingJobController);
onboardingRouter.get(
  '/jobs/:id/stream',
  requireClerkAuth,
  streamOnboardingJobController,
);
