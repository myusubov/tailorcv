import { Router } from 'express';
import { healthRouter } from './health.router';
import { authRouter } from './auth.router';
import { webhooksRouter } from './webhooks.router';
import { resumesRouter } from './resumes.router';
import { onboardingRouter } from './onboarding.router';
import { githubRouter } from './github.router';
import { aiChatRouter } from './ai-chat.router';
import {
  aiChatRateLimiter,
  githubAuthRateLimiter,
  githubApiRateLimiter,
} from '../middleware/rateLimiter';

const router = Router();

// Mount routes with specific rate limiters
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/auth/github', githubRouter);
router.use('/webhooks', webhooksRouter);
router.use('/resumes', resumesRouter);
router.use('/onboarding', onboardingRouter);
router.use('/ai/chat', aiChatRouter);

export const v1Router = router;
