import { Queue } from 'bullmq';
import { logger } from './logger';
import type { ResumeGenerationJobData } from '../types/resume';
import { createRedisConnection, RESUME_GENERATION_QUEUE } from './queue-config';

export const resumeGenerationQueue = new Queue<ResumeGenerationJobData>(RESUME_GENERATION_QUEUE, {
  // Rejects add() immediately when Redis is down instead of waiting for it to reconnect.
  connection: createRedisConnection({ enableOfflineQueue: false }),
  defaultJobOptions: {
    removeOnComplete: { age: 60 * 60, count: 100 },
    removeOnFail: { age: 7 * 24 * 60 * 60, count: 500 },
  },
});

resumeGenerationQueue.on('error', (err) => {
  logger.error({ err }, 'Resume generation queue error');
});
