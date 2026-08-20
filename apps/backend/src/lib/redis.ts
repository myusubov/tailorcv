import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Redis client for publishing messages
 * Used by workers and services to publish job updates
 */
export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

/**
 * Redis client for subscribing to messages
 * Used by SSE routes to listen for job updates
 * Note: Redis requires a separate connection for pub/sub
 */
export const redisSubscriber = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

// Connect both clients on initialization
Promise.all([redisClient.connect(), redisSubscriber.connect()])
  .then(() => {
    logger.info('Redis clients connected successfully');
  })
  .catch((error) => {
    logger.error({ err: error }, 'Failed to connect to Redis');
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Disconnecting Redis clients...');
  await Promise.all([redisClient.quit(), redisSubscriber.quit()]);
});

process.on('SIGINT', async () => {
  logger.info('Disconnecting Redis clients...');
  await Promise.all([redisClient.quit(), redisSubscriber.quit()]);
});
