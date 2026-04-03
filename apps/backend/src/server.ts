import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { clerkMiddleware } from '@clerk/express';
import { v1Router } from './routes';
import { env } from './config/env';
import { errorHandler } from './middleware/error';
import { AppError } from './utils/AppError';
import { ErrorCode } from 'shared';
import { logger, requestLogger } from './lib/logger';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { onboardingQueue, analysisQueue } from './lib/queue';
import { requireAdmin } from './middleware/admin';
import { prisma } from './lib/prisma';
import { redisPublisher, redisSubscriber } from './lib/redis';
import { globalRateLimiter } from './middleware/rateLimiter';
import { jsonParser, urlencodedParser } from './middleware/bodyParser';

dotenv.config();

const app = express();
// Trust first proxy (Fly.io load balancer) so X-Forwarded-For is used for client IP
app.set('trust proxy', 1);
const PORT = env.PORT;

// Middleware
app.use(cors());
app.use(jsonParser);
app.use(urlencodedParser);
app.use(clerkMiddleware());
app.use(requestLogger);

// Apply global rate limiting to all API routes
app.use('/api', globalRateLimiter);

// Bull Board UI for queue monitoring
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(onboardingQueue),
    new BullMQAdapter(analysisQueue),
  ],
  serverAdapter,
});

// Protect Bull Board with admin-only access
app.use('/admin/queues', serverAdapter.getRouter());

// Routes
app.use('/api/v1', v1Router);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TailorCV Backend API',
    version: '0.1.0',
    // endpoints: {
    //   health: '/health',
    // },
  });
});

// 404 handler
app.use((req, res, next) => {
  next(
    new AppError(`Cannot ${req.method} ${req.path}`, ErrorCode.NOT_FOUND, 404),
  );
});

// Global Error Handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Backend server listening');
  console.log('Force restart for schema update');
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown...');

  // Stop accepting new connections
  server.close(async (err) => {
    if (err) {
      logger.error({ error: err }, 'Error during server shutdown');
      process.exit(1);
    }

    logger.info('HTTP server closed, cleaning up resources...');

    try {
      // Disconnect Prisma
      await prisma.$disconnect();
      logger.info('Prisma disconnected');

      // Disconnect Redis clients
      await Promise.all([redisPublisher.quit(), redisSubscriber.quit()]);
      logger.info('Redis clients disconnected');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during resource cleanup');
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
