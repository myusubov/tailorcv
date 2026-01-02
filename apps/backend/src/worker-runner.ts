import { Worker } from 'bullmq';
import { env } from './config/env';
import { logger } from './lib/logger';

/**
 * BullMQ Worker Runner
 * Uses inline processors instead of sandboxed workers for Windows compatibility
 */

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port) || 6379,
  password: new URL(env.REDIS_URL).password || undefined,
  tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
};

// Import worker processors
import onboardingProcessor from './workers/onboarding-generate.worker';
import analysisProcessor from './workers/analysis-process.worker';

/**
 * Onboarding job worker
 * Runs inline (not sandboxed) for Windows compatibility
 */
const onboardingWorker = new Worker('onboarding.generate', onboardingProcessor, {
    connection,
    concurrency: 2,
    limiter: {
      max: 10,
      duration: 1000,
    },
    settings: {
      backoffStrategy: (attemptsMade) => {
        // Exponential backoff: 2s, 4s, 8s, max 30s
        return Math.min(Math.pow(2, attemptsMade) * 1000, 30000);
      },
    },
  },
);

/**
 * Analysis job worker
 * Runs inline (not sandboxed) for Windows compatibility
 */
const analysisWorker = new Worker('analysis.process', analysisProcessor, {
    connection,
    concurrency: 1, // GitHub API rate limits
    limiter: {
      max: 5,
      duration: 1000,
    },
    settings: {
      backoffStrategy: (attemptsMade) => {
        // Exponential backoff: 2s, 4s, 8s, max 30s
        return Math.min(Math.pow(2, attemptsMade) * 1000, 30000);
      },
    },
  },
);

// Event handlers for onboarding worker
onboardingWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Onboarding job completed');
});

onboardingWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Onboarding job failed');
});

onboardingWorker.on('error', (err) => {
  logger.error({ err }, 'Onboarding worker error');
});

// Event handlers for analysis worker
analysisWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Analysis job completed');
});

analysisWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Analysis job failed');
});

analysisWorker.on('error', (err) => {
  logger.error({ err }, 'Analysis worker error');
});

logger.info('BullMQ workers started');

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down workers...');
  await Promise.all([onboardingWorker.close(), analysisWorker.close()]);
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
