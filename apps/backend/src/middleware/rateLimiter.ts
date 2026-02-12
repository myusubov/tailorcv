import rateLimit from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { redisPublisher } from '../lib/redis';
import { errorResponse } from '../utils/response';
import { ErrorCode } from 'shared';
import type { Request, Response } from 'express';

/**
 * Global rate limiter for all API routes
 * - 100 requests per 15 minutes per IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // Limit each IP to 250 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisPublisher.call(command, ...args) as Promise<RedisReply>,
    prefix: 'rl:global:',
  }),
  handler: (req: Request, res: Response) => {
    errorResponse(
      res,
      'Too many requests. Please try again later.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED,
    );
  },
  skip: (req: Request) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/api/v1/health';
  },
});

/**
 * Strict rate limiter for AI chat routes
 * - 20 requests per 15 minutes per IP
 * - Prevents abuse of expensive OpenAI API calls
 */
export const aiChatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 AI chat requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisPublisher.call(command, ...args) as Promise<RedisReply>,
    prefix: 'rl:ai-chat:',
  }),
  handler: (req: Request, res: Response) => {
    errorResponse(
      res,
      'AI chat rate limit exceeded. Please wait before sending more messages.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED,
    );
  },
});

/**
 * Moderate rate limiter for AI conversation CRUD operations
 * - 100 requests per 15 minutes per IP
 * - Less strict than AI chat (which calls OpenAI API)
 * - Protects against conversation spam/deletion abuse
 */
export const aiConversationCrudRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // More lenient than AI chat messages
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisPublisher.call(command, ...args) as Promise<RedisReply>,
    prefix: 'rl:ai-conv-crud:',
  }),
  handler: (req: Request, res: Response) => {
    errorResponse(
      res,
      'Too many conversation operations. Please wait before trying again.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED,
    );
  },
});

/**
 * Rate limiter for GitHub OAuth routes
 * - 10 requests per 15 minutes per IP
 * - Prevents OAuth callback abuse
 * - Skipped in development so you can test chaos/flows without 429
 */
export const githubAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OAuth attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisPublisher.call(command, ...args) as Promise<RedisReply>,
    prefix: 'rl:github-auth:',
  }),
  handler: (req: Request, res: Response) => {
    errorResponse(
      res,
      'GitHub authentication rate limit exceeded. Please try again later.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED,
    );
  },
  skip: () => process.env.NODE_ENV === 'development',
});

/**
 * Rate limiter for GitHub API proxy routes
 * - 50 requests per 15 minutes per IP
 * - Prevents excessive GitHub API calls
 * - Skipped in development so you can test chaos/flows without 429
 */
export const githubApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 GitHub API requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisPublisher.call(command, ...args) as Promise<RedisReply>,
    prefix: 'rl:github-api:',
  }),
  handler: (req: Request, res: Response) => {
    errorResponse(
      res,
      'GitHub API rate limit exceeded. Please try again later.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED,
    );
  },
  skip: () => process.env.NODE_ENV === 'development',
});
