# Prisma 7 Setup Guide

This document explains how to set up and use Prisma 7 in the backend application.

## 🎯 Overview

Prisma 7 introduces significant changes from previous versions:

- **New Configuration System**: Separated configuration from schema using `prisma.config.ts`
- **ESM-Only**: Now ships as ES modules only
- **Rust-Free Client**: Complete rewrite in TypeScript for better performance
- **Required Output Path**: Prisma Client must be generated to a custom location

## 📁 Project Structure

```
apps/backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   ├── views/                 # Database views (if needed)
│   ├── sql/                   # TypedSQL files (if needed)
│   ├── seed.ts               # Database seeding script
│   └── generated/            # Generated Prisma Client (auto-created)
│       └── client/
├── prisma.config.ts          # Prisma configuration file
├── .env.example             # Environment variables template
└── package.json             # Updated scripts for Prisma 7
```

## ⚙️ Configuration Files

### `prisma.config.ts`

New configuration file that replaces environment variables in the schema:

```typescript
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
    shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
  },
  // ... other configurations
});
```

### `prisma/schema.prisma`

Schema file without database URL (now in config):

```prisma
generator client {
  provider = "prisma-client"
  output   = "./generated/client"
}

datasource db {
  provider = "postgresql"
  // URL is now configured in prisma.config.ts
}
```

## 🚀 Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `SHADOW_DATABASE_URL`: Shadow database for migrations (optional)

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run Database Migrations

```bash
# For development
npm run prisma:migrate

# For production
npm run prisma:migrate:deploy
```

### 5. Seed the Database

```bash
npm run prisma:db:seed
```

## 📝 Available Scripts

### Database Management

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run migrations in development
- `npm run prisma:migrate:deploy` - Deploy migrations to production
- `npm run prisma:migrate:reset` - Reset database and run all migrations
- `npm run prisma:db:push` - Push schema changes without migrations
- `npm run prisma:db:seed` - Run database seeding

### Development Tools

- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:format` - Format schema file
- `npm run prisma:validate` - Validate schema

### Quick Setup

- `npm run db:setup` - Generate client, deploy migrations, and seed
- `npm run db:reset` - Reset database and reseed

## 💻 Usage in Code

### Import Prisma Client

```typescript
import { PrismaClient } from './prisma/generated/client/index.js';

// Use global instance to prevent multiple connections
declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export { prisma };
```

### Using in Your Application

```typescript
import { prisma } from './config/database.js';

// Create a user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});

// Find users
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: '@example.com',
    },
  },
});
```

## 🔧 Migration from Prisma 6

If upgrading from Prisma 6:

1. **Update packages**: `npm install @prisma/client@7 prisma@7`
2. **Update TypeScript config**: Enable ESM support
3. **Add `"type": "module"`** to `package.json`
4. **Create `prisma.config.ts`** with your configuration
5. **Update schema**: Change provider to `prisma-client` and add output
