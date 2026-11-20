import { Worker } from 'bullmq';
import { logger } from './logger';
import type { ResumeGenerationJobData } from '../types/resume';
import { createRedisConnection, RESUME_GENERATION_QUEUE } from './queue-config';
import {
  failResumeGeneration,
  generateResume,
} from '../services/resume-generation.service';

// BullMQ throws if a Worker's connection does not use null here.
const connection = createRedisConnection({ maxRetriesPerRequest: null });

export const resumeGenerationWorker = new Worker<ResumeGenerationJobData>(
  RESUME_GENERATION_QUEUE,
  async (job) => generateResume(job.data.resumeId),
  { connection },
);

resumeGenerationWorker.on('error', (err) => {
  logger.error({ err }, 'Resume generation worker error');
});

// BullMQ emits 'failed' after every attempt, so only the last one marks the resume.
resumeGenerationWorker.on('failed', (job, err) => {
  if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;

  const { resumeId } = job.data;
  logger.error(
    { err, resumeId },
    'Resume generation failed after all attempts',
  );
  failResumeGeneration({ resumeId, error: err }).catch((markError) => {
    logger.error(
      { err: markError, resumeId },
      'Could not mark resume as failed',
    );
  });
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Closing resume generation worker');
  try {
    await resumeGenerationWorker.close();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error closing resume generation worker');
    process.exit(1);
  }
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception in worker');
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled rejection in worker');
  process.exit(1);
});
