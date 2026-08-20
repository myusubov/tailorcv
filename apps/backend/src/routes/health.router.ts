import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { redisClient } from '../lib/redis';
import { logger } from '../lib/logger';

export const healthRouter = Router();

interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  dependencies: {
    database: {
      status: 'ok' | 'error';
      message?: string;
      responseTime?: number;
    };
    redis: {
      status: 'ok' | 'error';
      message?: string;
      responseTime?: number;
    };
  };
}

healthRouter.get('/', async (req, res) => {
  const healthCheck: HealthCheckResult = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'backend',
    version: '0.1.0',
    dependencies: {
      database: { status: 'ok' },
      redis: { status: 'ok' },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbTime = Date.now() - dbStart;
    healthCheck.dependencies.database = {
      status: 'ok',
      responseTime: dbTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: error }, 'Database health check failed');
    healthCheck.dependencies.database = {
      status: 'error',
      message: errorMessage,
    };
    healthCheck.status = 'unhealthy';
  }

  // Check Redis connectivity
  try {
    const redisStart = Date.now();
    await redisClient.ping();
    const redisTime = Date.now() - redisStart;
    healthCheck.dependencies.redis = {
      status: 'ok',
      responseTime: redisTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: error }, 'Redis health check failed');
    healthCheck.dependencies.redis = {
      status: 'error',
      message: errorMessage,
    };
    healthCheck.status = 'unhealthy';
  }

  // Return 503 if any critical dependency is down
  const statusCode = healthCheck.status === 'unhealthy' ? 503 : 200;

  res.status(statusCode).json(healthCheck);
});
