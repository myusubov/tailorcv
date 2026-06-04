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

  it('detects a Next.js frontend app from App Router core files', () => {
    const result = analyze([
      directory('app'),
      file('app/page.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining(['app/page.tsx']),
    });
  });

  it('does not emit Next.js frontend areas from weak-only route hints', () => {
    const result = analyze([
      directory('app'),
      file('app/loading.tsx'),
      directory('src'),
      directory('src/pages'),
      file('src/pages/Home.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  describe('Next.js frontend detector realistic repo fixtures', () => {
    it('detects a realistic App Router product app without fallback interference', () => {
      const result = analyze([
        directory('app'),
        directory('app/(marketing)'),
        file('app/(marketing)/page.tsx'),
        directory('app/(workspace)'),
        file('app/(workspace)/layout.tsx'),
        directory('app/(workspace)/dashboard'),
        file('app/(workspace)/dashboard/loading.tsx'),
        file('app/(workspace)/dashboard/page.tsx'),
        directory('app/api'),
        directory('app/api/resumes'),
        file('app/api/resumes/route.ts'),
        file('app/globals.css'),
        file('app/layout.tsx'),
        file('app/page.tsx'),
        directory('components'),
        directory('components/navigation'),
        file('components/navigation/sidebar.tsx'),
        directory('components/resumes'),
        file('components/resumes/resume-card.tsx'),
        directory('lib'),
        file('lib/api-client.ts'),
        file('lib/auth.ts'),
        file('lib/utils.ts'),
        directory('public'),
        file('public/favicon.ico'),
        file('public/logo.svg'),
        directory('styles'),
        file('styles/tokens.css'),
        directory('__tests__'),
        file('__tests__/dashboard.test.tsx'),
        directory('.github'),
        directory('.github/workflows'),
        file('.github/workflows/ci.yml'),
        file('.env.example'),
        file('README.md'),
        file('next-env.d.ts'),
        file('next.config.ts'),
        file('package.json'),
        file('postcss.config.mjs'),
        file('tailwind.config.ts'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'app',
          'app/(marketing)/page.tsx',
          'app/(workspace)/dashboard/loading.tsx',
          'next.config.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
      expect(areaByName(result, 'Frontend app', '.')?.evidence).not.toEqual(
        expect.arrayContaining([
          'components/resumes/resume-card.tsx',
          'styles/tokens.css',
        ]),
      );
    });

    it('detects a realistic src App Router repo with package and public asset noise', () => {
      const result = analyze([
        directory('src'),
        directory('src/app'),
        directory('src/app/(auth)'),
        file('src/app/(auth)/login/page.tsx'),
        directory('src/app/api'),
        directory('src/app/api/health'),
        file('src/app/api/health/route.ts'),
        file('src/app/error.tsx'),
        file('src/app/globals.css'),
        file('src/app/layout.tsx'),
        file('src/app/not-found.tsx'),
        file('src/app/page.tsx'),
        directory('src/components'),
        directory('src/components/forms'),
        file('src/components/forms/login-form.tsx'),
        directory('src/hooks'),
        file('src/hooks/use-session.ts'),
        directory('src/lib'),
        file('src/lib/env.ts'),
        file('src/lib/server-only.ts'),
        directory('src/styles'),
        file('src/styles/theme.css'),
        directory('public'),
        file('public/apple-touch-icon.png'),
        file('public/manifest.webmanifest'),
        directory('docs'),
        file('docs/deployment.md'),
        file('middleware.ts'),
        file('next-env.d.ts'),
        file('next.config.mjs'),
        file('package.json'),
        file('pnpm-lock.yaml'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'next.config.mjs',
          'src/app/(auth)/login/page.tsx',
          'src/app/error.tsx',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic Pages Router repository with legacy Next.js structure', () => {
      const result = analyze([
        directory('pages'),
        directory('pages/account'),
        file('pages/account/settings.tsx'),
        directory('pages/api'),
        file('pages/api/health.ts'),
        file('pages/_app.tsx'),
        file('pages/_document.tsx'),
        file('pages/404.tsx'),
        file('pages/index.tsx'),
        directory('components'),
        file('components/layout.tsx'),
        file('components/nav.tsx'),
        directory('lib'),
        file('lib/apollo-client.ts'),
        file('lib/format-date.ts'),
        directory('public'),
        file('public/favicon.ico'),
        file('public/logo.svg'),
        directory('styles'),
        file('styles/globals.css'),
        file('styles/theme.css'),
        directory('tests'),
        file('tests/pages-index.test.tsx'),
        file('.eslintrc.json'),
        file('README.md'),
        file('next-env.d.ts'),
        file('next.config.js'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'next.config.js',
          'pages',
          'pages/_app.tsx',
          'pages/account/settings.tsx',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('keeps a realistic monorepo Next.js app isolated from sibling apps', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/web'),
        directory('apps/web/src'),
        directory('apps/web/src/app'),
        directory('apps/web/src/app/(dashboard)'),
        file('apps/web/src/app/(dashboard)/page.tsx'),
        file('apps/web/src/app/api/health/route.ts'),
        file('apps/web/src/app/layout.tsx'),
        file('apps/web/src/app/page.tsx'),
        directory('apps/web/src/components'),
        file('apps/web/src/components/app-shell.tsx'),
        directory('apps/web/public'),
        file('apps/web/public/logo.svg'),
        file('apps/web/next.config.ts'),
        file('apps/web/package.json'),
        file('apps/web/tsconfig.json'),
        directory('apps/react'),
        file('apps/react/index.html'),
        directory('apps/react/src'),
        file('apps/react/src/App.tsx'),
        directory('apps/react/src/components'),
        file('apps/react/src/components/chart.tsx'),
        file('apps/react/src/index.css'),
        file('apps/react/src/main.tsx'),
        file('apps/react/vite.config.ts'),
        file('apps/react/package.json'),
        directory('apps/api'),
        directory('apps/api/src'),
        directory('apps/api/src/controllers'),
        directory('apps/api/src/routes'),
        directory('apps/api/src/services'),
        file('apps/api/package.json'),
        directory('packages'),
        directory('packages/shared'),
        file('packages/shared/package.json'),
        file('packages/shared/src/index.ts'),
        file('package.json'),
        file('turbo.json'),
      ]);

      expect(areaByName(result, 'Frontend app', 'apps/web')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/web/next.config.ts',
          'apps/web/src/app/(dashboard)/page.tsx',
        ]),
      });
      expect(areaByName(result, 'Frontend app', 'apps/react')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/react/index.html',
          'apps/react/src/App.tsx',
          'apps/react/src/main.tsx',
          'apps/react/vite.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('does not emit a frontend app for a realistic repo with only weak Next-like hints', () => {
      const result = analyze([
        directory('app'),
        directory('app/dashboard'),
        file('app/dashboard/loading.tsx'),
        file('app/loading.tsx'),
        file('app/template.tsx'),
        directory('components'),
        file('components/card.tsx'),
        directory('docs'),
        file('docs/routing.md'),
        directory('lib'),
        file('lib/routes.ts'),
        directory('public'),
        file('public/logo.svg'),
        directory('src'),
        directory('src/pages'),
        directory('src/pages/admin'),
        file('src/pages/about.tsx'),
        file('src/pages/admin/users.tsx'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });
  });

  describe('React Router frontend detector realistic repo fixtures', () => {
    it('detects a realistic route-config framework app without fallback interference', () => {
      const result = analyze([
        directory('app'),
        directory('app/auth'),
        file('app/auth/login.tsx'),
        directory('app/components'),
        file('app/components/app-shell.tsx'),
        directory('app/dashboard'),
        file('app/dashboard.tsx'),
        file('app/home.tsx'),
        file('app/root.tsx'),
        file('app/routes.ts'),
        directory('app/styles'),
        file('app/styles/theme.css'),
        directory('public'),
        file('public/favicon.ico'),
        file('public/logo.svg'),
        directory('tests'),
        file('tests/routes.test.tsx'),
        directory('docs'),
        file('docs/deployment.md'),
        file('.env.example'),
        file('package.json'),
        file('react-router.config.ts'),
        file('tsconfig.json'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'app/root.tsx',
          'app/routes.ts',
          'react-router.config.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
      expect(areaByName(result, 'Frontend app', '.')?.evidence).not.toEqual(
        expect.arrayContaining([
          'app/components/app-shell.tsx',
          'app/styles/theme.css',
        ]),
      );
    });

    it('detects a realistic file-route framework app', () => {
      const result = analyze([
        directory('app'),
        file('app/root.tsx'),
        directory('app/routes'),
        file('app/routes/_index.tsx'),
        file('app/routes/about.tsx'),
        directory('app/routes/dashboard'),
        file('app/routes/dashboard.tsx'),
        file('app/routes/dashboard.settings.tsx'),
        file('app/routes.ts'),
        directory('app/ui'),
        file('app/ui/button.tsx'),
        directory('public'),
        file('public/avatar-placeholder.png'),
        file('public/favicon.ico'),
        directory('styles'),
        file('styles/tokens.css'),
        directory('__tests__'),
        file('__tests__/file-routes.test.tsx'),
        file('README.md'),
        file('package.json'),
        file('tsconfig.json'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'app/root.tsx',
          'app/routes',
          'app/routes/_index.tsx',
          'app/routes.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic custom-entry framework app', () => {
      const result = analyze([
        directory('app'),
        file('app/entry.client.tsx'),
        file('app/entry.server.tsx'),
        directory('app/routes'),
        file('app/routes/_index.tsx'),
        file('app/routes/contact.tsx'),
        file('app/root.tsx'),
        directory('app/server'),
        file('app/server/context.ts'),
        directory('app/ui'),
        file('app/ui/document.tsx'),
        directory('public'),
        file('public/favicon.ico'),
        file('public/robots.txt'),
        file('.eslintrc.json'),
        file('package.json'),
        file('react-router.config.mjs'),
        file('tsconfig.json'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'app/entry.client.tsx',
          'app/entry.server.tsx',
          'app/root.tsx',
          'react-router.config.mjs',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('blocks same-owner React fallback evidence when React Router proof exists', () => {
      const result = analyze([
        directory('app'),
        file('app/root.tsx'),
        file('app/routes.ts'),
        file('index.html'),
        directory('src'),
        file('src/App.tsx'),
        directory('src/components'),
        file('src/components/chart.tsx'),
        file('src/main.tsx'),
        file('package.json'),
        file('react-router.config.ts'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'app/root.tsx',
          'app/routes.ts',
          'react-router.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', '.')?.evidence).not.toEqual(
        expect.arrayContaining([
          'index.html',
          'src/App.tsx',
          'src/main.tsx',
          'vite.config.ts',
        ]),
      );
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('keeps a realistic monorepo React Router app isolated from sibling apps', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/router'),
        directory('apps/router/app'),
        file('apps/router/app/root.tsx'),
        directory('apps/router/app/routes'),
        file('apps/router/app/routes/_index.tsx'),
        file('apps/router/app/routes/projects.tsx'),
        file('apps/router/app/routes.ts'),
        directory('apps/router/public'),
        file('apps/router/public/logo.svg'),
        file('apps/router/package.json'),
        file('apps/router/react-router.config.ts'),
        file('apps/router/tsconfig.json'),
        file('apps/router/vite.config.ts'),
        directory('apps/react'),
        file('apps/react/index.html'),
        directory('apps/react/src'),
        file('apps/react/src/App.tsx'),
        directory('apps/react/src/components'),
        file('apps/react/src/components/chart.tsx'),
        file('apps/react/src/index.css'),
        file('apps/react/src/main.tsx'),
        file('apps/react/package.json'),
        file('apps/react/vite.config.ts'),
        directory('apps/web'),
        directory('apps/web/app'),
        file('apps/web/app/page.tsx'),
        file('apps/web/next.config.ts'),
        file('apps/web/package.json'),
        directory('packages'),
        directory('packages/shared'),
        file('packages/shared/package.json'),
        file('packages/shared/src/index.ts'),
        file('package.json'),
        file('turbo.json'),
      ]);

      expect(areaByName(result, 'Frontend app', 'apps/router')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/router/app/root.tsx',
          'apps/router/app/routes.ts',
          'apps/router/react-router.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', 'apps/react')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/react/index.html',
          'apps/react/src/App.tsx',
          'apps/react/src/main.tsx',
          'apps/react/vite.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', 'apps/web')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/web/app/page.tsx',
          'apps/web/next.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('does not emit from weak React Router-like hints alone', () => {
      const result = analyze([
        directory('app'),
        directory('app/routes'),
        file('app/routes/about.tsx'),
        file('app/routes/dashboard.tsx'),
        directory('components'),
        file('components/site-header.tsx'),
        directory('public'),
        file('public/logo.svg'),
        directory('styles'),
        file('styles/theme.css'),
        file('package.json'),
        file('tsconfig.json'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
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

  it('detects a frontend app from SvelteKit config alone', () => {
    const result = analyze([file('svelte.config.js'), file('package.json')]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: ['svelte.config.js'],
    });
  });

  it('detects a frontend app from SvelteKit page component alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/routes'),
      file('src/routes/+page.svelte'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining(['src/routes/+page.svelte']),
    });
  });

  it('detects a frontend app from SvelteKit layout component alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/routes'),
      file('src/routes/+layout.svelte'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining(['src/routes/+layout.svelte']),
    });
  });

  it('detects a frontend app from SvelteKit server route and app template', () => {
    const result = analyze([
      directory('src'),
      file('src/app.html'),
      directory('src/routes'),
      file('src/routes/api/+server.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'src/app.html',
        'src/routes/api/+server.ts',
      ]),
    });
  });

  it('detects a frontend app from SvelteKit page load and app template', () => {
    const result = analyze([
      directory('src'),
      file('src/app.html'),
      directory('src/routes'),
      file('src/routes/+page.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining(['src/app.html', 'src/routes/+page.ts']),
    });
  });

  it('does not detect SvelteKit from app template alone', () => {
    const result = analyze([
      directory('src'),
      file('src/app.html'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect SvelteKit from page load alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/routes'),
      file('src/routes/+page.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
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

  it('detects a frontend app from Astro config alone', () => {
    const result = analyze([file('astro.config.mjs'), file('package.json')]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: ['astro.config.mjs'],
    });
  });

  it('detects a frontend app from an Astro page alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/pages'),
      file('src/pages/index.astro'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining(['src/pages/index.astro']),
    });
  });

  it('does not detect Astro from layout and component files alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/layouts'),
      file('src/layouts/BaseLayout.astro'),
      directory('src/components'),
      file('src/components/Header.astro'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
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

  describe('Nuxt frontend detector realistic repo fixtures', () => {
    it('detects a realistic Nuxt 4 app-directory product app', () => {
      const result = analyze([
        directory('app'),
        directory('app/assets'),
        file('app/assets/main.css'),
        file('app/app.vue'),
        directory('app/components'),
        file('app/components/site-header.vue'),
        directory('app/composables'),
        file('app/composables/use-session.ts'),
        directory('app/layouts'),
        file('app/layouts/default.vue'),
        file('app/layouts/dashboard.vue'),
        directory('app/pages'),
        directory('app/pages/dashboard'),
        file('app/pages/dashboard/index.vue'),
        file('app/pages/index.vue'),
        directory('app/plugins'),
        file('app/plugins/analytics.client.ts'),
        directory('app/utils'),
        file('app/utils/format-date.ts'),
        directory('server'),
        directory('server/api'),
        file('server/api/resumes.get.ts'),
        directory('server/routes'),
        file('server/routes/sitemap.xml.ts'),
        directory('public'),
        file('public/favicon.ico'),
        file('public/logo.svg'),
        directory('tests'),
        file('tests/pages.test.ts'),
        directory('docs'),
        file('docs/deployment.md'),
        file('.env.example'),
        file('nuxt.config.ts'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'app/app.vue',
          'app/layouts/default.vue',
          'app/pages',
          'app/pages/dashboard/index.vue',
          'nuxt.config.ts',
          'server/api/resumes.get.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic Nuxt 3 root-directory app', () => {
      const result = analyze([
        file('app.vue'),
        directory('assets'),
        file('assets/main.css'),
        directory('components'),
        file('components/app-footer.vue'),
        file('components/site-header.vue'),
        directory('composables'),
        file('composables/use-auth.ts'),
        directory('layouts'),
        file('layouts/default.vue'),
        file('layouts/marketing.vue'),
        directory('pages'),
        directory('pages/blog'),
        file('pages/blog/[slug].vue'),
        file('pages/index.vue'),
        directory('plugins'),
        file('plugins/pinia.ts'),
        directory('server'),
        directory('server/api'),
        file('server/api/health.ts'),
        directory('public'),
        file('public/favicon.ico'),
        file('public/robots.txt'),
        directory('__tests__'),
        file('__tests__/home.test.ts'),
        file('README.md'),
        file('nuxt.config.ts'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'app.vue',
          'layouts/default.vue',
          'nuxt.config.ts',
          'pages',
          'pages/blog/[slug].vue',
          'server/api/health.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a Nuxt config-only shell with support noise', () => {
      const result = analyze([
        directory('docs'),
        file('docs/architecture.md'),
        directory('public'),
        file('public/favicon.ico'),
        directory('server'),
        directory('server/api'),
        file('server/api/health.ts'),
        file('.env.example'),
        file('nuxt.config.ts'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining(['nuxt.config.ts']),
      });
    });

    it('blocks same-owner Vue fallback evidence when Nuxt proof exists', () => {
      const result = analyze([
        file('nuxt.config.ts'),
        directory('src'),
        file('src/App.vue'),
        file('src/main.ts'),
        directory('src/router'),
        file('src/router/index.ts'),
        file('package.json'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: ['nuxt.config.ts'],
      });
      expect(areaByName(result, 'Frontend app', '.')?.evidence).not.toEqual(
        expect.arrayContaining([
          'src/App.vue',
          'src/main.ts',
          'src/router/index.ts',
          'vite.config.ts',
        ]),
      );
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('keeps a realistic monorepo Nuxt app isolated from sibling Vue apps', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/nuxt'),
        directory('apps/nuxt/app'),
        file('apps/nuxt/app/app.vue'),
        directory('apps/nuxt/app/components'),
        file('apps/nuxt/app/components/app-shell.vue'),
        directory('apps/nuxt/app/layouts'),
        file('apps/nuxt/app/layouts/default.vue'),
        directory('apps/nuxt/app/pages'),
        file('apps/nuxt/app/pages/index.vue'),
        directory('apps/nuxt/server'),
        directory('apps/nuxt/server/api'),
        file('apps/nuxt/server/api/health.ts'),
        file('apps/nuxt/nuxt.config.ts'),
        file('apps/nuxt/package.json'),
        file('apps/nuxt/tsconfig.json'),
        directory('apps/vue'),
        directory('apps/vue/src'),
        file('apps/vue/src/App.vue'),
        file('apps/vue/src/main.ts'),
        directory('apps/vue/src/router'),
        file('apps/vue/src/router/index.ts'),
        file('apps/vue/package.json'),
        file('apps/vue/vite.config.ts'),
        directory('apps/api'),
        directory('apps/api/src'),
        directory('apps/api/src/controllers'),
        directory('apps/api/src/routes'),
        directory('apps/api/src/services'),
        file('apps/api/package.json'),
        directory('packages'),
        directory('packages/shared'),
        file('packages/shared/package.json'),
        file('packages/shared/src/index.ts'),
        file('package.json'),
        file('turbo.json'),
      ]);

      expect(areaByName(result, 'Frontend app', 'apps/nuxt')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/nuxt/app/app.vue',
          'apps/nuxt/app/pages/index.vue',
          'apps/nuxt/nuxt.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', 'apps/vue')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/vue/src/App.vue',
          'apps/vue/src/main.ts',
          'apps/vue/src/router/index.ts',
          'apps/vue/vite.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('does not emit from realistic weak Nuxt-like hints alone', () => {
      const result = analyze([
        directory('components'),
        file('components/site-header.vue'),
        directory('docs'),
        file('docs/routing.md'),
        directory('layouts'),
        file('layouts/default.vue'),
        directory('pages'),
        directory('pages/blog'),
        file('pages/blog/[slug].vue'),
        file('pages/index.vue'),
        directory('public'),
        file('public/logo.svg'),
        directory('server'),
        directory('server/api'),
        file('server/api/health.ts'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });
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

  it('does not add Vue evidence to Nuxt app-entry owners', () => {
    const result = analyze([
      file('app.vue'),
      directory('src'),
      file('src/App.vue'),
      file('src/main.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining(['app.vue']),
    });
    expect(areaByName(result, 'Frontend app', '.')?.evidence).not.toContain(
      'src/App.vue',
    );
  });

  it('keeps Vue evidence when Nuxt proof belongs to another owner', () => {
    const result = analyze([
      directory('apps'),
      directory('apps/nuxt'),
      file('apps/nuxt/nuxt.config.ts'),
      directory('apps/vue'),
      directory('apps/vue/src'),
      file('apps/vue/src/App.vue'),
      file('apps/vue/src/main.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', 'apps/nuxt')).toMatchObject({
      evidence: ['apps/nuxt/nuxt.config.ts'],
    });
    expect(areaByName(result, 'Frontend app', 'apps/vue')).toMatchObject({
      evidence: expect.arrayContaining([
        'apps/vue/src/App.vue',
        'apps/vue/src/main.ts',
      ]),
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

  it('detects a frontend app from React Router root route and optional entry files', () => {
    const result = analyze([
      directory('app'),
      file('app/root.tsx'),
      file('app/entry.client.tsx'),
      file('app/entry.server.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'app/root.tsx',
        'app/entry.client.tsx',
        'app/entry.server.tsx',
      ]),
    });
  });

  it('does not detect React Router from optional entry files alone', () => {
    const result = analyze([
      directory('app'),
      file('app/entry.client.tsx'),
      file('app/entry.server.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect React Router from file routes alone', () => {
    const result = analyze([
      directory('app'),
      directory('app/routes'),
      file('app/routes/_index.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
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

  it('detects a frontend app from Angular workspace config', () => {
    const result = analyze([file('angular.json'), file('package.json')]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: ['angular.json'],
    });
  });

  it('detects a frontend app from classic Angular structure', () => {
    const result = analyze([
      directory('src'),
      file('src/main.ts'),
      directory('src/app'),
      file('src/app/app.component.ts'),
      file('src/app/app.module.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'src/app/app.component.ts',
        'src/app/app.module.ts',
        'src/main.ts',
      ]),
    });
  });

  it('detects a frontend app from standalone Angular structure', () => {
    const result = analyze([
      directory('src'),
      file('src/main.ts'),
      directory('src/app'),
      file('src/app/app.component.ts'),
      file('src/app/app.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'src/app/app.component.ts',
        'src/app/app.config.ts',
        'src/main.ts',
      ]),
    });
  });

  it('does not detect Angular from root component view files alone', () => {
    const result = analyze([
      directory('src'),
      directory('src/app'),
      file('src/app/app.component.html'),
      file('src/app/app.component.scss'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect Angular from main entry and app directory alone', () => {
    const result = analyze([
      directory('src'),
      file('src/main.ts'),
      directory('src/app'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
  });

  it('does not detect Angular from project config alone', () => {
    const result = analyze([file('project.json'), file('package.json')]);

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

  it('does not detect React from App JSX evidence alone', () => {
    const result = analyze([
      directory('src'),
      file('src/App.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
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

  it('skips same-owner React fallback evidence when Next.js proof exists', () => {
    const result = analyze([
      file('next.config.ts'),
      file('index.html'),
      directory('src'),
      file('src/App.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: ['next.config.ts'],
    });
  });

  it('keeps React fallback evidence when Next.js proof belongs to another owner', () => {
    const result = analyze([
      directory('apps'),
      directory('apps/next'),
      file('apps/next/next.config.ts'),
      directory('apps/react'),
      file('apps/react/index.html'),
      directory('apps/react/src'),
      file('apps/react/src/main.tsx'),
      file('apps/react/src/App.tsx'),
      file('apps/react/vite.config.ts'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', 'apps/next')).toMatchObject({
      evidence: ['apps/next/next.config.ts'],
    });
    expect(areaByName(result, 'Frontend app', 'apps/react')).toMatchObject({
      evidence: expect.arrayContaining([
        'apps/react/index.html',
        'apps/react/src/App.tsx',
        'apps/react/src/main.tsx',
        'apps/react/vite.config.ts',
      ]),
    });
  });

  it('detects React from root App JSX and component structure', () => {
    const result = analyze([
      directory('src'),
      file('src/App.tsx'),
      directory('src/components'),
      file('src/components/Button.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'src/App.tsx',
        'src/components/Button.tsx',
      ]),
    });
  });

  it('skips same-owner React fallback evidence when React Router proof exists', () => {
    const result = analyze([
      file('react-router.config.ts'),
      directory('app'),
      file('app/root.tsx'),
      directory('src'),
      file('src/App.tsx'),
      file('package.json'),
    ]);

    expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
      evidence: expect.arrayContaining([
        'app/root.tsx',
        'react-router.config.ts',
      ]),
    });
    expect(areaByName(result, 'Frontend app', '.')?.evidence).not.toContain(
      'src/App.tsx',
    );
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
