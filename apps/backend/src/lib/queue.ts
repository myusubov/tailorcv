import { Queue, QueueOptions } from 'bullmq';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * BullMQ connection configuration
 * Reuses the same Redis instance as pub/sub
 */
const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port) || 6379,
  password: new URL(env.REDIS_URL).password || undefined,
  tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
};

const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Remove after 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
    },
  },
};

/**
 * Queue for onboarding job processing
 */
export const onboardingQueue = new Queue(
  'onboarding.generate',
  defaultQueueOptions,
);

/**
 * Queue for GitHub analysis job processing
 */
export const analysisQueue = new Queue('analysis.process', defaultQueueOptions);

/**
 * Helper function to add a job to a queue
 * Replaces Graphile's workerUtils.addJob()
 */
export async function addJob(
  queueName: 'onboarding.generate' | 'analysis.process',
  data: any,
  options?: { jobKey?: string },
) {
  const queue =
    queueName === 'onboarding.generate' ? onboardingQueue : analysisQueue;

  const jobOptions = options?.jobKey
    ? { jobId: options.jobKey } // Use jobKey as jobId for deduplication
    : {};

  const job = await queue.add(queueName, data, jobOptions);

  logger.info({ queueName, jobId: job.id }, 'Job added to BullMQ queue');

  return job;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing BullMQ queues...');
  await Promise.all([onboardingQueue.close(), analysisQueue.close()]);
});

process.on('SIGINT', async () => {
  logger.info('Closing BullMQ queues...');
  await Promise.all([onboardingQueue.close(), analysisQueue.close()]);
});
