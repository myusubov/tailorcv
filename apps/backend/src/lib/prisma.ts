import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client/client.js';
import { logger } from './logger';

const connectionString = process.env.DATABASE_URL;

// Log connection details (host/port only; never log password)
if (connectionString) {
  try {
    const url = new URL(connectionString);
    logger.info(
      {
        host: url.hostname,
        port: url.port,
        database: url.pathname?.replace(/^\//, '') || undefined,
      },
      'Prisma DB connection config',
    );
  } catch (e) {
    logger.warn({ err: e }, 'Could not parse DATABASE_URL for logging');
  }
} else {
  logger.error('DATABASE_URL is not set');
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// PrismaClient singleton pattern for development
// Prevents multiple instances during hot-reload

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    adapter,
    // log:
    //   process.env.NODE_ENV === 'development'
    //     ? ['query', 'error', 'warn']
    //     : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;
