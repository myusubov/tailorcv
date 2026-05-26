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
    expect(result.summary.inferredStack).toEqual(['Next.js', 'Nx']);
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

  it('scores repeated Next.js route files once per signal type', () => {
    const result = analyze([
      directory('app'),
      directory('app/(main)'),
      directory('app/(main)/projects'),
      file('app/(main)/projects/page.tsx'),
      file('app/(main)/projects/loading.tsx'),
      file('app/(main)/projects/error.tsx'),
      directory('app/(main)/settings'),
      file('app/(main)/settings/page.tsx'),
      file('app/(main)/settings/loading.tsx'),
      file('next.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      confidence: 1,
      evidence: [
        'app',
        'app/(main)/projects/loading.tsx',
        'app/(main)/projects/page.tsx',
        'next.config.ts',
      ],
    });
  });

  it('detects a frontend app from Vite config evidence', () => {
    const result = analyze([
      file('index.html'),
      directory('src'),
      file('src/main.tsx'),
      file('src/App.tsx'),
      file('vite.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'vite.config.ts',
        'index.html',
        'src/main.tsx',
        'src/App.tsx',
      ]),
    });
  });

  it('detects a frontend app from React SPA structure', () => {
    const result = analyze([
      directory('public'),
      file('public/index.html'),
      directory('src'),
      file('src/index.tsx'),
      file('src/App.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'public/index.html',
        'src/index.tsx',
        'src/App.tsx',
      ]),
    });
  });

  it('detects a frontend app from root SvelteKit structure', () => {
    const result = analyze([
      directory('src'),
      file('src/app.html'),
      directory('src/routes'),
      file('src/routes/+page.svelte'),
      file('src/routes/+layout.svelte'),
      file('svelte.config.js'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'svelte.config.js',
        'src/app.html',
        'src/routes',
        'src/routes/+page.svelte',
        'src/routes/+layout.svelte',
      ]),
    });
  });

  it('detects a monorepo frontend app from SvelteKit structure', () => {
    const result = analyze([
      directory('apps'),
      directory('apps/web'),
      directory('apps/web/src'),
      directory('apps/web/src/routes'),
      file('apps/web/src/routes/+page.svelte'),
      file('apps/web/svelte.config.js'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', 'apps/web')).toMatchObject({
      evidence: expect.arrayContaining([
        'apps/web/svelte.config.js',
        'apps/web/src/routes/+page.svelte',
      ]),
    });
  });

  it('does not detect SvelteKit from routes directory alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/routes'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('detects a frontend app from root Astro structure', () => {
    const result = analyze([
      directory('src'),
      directory('src/pages'),
      file('src/pages/index.astro'),
      directory('src/layouts'),
      file('src/layouts/BaseLayout.astro'),
      file('astro.config.mjs'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'astro.config.mjs',
        'src/layouts/BaseLayout.astro',
        'src/pages',
        'src/pages/index.astro',
      ]),
    });
  });

  it('detects a monorepo frontend app from Astro structure', () => {
    const result = analyze([
      directory('apps'),
      directory('apps/site'),
      directory('apps/site/src'),
      directory('apps/site/src/pages'),
      file('apps/site/src/pages/index.astro'),
      file('apps/site/astro.config.mjs'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', 'apps/site')).toMatchObject({
      evidence: expect.arrayContaining([
        'apps/site/astro.config.mjs',
        'apps/site/src/pages/index.astro',
      ]),
    });
  });

  it('does not detect Astro from pages directory alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/pages'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect Astro from content page evidence alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/pages'),
      file('src/pages/about.md'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('detects a frontend app from root Nuxt 4 structure', () => {
    const result = analyze([
      directory('app'),
      file('app/app.vue'),
      directory('app/pages'),
      file('app/pages/index.vue'),
      directory('app/layouts'),
      file('app/layouts/default.vue'),
      file('nuxt.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'app/app.vue',
        'app/layouts/default.vue',
        'app/pages',
        'app/pages/index.vue',
        'nuxt.config.ts',
      ]),
    });
  });

  it('detects a frontend app from root Nuxt 3 structure', () => {
    const result = analyze([
      file('app.vue'),
      directory('pages'),
      file('pages/index.vue'),
      directory('layouts'),
      file('layouts/default.vue'),
      file('nuxt.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'app.vue',
        'layouts/default.vue',
        'nuxt.config.ts',
        'pages',
        'pages/index.vue',
      ]),
    });
  });

  it('detects a monorepo frontend app from Nuxt structure', () => {
    const result = analyze([
      directory('apps'),
      directory('apps/web'),
      directory('apps/web/app'),
      file('apps/web/app/app.vue'),
      directory('apps/web/app/pages'),
      file('apps/web/app/pages/index.vue'),
      file('apps/web/nuxt.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', 'apps/web')).toMatchObject({
      evidence: expect.arrayContaining([
        'apps/web/app/app.vue',
        'apps/web/app/pages/index.vue',
        'apps/web/nuxt.config.ts',
      ]),
    });
  });

  it('does not detect Nuxt from weak hints alone', () => {
    const result = analyze([
      directory('pages'),
      directory('server'),
      directory('server/api'),
      file('server/api/health.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect Nuxt from page files alone', () => {
    const result = analyze([
      directory('pages'),
      file('pages/index.vue'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect Nuxt from layout files alone', () => {
    const result = analyze([
      directory('layouts'),
      file('layouts/default.vue'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('detects a frontend app from Vite Vue structure', () => {
    const result = analyze([
      file('vite.config.ts'),
      directory('src'),
      file('src/main.ts'),
      file('src/App.vue'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'src/App.vue',
        'src/main.ts',
        'vite.config.ts',
      ]),
    });
  });

  it('detects a frontend app from Vue Router structure', () => {
    const result = analyze([
      directory('src'),
      file('src/main.ts'),
      file('src/App.vue'),
      directory('src/router'),
      file('src/router/index.ts'),
      directory('src/views'),
      file('src/views/HomeView.vue'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'src/App.vue',
        'src/main.ts',
        'src/router/index.ts',
        'src/views/HomeView.vue',
      ]),
    });
  });

  it('detects a monorepo frontend app from Vue structure', () => {
    const result = analyze([
      directory('apps'),
      directory('apps/web'),
      file('apps/web/vite.config.ts'),
      directory('apps/web/src'),
      file('apps/web/src/main.ts'),
      file('apps/web/src/App.vue'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', 'apps/web')).toMatchObject({
      evidence: expect.arrayContaining([
        'apps/web/src/App.vue',
        'apps/web/src/main.ts',
        'apps/web/vite.config.ts',
      ]),
    });
  });

  it('detects a frontend app from Vue CLI structure', () => {
    const result = analyze([
      file('vue.config.js'),
      directory('src'),
      file('src/main.js'),
      file('src/App.vue'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'src/App.vue',
        'src/main.js',
        'vue.config.js',
      ]),
    });
  });

  it('does not detect Vue from Vite config alone', () => {
    const result = analyze([file('vite.config.ts'), file('package.json')]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect Vue from component library files alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/components'),
      file('src/components/Button.vue'),
      file('src/components/Card.vue'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect Vue from route-like files without app root', () => {
    const result = analyze([
      directory('src'),
      directory('src/pages'),
      file('src/pages/Home.vue'),
      directory('src/layouts'),
      file('src/layouts/MainLayout.vue'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not add Vue evidence to Nuxt owners', () => {
    const result = analyze([
      file('nuxt.config.ts'),
      directory('src'),
      file('src/App.vue'),
      directory('src/router'),
      file('src/router/index.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: ['nuxt.config.ts'],
    });
  });

  it('detects a frontend app from root React Router framework structure', () => {
    const result = analyze([
      directory('app'),
      file('app/root.tsx'),
      file('app/routes.ts'),
      directory('app/routes'),
      file('app/routes/_index.tsx'),
      file('react-router.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'app/root.tsx',
        'app/routes.ts',
        'app/routes',
        'app/routes/_index.tsx',
        'react-router.config.ts',
      ]),
    });
  });

  it('detects a monorepo frontend app from React Router framework structure', () => {
    const result = analyze([
      directory('apps'),
      directory('apps/web'),
      directory('apps/web/app'),
      file('apps/web/app/root.tsx'),
      file('apps/web/app/routes.ts'),
      directory('apps/web/app/routes'),
      file('apps/web/app/routes/_index.tsx'),
      file('apps/web/react-router.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', 'apps/web')).toMatchObject({
      evidence: expect.arrayContaining([
        'apps/web/app/root.tsx',
        'apps/web/app/routes.ts',
        'apps/web/app/routes/_index.tsx',
        'apps/web/react-router.config.ts',
      ]),
    });
  });

  it('detects a frontend app from React Router optional entry files', () => {
    const result = analyze([
      directory('app'),
      file('app/entry.client.tsx'),
      file('app/entry.server.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'app/entry.client.tsx',
        'app/entry.server.tsx',
      ]),
    });
  });

  it('does not detect React Router from routes directory alone', () => {
    const result = analyze([
      directory('app'),
      directory('app/routes'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect React Router from Vite config alone', () => {
    const result = analyze([file('vite.config.ts'), file('package.json')]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('detects a frontend app from Vite React structure', () => {
    const result = analyze([
      file('index.html'),
      directory('src'),
      file('src/main.tsx'),
      file('src/App.tsx'),
      file('vite.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'index.html',
        'src/App.tsx',
        'src/main.tsx',
        'vite.config.ts',
      ]),
    });
  });

  it('detects a frontend app from CRA-style React structure', () => {
    const result = analyze([
      directory('public'),
      file('public/index.html'),
      directory('src'),
      file('src/index.js'),
      file('src/App.js'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'public/index.html',
        'src/App.js',
        'src/index.js',
      ]),
    });
  });

  it('detects a monorepo frontend app from React structure', () => {
    const result = analyze([
      directory('apps'),
      directory('apps/web'),
      file('apps/web/index.html'),
      directory('apps/web/src'),
      file('apps/web/src/main.jsx'),
      file('apps/web/src/App.jsx'),
      file('apps/web/vite.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', 'apps/web')).toMatchObject({
      evidence: expect.arrayContaining([
        'apps/web/index.html',
        'apps/web/src/App.jsx',
        'apps/web/src/main.jsx',
        'apps/web/vite.config.ts',
      ]),
    });
  });

  it('detects a frontend app from React App JSX evidence alone', () => {
    const result = analyze([
      directory('src'),
      file('src/App.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: ['src/App.tsx'],
    });
  });

  it('does not detect React from Vite config alone', () => {
    const result = analyze([file('vite.config.ts'), file('package.json')]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect React from component library files alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/components'),
      file('src/components/Button.tsx'),
      file('src/components/Card.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('detects a frontend app from root static HTML and CSS files', () => {
    const result = analyze([
      file('index.html'),
      file('style.css'),
      file('script.js'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'index.html',
        'script.js',
        'style.css',
      ]),
    });
  });

  it('detects a frontend app from static css and js directories', () => {
    const result = analyze([
      file('index.html'),
      directory('css'),
      file('css/site.css'),
      directory('js'),
      file('js/site.js'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'css/site.css',
        'index.html',
        'js/site.js',
      ]),
    });
  });

  it('detects a monorepo frontend app from Vite static structure', () => {
    const result = analyze([
      directory('apps'),
      directory('apps/site'),
      file('apps/site/index.html'),
      directory('apps/site/src'),
      file('apps/site/src/main.js'),
      file('apps/site/src/style.css'),
      file('apps/site/vite.config.js'),
    ]);

    expect(areaByName(result, 'Frontend app', 'apps/site')).toMatchObject({
      evidence: expect.arrayContaining([
        'apps/site/index.html',
        'apps/site/src/main.js',
        'apps/site/src/style.css',
        'apps/site/vite.config.js',
      ]),
    });
  });

  it('detects a frontend app from multi-page static HTML and CSS evidence', () => {
    const result = analyze([
      file('index.html'),
      file('about.html'),
      directory('css'),
      file('css/site.css'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'about.html',
        'css/site.css',
        'index.html',
      ]),
    });
  });

  it('does not detect static frontend from index html alone', () => {
    const result = analyze([file('index.html')]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect static frontend from nested generated html files', () => {
    const result = analyze([
      directory('docs'),
      file('docs/index.html'),
      file('docs/about.html'),
      directory('docs/css'),
      file('docs/css/site.css'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
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

  it('infers NestJS from Nest-specific entry and module files', () => {
    const result = analyze([
      directory('src'),
      directory('src/routes'),
      directory('src/controllers'),
      directory('src/services'),
      file('src/main.ts'),
      file('src/app.module.ts'),
      file('package.json'),
      file('tsconfig.json'),
    ]);

    expect(result.summary.projectShape).toBe('backend api');
    expect(result.summary.inferredStack).toEqual([
      'NestJS',
      'Node.js/TypeScript',
    ]);
  });

  it('infers mobile stacks from conservative path signals', () => {
    const expoResult = analyze([
      directory('app'),
      file('app/_layout.tsx'),
      file('app.json'),
      file('app.config.ts'),
      file('expo-env.d.ts'),
      file('package.json'),
      file('tsconfig.json'),
    ]);
    const reactNativeResult = analyze([file('metro.config.js')]);
    const nativeResult = analyze([
      directory('android'),
      file('android/build.gradle'),
      file('android/app/src/main/java/com/example/MainActivity.java'),
      directory('ios'),
      file('ios/Podfile'),
    ]);
    const flutterResult = analyze([
      file('pubspec.yaml'),
      directory('lib'),
      file('lib/main.dart'),
    ]);

    expect(expoResult.summary.inferredStack).toEqual([
      'Expo',
      'Node.js/TypeScript',
    ]);
    expect(reactNativeResult.summary.inferredStack).toEqual(['React Native']);
    expect(nativeResult.summary.inferredStack).toEqual(['Android', 'iOS']);
    expect(flutterResult.summary.inferredStack).toEqual(['Flutter']);
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
