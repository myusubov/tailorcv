import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { webhooksRouter } from './webhooks';
import { resumesRouter } from './resumes';
import { onboardingRouter } from './onboarding';
import { githubRouter } from './github';
import { aiChatRouter } from './ai-chat';
import {
  aiChatRateLimiter,
  githubAuthRateLimiter,
  githubApiRateLimiter,
} from '../middleware/rateLimiter';

const router = Router();

// Mount routes with specific rate limiters
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/auth/github', githubAuthRateLimiter, githubRouter);
router.use('/webhooks', webhooksRouter);
router.use('/resumes', resumesRouter);
router.use('/onboarding', onboardingRouter);
router.use('/ai/chat', aiChatRouter);

// Apply GitHub API rate limiter to GitHub-related routes
router.use('/github', githubApiRateLimiter);

export const v1Router = router;

