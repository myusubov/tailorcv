import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { webhooksRouter } from './webhooks';
import { resumesRouter } from './resumes';
import { onboardingRouter } from './onboarding';
import { githubRouter } from './github';

const router = Router();

// Mount routes
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/auth/github', githubRouter);
router.use('/webhooks', webhooksRouter);
router.use('/resumes', resumesRouter);
router.use('/onboarding', onboardingRouter);

export const v1Router = router;
