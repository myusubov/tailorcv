import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Path to the schema file
  schema: 'prisma/schema.prisma',

  // Configuration for Prisma migrations
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  // Database connection configuration
  datasource: {
    url: env('DATABASE_URL'),
    shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
  },

  // Configuration for database views (if needed)
  views: {
    path: 'prisma/views',
  },

  // Configuration for typedSql preview feature (if needed)
  typedSql: {
    path: 'prisma/sql',
  },

  // Experimental features
  experimental: {
    externalTables: false,
  },
});
