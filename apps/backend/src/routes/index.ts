import { Router } from 'express';
import { healthRouter } from './health.router';
import { authRouter } from './auth.router';
import { webhooksRouter } from './webhooks.router';
import { onboardingRouter } from './onboarding.router';
import { githubRouter } from './github.router';
import { resumeRouter } from './resume.router';

const router = Router();

// Mount routes with specific rate limiters
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/auth/github', githubRouter);
router.use('/webhooks', webhooksRouter);
router.use('/onboarding', onboardingRouter);
router.use('/resumes', resumeRouter);

export const v1Router = router;
