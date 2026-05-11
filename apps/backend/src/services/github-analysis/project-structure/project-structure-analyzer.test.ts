import { describe, expect, it } from 'vitest';
import {
  analyzeProjectStructure,
  type RepoTreeEntry,
} from './project-structure-analyzer';

function directory(path: string): RepoTreeEntry {
  const parts = path.split('/');
  return {
    path,
    name: parts[parts.length - 1] ?? path,
    type: 'directory',
    depth: parts.length - 1,
    parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
    extension: null,
    sizeBytes: null,
  };
}

function file(path: string): RepoTreeEntry {
  const parts = path.split('/');
  const name = parts[parts.length - 1] ?? path;
  const extensionMatch = name.match(/\.([^.]+)$/);

  return {
    path,
    name,
    type: 'file',
    depth: parts.length - 1,
    parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
    extension: extensionMatch?.[1] ?? null,
    sizeBytes: 100,
  };
}

function analyze(entries: RepoTreeEntry[]) {
  return analyzeProjectStructure({
    repository: {
      id: 1,
      repositoryFullName: 'myusubov/example',
    },
    entries,
    isTruncated: false,
  });
}

describe('analyzeProjectStructure', () => {
  it('detects a full-stack monorepo from app and package boundaries', () => {
    const result = analyze([
      directory('apps'),
      directory('apps/frontend'),
      directory('apps/frontend/app'),
      file('apps/frontend/next.config.ts'),
      file('apps/frontend/app/page.tsx'),
      directory('apps/backend'),
      directory('apps/backend/src'),
      directory('apps/backend/src/routes'),
      directory('apps/backend/src/controllers'),
      directory('apps/backend/src/services'),
      directory('apps/backend/prisma'),
      file('apps/backend/prisma/schema.prisma'),
      directory('packages'),
      directory('packages/shared'),
      file('turbo.json'),
    ]);

    expect(result.summary.projectShape).toBe('full-stack monorepo');
    expect(result.summary.inferredStack).toEqual([
      'Express',
      'Next.js',
      'Prisma',
      'Turborepo',
    ]);
  });

  it('detects a frontend app from frontend framework structure', () => {
    const result = analyze([
      directory('app'),
      file('app/page.tsx'),
      directory('components'),
      file('components/site-header.tsx'),
      file('next.config.ts'),
      file('package.json'),
    ]);

    expect(result.summary.projectShape).toBe('frontend app');
    expect(result.summary.inferredStack).toEqual([
      'Next.js',
      'Node.js/TypeScript',
    ]);
  });

  it('detects a backend API from layered backend folders', () => {
    const result = analyze([
      directory('src'),
      directory('src/routes'),
      directory('src/controllers'),
      directory('src/services'),
      directory('prisma'),
      file('prisma/schema.prisma'),
      file('package.json'),
      file('tsconfig.json'),
    ]);

    expect(result.summary.projectShape).toBe('backend api');
    expect(result.summary.inferredStack).toEqual([
      'Express',
      'Node.js/TypeScript',
      'Prisma',
    ]);
  });

  it('detects a library package from package entry structure', () => {
    const result = analyze([
      directory('src'),
      file('src/index.ts'),
      file('package.json'),
      file('tsconfig.json'),
      file('README.md'),
    ]);

    expect(result.summary.projectShape).toBe('library/package');
    expect(result.summary.inferredStack).toEqual(['Node.js/TypeScript']);
  });

  it('keeps weak repository structure unknown', () => {
    const result = analyze([file('README.md')]);

    expect(result.summary.projectShape).toBe('unknown');
    expect(result.summary.inferredStack).toEqual([]);
  });
});
