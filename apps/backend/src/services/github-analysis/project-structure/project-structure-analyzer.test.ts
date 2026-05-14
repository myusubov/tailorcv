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

function areaByName(
  result: ReturnType<typeof analyze>,
  name: string,
  path: string,
) {
  return result.detectedAreas.find(
    (area) => area.name === name && area.path === path,
  );
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
    expect(areaByName(result, 'Frontend app', 'apps/frontend')).toMatchObject({
      confidence: expect.any(Number),
      evidence: expect.arrayContaining([
        'apps/frontend/next.config.ts',
        'apps/frontend/app',
      ]),
    });
    expect(areaByName(result, 'Backend API', 'apps/backend')).toMatchObject({
      confidence: expect.any(Number),
      evidence: expect.arrayContaining([
        'apps/backend/src/routes',
        'apps/backend/src/controllers',
        'apps/backend/src/services',
      ]),
    });
    expect(
      areaByName(result, 'Database schema', 'apps/backend/prisma'),
    ).toMatchObject({
      confidence: expect.any(Number),
      evidence: expect.arrayContaining(['apps/backend/prisma/schema.prisma']),
    });
    expect(
      areaByName(result, 'Shared package', 'packages/shared'),
    ).toMatchObject({
      confidence: expect.any(Number),
      evidence: expect.arrayContaining(['packages/shared']),
    });
  });

  it('detects Nx-style monorepos with nonstandard app and service names', () => {
    const result = analyze([
      file('nx.json'),
      directory('apps'),
      directory('apps/web'),
      directory('apps/web/app'),
      file('apps/web/app/page.tsx'),
      file('apps/web/next.config.ts'),
      directory('services'),
      directory('services/api'),
      directory('services/api/src'),
      directory('services/api/src/routes'),
      directory('services/api/src/controllers'),
      directory('services/api/src/services'),
      directory('libs'),
      directory('libs/shared'),
      file('libs/shared/project.json'),
    ]);

    expect(result.summary.projectShape).toBe('full-stack monorepo');
    expect(result.summary.inferredStack).toEqual(['Express', 'Next.js']);
    expect(areaByName(result, 'Frontend app', 'apps/web')).toMatchObject({
      evidence: expect.arrayContaining([
        'apps/web/app',
        'apps/web/next.config.ts',
      ]),
    });
    expect(areaByName(result, 'Backend API', 'services/api')).toMatchObject({
      evidence: expect.arrayContaining([
        'services/api/src/routes',
        'services/api/src/controllers',
        'services/api/src/services',
      ]),
    });
    expect(areaByName(result, 'Shared package', 'libs/shared')).toMatchObject({
      evidence: expect.arrayContaining(['libs/shared']),
    });
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
    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      confidence: expect.any(Number),
      evidence: expect.arrayContaining(['app', 'next.config.ts']),
    });
    expect(
      result.detectedAreas.filter((area) => area.name === 'Frontend app'),
    ).toHaveLength(1);
  });

  it('does not treat frontend routes and services as a backend API', () => {
    const result = analyze([
      directory('public'),
      directory('src'),
      directory('src/routes'),
      directory('src/services'),
      directory('src/lib'),
      directory('src/lib/db'),
      file('src/lib/db/schema.ts'),
      file('drizzle.config.ts'),
      file('vite.config.ts'),
      file('package.json'),
      file('tsconfig.json'),
    ]);

    expect(result.summary.projectShape).toBe('frontend app');
    expect(result.summary.inferredStack).toEqual([
      'Node.js/TypeScript',
      'Vite',
    ]);
    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining(['vite.config.ts']),
    });
    expect(areaByName(result, 'Database schema', '.')).toMatchObject({
      evidence: expect.arrayContaining(['drizzle.config.ts']),
    });
    expect(areaByName(result, 'Database schema', 'src/lib/db')).toMatchObject({
      evidence: expect.arrayContaining(['src/lib/db/schema.ts']),
    });
    expect(
      result.detectedAreas.some((area) => area.name === 'Backend API'),
    ).toBe(false);
  });

  it('detects a backend API from layered backend folders', () => {
    const result = analyze([
      directory('src'),
      directory('src/routes'),
      directory('src/controllers'),
      directory('src/services'),
      directory('prisma'),
      directory('prisma/migrations'),
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
    expect(areaByName(result, 'Backend API', 'src')).toMatchObject({
      evidence: expect.arrayContaining([
        'src/routes',
        'src/controllers',
        'src/services',
      ]),
    });
    expect(areaByName(result, 'Database schema', 'prisma')).toMatchObject({
      evidence: expect.arrayContaining([
        'prisma/migrations',
        'prisma/schema.prisma',
      ]),
    });
    expect(
      result.detectedAreas.filter((area) => area.name === 'Database schema'),
    ).toHaveLength(1);
  });

  it('detects conservative Drizzle database conventions', () => {
    const result = analyze([
      directory('src'),
      directory('src/db'),
      directory('drizzle'),
      file('drizzle.config.ts'),
      file('drizzle/0001_initial.sql'),
      file('src/db/schema.ts'),
      file('src/schema.ts'),
      file('package.json'),
      file('tsconfig.json'),
    ]);

    expect(areaByName(result, 'Database schema', '.')).toMatchObject({
      evidence: expect.arrayContaining(['drizzle.config.ts']),
    });
    expect(areaByName(result, 'Database schema', 'drizzle')).toMatchObject({
      evidence: expect.arrayContaining(['drizzle', 'drizzle/0001_initial.sql']),
    });
    expect(areaByName(result, 'Database schema', 'src/db')).toMatchObject({
      evidence: expect.arrayContaining(['src/db/schema.ts']),
    });
    expect(
      result.detectedAreas.some((area) =>
        area.evidence.includes('src/schema.ts'),
      ),
    ).toBe(false);
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
    expect(result.detectedAreas).toEqual([]);
  });

  it('detects support areas from repository tooling paths', () => {
    const result = analyze([
      directory('.github'),
      directory('.github/workflows'),
      file('.github/workflows/ci.yml'),
      directory('docs'),
      file('docs/architecture.md'),
      directory('tests'),
      file('tests/user-flow.test.ts'),
      file('Dockerfile'),
      file('docker-compose.yml'),
      file('terraform/main.tf'),
      file('package.json'),
    ]);

    expect(
      areaByName(result, 'CI/CD workflows', '.github/workflows'),
    ).toMatchObject({
      evidence: expect.arrayContaining(['.github/workflows/ci.yml']),
    });
    expect(areaByName(result, 'Documentation', 'docs')).toMatchObject({
      evidence: expect.arrayContaining(['docs', 'docs/architecture.md']),
    });
    expect(areaByName(result, 'Test suite', 'tests')).toMatchObject({
      evidence: expect.arrayContaining(['tests/user-flow.test.ts']),
    });
    expect(areaByName(result, 'Containerization', '.')).toMatchObject({
      evidence: expect.arrayContaining(['Dockerfile', 'docker-compose.yml']),
    });
    expect(
      areaByName(result, 'Infrastructure/config', 'terraform'),
    ).toMatchObject({
      evidence: expect.arrayContaining(['terraform/main.tf']),
    });
  });
});
