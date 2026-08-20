import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../lib/redis';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import { logger } from '../lib/logger';

interface IdempotencyOptions {
  ttl?: number; // Time to live in seconds
}

/**
 * Middleware to handle idempotency for POST requests.
 * Uses Redis to track request keys and prevent duplicate processing.
 * Note: Depends on requireClerkAuth middleware to populate res.locals.clerkUserId.
 */
export const idempotency = (options: IdempotencyOptions = {}) => {
  const { ttl = 86400 } = options; // Default 24 hours

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only apply to POST requests
    if (req.method !== 'POST') {
      return next();
    }

    const key = req.headers['x-idempotency-key'] as string;
    const { clerkUserId } = res.locals;

    // If no key is provided, skip idempotency check
    if (!key) {
      return next();
    }

    // Strict check: we expect clerkUserId from requireClerkAuth
    if (!clerkUserId) {
      logger.error('Idempotency middleware called without authenticated user');
      return next(
        new AppError('Authentication required', ErrorCode.UNAUTHORIZED, 401),
      );
    }

    const redisKey = `idempotency:${clerkUserId}:${key}`;

    try {
      // Check if the key exists in Redis
      const existing = await redisClient.get(redisKey);

      if (existing) {
        const { status } = JSON.parse(existing);

        if (status === 'processing') {
          logger.warn({ redisKey }, 'Duplicate request detected - already processing');
          return next(
            new AppError(
              'Request already in progress',
              ErrorCode.IDEMPOTENCY_CONFLICT,
              409,
            ),
          );
        }

        if (status === 'completed') {
          logger.info({ redisKey }, 'Duplicate request detected - already completed');
          req.isIdempotentReplay = true;
          return next();
        }
      }

      // Mark the request as processing
      await redisClient.set(
        redisKey,
        JSON.stringify({ status: 'processing', timestamp: Date.now() }),
        'EX',
        ttl,
      );

      // Attach helper to the response object to mark as completed manually
      res.markIdempotentCompleted = async () => {
        await redisClient.set(
          redisKey,
          JSON.stringify({ status: 'completed', timestamp: Date.now() }),
          'EX',
          ttl,
        );
      };

      next();
    } catch (error) {
      logger.error({ err: error, redisKey }, 'Idempotency middleware error');
      // If Redis fails, we still want to process the request
      next();
    }
  };
};
