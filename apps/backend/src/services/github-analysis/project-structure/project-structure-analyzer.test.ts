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

  it.each([
    {
      detector: 'Next.js',
      entries: [file('next.config.ts')],
      expected: { primary: 'Next.js', related: ['React'] },
    },
    {
      detector: 'Nuxt',
      entries: [file('nuxt.config.ts')],
      expected: { primary: 'Nuxt', related: ['Vue'] },
    },
    {
      detector: 'Vue',
      entries: [file('src/App.vue'), file('src/main.ts')],
      expected: { primary: 'Vue', related: [] },
    },
    {
      detector: 'React Router',
      entries: [file('react-router.config.ts')],
      expected: { primary: 'React Router', related: ['React'] },
    },
    {
      detector: 'React',
      entries: [
        file('index.html'),
        file('vite.config.ts'),
        file('src/main.tsx'),
        file('src/App.tsx'),
      ],
      expected: { primary: 'React', related: [] },
    },
    {
      detector: 'Angular',
      entries: [file('angular.json')],
      expected: { primary: 'Angular', related: [] },
    },
    {
      detector: 'SvelteKit',
      entries: [file('src/routes/+page.svelte')],
      expected: { primary: 'SvelteKit', related: ['Svelte'] },
    },
    {
      detector: 'Svelte',
      entries: [file('src/App.svelte'), file('src/main.ts')],
      expected: { primary: 'Svelte', related: [] },
    },
    {
      detector: 'Astro',
      entries: [file('astro.config.mjs')],
      expected: { primary: 'Astro', related: [] },
    },
    {
      detector: 'Static Web',
      entries: [file('index.html'), file('style.css')],
      expected: { primary: 'Static Web', related: [] },
    },
  ])(
    'exposes inferred technologies for the $detector detector',
    ({ entries, expected }) => {
      const result = analyze(entries);

      expect(
        areaByName(result, 'Frontend app', '.')?.inferredTechnologies,
      ).toEqual(expected);
    },
  );

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

  describe('SvelteKit frontend detector realistic repo fixtures', () => {
    it('detects a realistic full SvelteKit app', () => {
      const result = analyze([
        directory('src'),
        file('src/app.html'),
        file('src/error.html'),
        directory('src/lib'),
        directory('src/lib/components'),
        file('src/lib/components/NavBar.svelte'),
        directory('src/lib/server'),
        file('src/lib/server/session.ts'),
        directory('src/routes'),
        file('src/routes/+layout.svelte'),
        file('src/routes/+page.svelte'),
        directory('src/routes/account'),
        file('src/routes/account/+page.svelte'),
        file('src/routes/account/+page.ts'),
        directory('src/routes/api'),
        file('src/routes/api/+server.ts'),
        directory('static'),
        file('static/favicon.png'),
        file('static/robots.txt'),
        directory('tests'),
        file('tests/home.test.ts'),
        directory('docs'),
        file('docs/deployment.md'),
        file('package.json'),
        file('svelte.config.js'),
        file('tsconfig.json'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'svelte.config.js',
          'src/app.html',
          'src/routes',
          'src/routes/+layout.svelte',
          'src/routes/+page.svelte',
          'src/routes/account/+page.ts',
          'src/routes/api/+server.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('does not detect a realistic SvelteKit config-only shell', () => {
      const result = analyze([
        directory('docs'),
        file('docs/architecture.md'),
        directory('static'),
        file('static/favicon.png'),
        file('package.json'),
        file('svelte.config.js'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('detects a realistic SvelteKit load and server support app', () => {
      const result = analyze([
        directory('src'),
        file('src/app.html'),
        directory('src/routes'),
        file('src/routes/+layout.ts'),
        file('src/routes/+page.ts'),
        directory('src/routes/api'),
        file('src/routes/api/+server.ts'),
        directory('src/lib'),
        file('src/lib/load-session.ts'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'src/app.html',
          'src/routes/+layout.ts',
          'src/routes/+page.ts',
          'src/routes/api/+server.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('keeps a realistic monorepo SvelteKit app isolated from sibling frontend apps', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/sveltekit'),
        directory('apps/sveltekit/src'),
        file('apps/sveltekit/src/app.html'),
        directory('apps/sveltekit/src/lib'),
        file('apps/sveltekit/src/lib/site-config.ts'),
        directory('apps/sveltekit/src/routes'),
        file('apps/sveltekit/src/routes/+layout.svelte'),
        file('apps/sveltekit/src/routes/+page.svelte'),
        directory('apps/sveltekit/static'),
        file('apps/sveltekit/static/favicon.png'),
        file('apps/sveltekit/package.json'),
        file('apps/sveltekit/svelte.config.js'),
        file('apps/sveltekit/tsconfig.json'),
        file('apps/sveltekit/vite.config.ts'),
        directory('apps/vue'),
        file('apps/vue/index.html'),
        directory('apps/vue/src'),
        file('apps/vue/src/App.vue'),
        file('apps/vue/src/main.ts'),
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

      expect(
        areaByName(result, 'Frontend app', 'apps/sveltekit'),
      ).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/sveltekit/svelte.config.js',
          'apps/sveltekit/src/app.html',
          'apps/sveltekit/src/routes/+layout.svelte',
          'apps/sveltekit/src/routes/+page.svelte',
        ]),
      });
      expect(areaByName(result, 'Frontend app', 'apps/vue')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/vue/src/App.vue',
          'apps/vue/src/main.ts',
          'apps/vue/vite.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('does not emit from realistic weak SvelteKit-like hints alone', () => {
      const appTemplateOnly = analyze([
        directory('src'),
        file('src/app.html'),
        file('package.json'),
      ]);
      const routesDirectoryOnly = analyze([
        directory('src'),
        directory('src/routes'),
        file('package.json'),
      ]);
      const loadFilesOnly = analyze([
        directory('src'),
        directory('src/routes'),
        file('src/routes/+layout.ts'),
        file('src/routes/+page.ts'),
        file('package.json'),
      ]);

      expect(areaByName(appTemplateOnly, 'Frontend app', '.')).toBeUndefined();
      expect(
        areaByName(routesDirectoryOnly, 'Frontend app', '.'),
      ).toBeUndefined();
      expect(areaByName(loadFilesOnly, 'Frontend app', '.')).toBeUndefined();
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

  it('does not detect a frontend app from SvelteKit config alone', () => {
    const result = analyze([file('svelte.config.js'), file('package.json')]);

    expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
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

  describe('Svelte frontend detector realistic repo fixtures', () => {
    it('detects the official Vite JavaScript Svelte shape', () => {
      const result = analyze([
        file('index.html'),
        directory('public'),
        file('public/vite.svg'),
        directory('src'),
        file('src/App.svelte'),
        file('src/app.css'),
        directory('src/assets'),
        file('src/assets/svelte.svg'),
        directory('src/lib'),
        file('src/lib/Counter.svelte'),
        file('src/main.js'),
        file('package.json'),
        file('svelte.config.js'),
        file('vite.config.js'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'index.html',
          'src/App.svelte',
          'src/lib/Counter.svelte',
          'src/main.js',
          'svelte.config.js',
          'vite.config.js',
        ]),
        inferredTechnologies: {
          primary: 'Svelte',
          related: [],
        },
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects the official Vite TypeScript Svelte shape', () => {
      const result = analyze([
        file('index.html'),
        directory('src'),
        file('src/App.svelte'),
        file('src/main.ts'),
        file('package.json'),
        file('svelte.config.js'),
        file('tsconfig.json'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'index.html',
          'src/App.svelte',
          'src/main.ts',
          'svelte.config.js',
          'vite.config.ts',
        ]),
        inferredTechnologies: {
          primary: 'Svelte',
          related: [],
        },
      });
    });

    it('detects the legacy Rollup Svelte shape', () => {
      const result = analyze([
        directory('public'),
        file('public/index.html'),
        directory('src'),
        file('src/App.svelte'),
        file('src/main.js'),
        file('package.json'),
        file('rollup.config.js'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'public/index.html',
          'rollup.config.js',
          'src/App.svelte',
          'src/main.js',
        ]),
        inferredTechnologies: {
          primary: 'Svelte',
          related: [],
        },
      });
    });

    it('detects a structured Svelte app and counts component support once', () => {
      const result = analyze([
        file('index.html'),
        directory('src'),
        file('src/App.svelte'),
        directory('src/components'),
        file('src/components/Header.svelte'),
        file('src/components/Footer.svelte'),
        directory('src/lib'),
        file('src/lib/Button.svelte'),
        file('src/main.ts'),
        file('vite.config.ts'),
      ]);

      const frontendArea = areaByName(result, 'Frontend app', '.');

      expect(frontendArea).toMatchObject({
        evidence: expect.arrayContaining([
          'src/App.svelte',
          'src/components/Header.svelte',
          'src/main.ts',
        ]),
      });
      expect(frontendArea?.evidence).not.toEqual(
        expect.arrayContaining([
          'src/components/Footer.svelte',
          'src/lib/Button.svelte',
        ]),
      );
    });

    it('keeps same-owner SvelteKit proof ahead of standalone Svelte', () => {
      const result = analyze([
        file('index.html'),
        directory('src'),
        file('src/App.svelte'),
        file('src/app.html'),
        file('src/main.ts'),
        directory('src/routes'),
        file('src/routes/+layout.svelte'),
        file('src/routes/+page.svelte'),
        file('svelte.config.js'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'src/routes/+layout.svelte',
          'src/routes/+page.svelte',
        ]),
        inferredTechnologies: {
          primary: 'SvelteKit',
          related: ['Svelte'],
        },
      });
      expect(areaByName(result, 'Frontend app', '.')?.evidence).not.toEqual(
        expect.arrayContaining(['src/App.svelte', 'src/main.ts']),
      );
    });

    it('keeps sibling SvelteKit proof from blocking standalone Svelte', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/kit'),
        directory('apps/kit/src'),
        directory('apps/kit/src/routes'),
        file('apps/kit/src/routes/+page.svelte'),
        file('apps/kit/svelte.config.js'),
        directory('apps/svelte'),
        file('apps/svelte/index.html'),
        directory('apps/svelte/src'),
        file('apps/svelte/src/App.svelte'),
        file('apps/svelte/src/main.ts'),
        file('apps/svelte/svelte.config.js'),
        file('apps/svelte/vite.config.ts'),
        file('package.json'),
      ]);

      expect(areaByName(result, 'Frontend app', 'apps/kit')).toMatchObject({
        inferredTechnologies: {
          primary: 'SvelteKit',
          related: ['Svelte'],
        },
      });
      expect(areaByName(result, 'Frontend app', 'apps/svelte')).toMatchObject({
        inferredTechnologies: {
          primary: 'Svelte',
          related: [],
        },
      });
      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('does not emit from weak standalone Svelte hints', () => {
      const rootComponentOnly = analyze([file('src/App.svelte')]);
      const entryWithoutRoot = analyze([
        file('src/main.ts'),
        file('vite.config.ts'),
      ]);
      const componentsOnly = analyze([
        file('src/components/Header.svelte'),
        file('src/lib/Button.svelte'),
      ]);
      const sharedConfigOnly = analyze([file('svelte.config.js')]);

      expect(
        areaByName(rootComponentOnly, 'Frontend app', '.'),
      ).toBeUndefined();
      expect(areaByName(entryWithoutRoot, 'Frontend app', '.')).toBeUndefined();
      expect(areaByName(componentsOnly, 'Frontend app', '.')).toBeUndefined();
      expect(areaByName(sharedConfigOnly, 'Frontend app', '.')).toBeUndefined();
    });
  });

  describe('Astro frontend detector realistic repo fixtures', () => {
    it('detects a realistic Astro content site', () => {
      const result = analyze([
        file('astro.config.mjs'),
        directory('public'),
        file('public/favicon.svg'),
        file('public/robots.txt'),
        directory('src'),
        directory('src/components'),
        file('src/components/Header.astro'),
        file('src/components/Hero.astro'),
        directory('src/layouts'),
        file('src/layouts/BaseLayout.astro'),
        directory('src/pages'),
        directory('src/pages/blog'),
        file('src/pages/blog/[slug].astro'),
        file('src/pages/index.astro'),
        directory('src/styles'),
        file('src/styles/global.css'),
        directory('tests'),
        file('tests/pages.test.ts'),
        directory('docs'),
        file('docs/deployment.md'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'astro.config.mjs',
          'src/components/Header.astro',
          'src/layouts/BaseLayout.astro',
          'src/pages',
          'src/pages/blog/[slug].astro',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic Astro endpoint and content-rich site', () => {
      const result = analyze([
        directory('src'),
        directory('src/components'),
        file('src/components/PostCard.astro'),
        directory('src/layouts'),
        file('src/layouts/PostLayout.astro'),
        directory('src/pages'),
        directory('src/pages/api'),
        file('src/pages/api/feed.ts'),
        directory('src/pages/blog'),
        file('src/pages/blog/hello-world.md'),
        file('src/pages/index.astro'),
        directory('src/styles'),
        file('src/styles/site.css'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'src/components/PostCard.astro',
          'src/layouts/PostLayout.astro',
          'src/pages',
          'src/pages/api/feed.ts',
          'src/pages/blog/hello-world.md',
          'src/pages/index.astro',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic Astro config-only shell', () => {
      const result = analyze([
        file('astro.config.ts'),
        directory('docs'),
        file('docs/content.md'),
        directory('public'),
        file('public/favicon.svg'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: ['astro.config.ts'],
      });
    });

    it('keeps a realistic monorepo Astro app isolated from sibling frontend apps', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/site'),
        file('apps/site/astro.config.mjs'),
        directory('apps/site/src'),
        directory('apps/site/src/components'),
        file('apps/site/src/components/Header.astro'),
        directory('apps/site/src/layouts'),
        file('apps/site/src/layouts/BaseLayout.astro'),
        directory('apps/site/src/pages'),
        file('apps/site/src/pages/index.astro'),
        file('apps/site/package.json'),
        file('apps/site/tsconfig.json'),
        directory('apps/sveltekit'),
        directory('apps/sveltekit/src'),
        file('apps/sveltekit/src/app.html'),
        directory('apps/sveltekit/src/routes'),
        file('apps/sveltekit/src/routes/+page.svelte'),
        file('apps/sveltekit/package.json'),
        file('apps/sveltekit/svelte.config.js'),
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

      expect(areaByName(result, 'Frontend app', 'apps/site')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/site/astro.config.mjs',
          'apps/site/src/components/Header.astro',
          'apps/site/src/layouts/BaseLayout.astro',
          'apps/site/src/pages/index.astro',
        ]),
      });
      expect(
        areaByName(result, 'Frontend app', 'apps/sveltekit'),
      ).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/sveltekit/svelte.config.js',
          'apps/sveltekit/src/app.html',
          'apps/sveltekit/src/routes/+page.svelte',
        ]),
      });
      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('does not emit from realistic weak Astro-like hints alone', () => {
      const layoutAndComponentsOnly = analyze([
        directory('src'),
        directory('src/components'),
        file('src/components/Header.astro'),
        directory('src/layouts'),
        file('src/layouts/BaseLayout.astro'),
        file('package.json'),
      ]);
      const pagesDirectoryOnly = analyze([
        directory('src'),
        directory('src/pages'),
        file('package.json'),
      ]);
      const contentPagesOnly = analyze([
        directory('src'),
        directory('src/pages'),
        file('src/pages/about.md'),
        file('src/pages/guide.mdx'),
        file('src/pages/legacy.html'),
        file('package.json'),
      ]);

      expect(
        areaByName(layoutAndComponentsOnly, 'Frontend app', '.'),
      ).toBeUndefined();
      expect(
        areaByName(pagesDirectoryOnly, 'Frontend app', '.'),
      ).toBeUndefined();
      expect(areaByName(contentPagesOnly, 'Frontend app', '.')).toBeUndefined();
    });
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

  describe('Vue frontend detector realistic repo fixtures', () => {
    it('detects a realistic Vite Vue SPA', () => {
      const result = analyze([
        file('index.html'),
        directory('src'),
        directory('src/assets'),
        file('src/assets/logo.svg'),
        file('src/App.vue'),
        directory('src/components'),
        file('src/components/AppHeader.vue'),
        file('src/components/ResumeCard.vue'),
        file('src/main.ts'),
        directory('src/styles'),
        file('src/styles/main.css'),
        directory('tests'),
        file('tests/app.test.ts'),
        directory('docs'),
        file('docs/deployment.md'),
        file('.env.example'),
        file('package.json'),
        file('tsconfig.json'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'src/App.vue',
          'src/main.ts',
          'vite.config.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic Vue Router SPA', () => {
      const result = analyze([
        directory('src'),
        directory('src/assets'),
        file('src/assets/logo.svg'),
        file('src/App.vue'),
        directory('src/components'),
        file('src/components/AppShell.vue'),
        directory('src/composables'),
        file('src/composables/use-session.ts'),
        file('src/main.ts'),
        directory('src/router'),
        file('src/router/index.ts'),
        directory('src/views'),
        directory('src/views/account'),
        file('src/views/account/ProfileView.vue'),
        file('src/views/DashboardView.vue'),
        file('src/views/HomeView.vue'),
        directory('tests'),
        file('tests/router.test.ts'),
        file('package.json'),
        file('tsconfig.json'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'src/App.vue',
          'src/main.ts',
          'src/router/index.ts',
          'src/views/account/ProfileView.vue',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic file-based Vue Router app', () => {
      const result = analyze([
        file('index.html'),
        directory('src'),
        file('src/App.vue'),
        directory('src/components'),
        file('src/components/NavBar.vue'),
        file('src/main.ts'),
        directory('src/pages'),
        file('src/pages/index.vue'),
        directory('src/pages/users'),
        file('src/pages/users/[id].vue'),
        directory('src/styles'),
        file('src/styles/main.css'),
        file('package.json'),
        file('tsconfig.json'),
        file('typed-router.d.ts'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'src/App.vue',
          'src/main.ts',
          'src/pages/index.vue',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic legacy Vue CLI app', () => {
      const result = analyze([
        directory('public'),
        file('public/favicon.ico'),
        file('public/index.html'),
        directory('src'),
        directory('src/assets'),
        file('src/assets/logo.png'),
        file('src/App.vue'),
        directory('src/components'),
        file('src/components/HelloWorld.vue'),
        file('src/main.js'),
        directory('tests'),
        file('tests/unit/app.spec.js'),
        file('babel.config.js'),
        file('package.json'),
        file('vue.config.js'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'src/App.vue',
          'src/main.js',
          'vue.config.js',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
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

    it('keeps a realistic monorepo Vue app isolated from sibling Nuxt apps', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/vue'),
        file('apps/vue/index.html'),
        directory('apps/vue/src'),
        directory('apps/vue/src/assets'),
        file('apps/vue/src/assets/logo.svg'),
        file('apps/vue/src/App.vue'),
        directory('apps/vue/src/components'),
        file('apps/vue/src/components/AppHeader.vue'),
        file('apps/vue/src/main.ts'),
        directory('apps/vue/src/router'),
        file('apps/vue/src/router/index.ts'),
        file('apps/vue/package.json'),
        file('apps/vue/tsconfig.json'),
        file('apps/vue/vite.config.ts'),
        directory('apps/nuxt'),
        directory('apps/nuxt/app'),
        file('apps/nuxt/app/app.vue'),
        directory('apps/nuxt/app/pages'),
        file('apps/nuxt/app/pages/index.vue'),
        file('apps/nuxt/nuxt.config.ts'),
        file('apps/nuxt/package.json'),
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

      expect(areaByName(result, 'Frontend app', 'apps/vue')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/vue/src/App.vue',
          'apps/vue/src/main.ts',
          'apps/vue/src/router/index.ts',
          'apps/vue/vite.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', 'apps/nuxt')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/nuxt/app/app.vue',
          'apps/nuxt/app/pages/index.vue',
          'apps/nuxt/nuxt.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('does not emit from realistic weak Vue-like hints alone', () => {
      const result = analyze([
        directory('src'),
        directory('src/components'),
        file('src/components/Button.vue'),
        file('src/components/Card.vue'),
        directory('src/pages'),
        file('src/pages/Home.vue'),
        directory('src/views'),
        file('src/views/AboutView.vue'),
        directory('public'),
        file('public/logo.svg'),
        directory('docs'),
        file('docs/components.md'),
        file('package.json'),
        file('tsconfig.json'),
        file('vite.config.ts'),
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

  describe('Angular frontend detector realistic repo fixtures', () => {
    it('detects a realistic Angular CLI workspace app', () => {
      const result = analyze([
        file('angular.json'),
        directory('src'),
        directory('src/app'),
        file('src/app/app.component.html'),
        file('src/app/app.component.scss'),
        file('src/app/app.component.spec.ts'),
        file('src/app/app.component.ts'),
        directory('src/app/components'),
        file('src/app/components/resume-card.component.ts'),
        directory('src/assets'),
        file('src/assets/logo.svg'),
        file('src/favicon.ico'),
        file('src/index.html'),
        file('src/main.ts'),
        file('src/styles.css'),
        directory('tests'),
        file('tests/app.e2e-spec.ts'),
        directory('docs'),
        file('docs/deployment.md'),
        file('package.json'),
        file('tsconfig.app.json'),
        file('tsconfig.json'),
        file('tsconfig.spec.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'angular.json',
          'src/app/app.component.html',
          'src/app/app.component.ts',
          'src/main.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic standalone Angular app', () => {
      const result = analyze([
        directory('src'),
        directory('src/app'),
        file('src/app/app.component.html'),
        file('src/app/app.component.scss'),
        file('src/app/app.component.ts'),
        file('src/app/app.config.ts'),
        file('src/app/app.routes.ts'),
        directory('src/app/pages'),
        file('src/app/pages/dashboard.component.ts'),
        directory('src/app/services'),
        file('src/app/services/session.service.ts'),
        file('src/index.html'),
        file('src/main.ts'),
        file('src/styles.css'),
        file('package.json'),
        file('tsconfig.app.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'src/app/app.component.ts',
          'src/app/app.config.ts',
          'src/main.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic classic NgModule Angular app', () => {
      const result = analyze([
        directory('src'),
        directory('src/app'),
        file('src/app/app-routing.module.ts'),
        file('src/app/app.component.html'),
        file('src/app/app.component.scss'),
        file('src/app/app.component.ts'),
        file('src/app/app.module.ts'),
        directory('src/app/components'),
        file('src/app/components/nav.component.ts'),
        directory('src/app/services'),
        file('src/app/services/api.service.ts'),
        file('src/index.html'),
        file('src/main.ts'),
        file('src/styles.scss'),
        file('package.json'),
        file('tsconfig.app.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'src/app/app.component.ts',
          'src/app/app.module.ts',
          'src/main.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a config-only Angular workspace shell', () => {
      const result = analyze([
        file('angular.json'),
        directory('docs'),
        file('docs/architecture.md'),
        directory('public'),
        file('public/favicon.ico'),
        file('package.json'),
        file('tsconfig.app.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: ['angular.json'],
      });
    });

    it('keeps a realistic monorepo Angular app isolated from sibling frontend apps', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/angular'),
        file('apps/angular/angular.json'),
        directory('apps/angular/src'),
        directory('apps/angular/src/app'),
        file('apps/angular/src/app/app.component.html'),
        file('apps/angular/src/app/app.component.ts'),
        file('apps/angular/src/app/app.config.ts'),
        file('apps/angular/src/app/app.routes.ts'),
        file('apps/angular/src/index.html'),
        file('apps/angular/src/main.ts'),
        file('apps/angular/src/styles.css'),
        file('apps/angular/package.json'),
        file('apps/angular/tsconfig.app.json'),
        directory('apps/vue'),
        file('apps/vue/index.html'),
        directory('apps/vue/src'),
        file('apps/vue/src/App.vue'),
        file('apps/vue/src/main.ts'),
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

      expect(areaByName(result, 'Frontend app', 'apps/angular')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/angular/angular.json',
          'apps/angular/src/app/app.component.ts',
          'apps/angular/src/app/app.config.ts',
          'apps/angular/src/main.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', 'apps/vue')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/vue/src/App.vue',
          'apps/vue/src/main.ts',
          'apps/vue/vite.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('does not emit from realistic weak Angular-like hints alone', () => {
      const result = analyze([
        file('project.json'),
        directory('src'),
        directory('src/app'),
        file('src/app/app.component.html'),
        file('src/app/app.component.scss'),
        directory('src/app/components'),
        file('src/app/components/card.component.ts'),
        file('src/main.ts'),
        directory('docs'),
        file('docs/components.md'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });
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

  describe('React frontend detector realistic repo fixtures', () => {
    it('detects a realistic Vite React app', () => {
      const result = analyze([
        file('index.html'),
        directory('src'),
        directory('src/assets'),
        file('src/assets/react.svg'),
        file('src/App.tsx'),
        directory('src/components'),
        file('src/components/AppHeader.tsx'),
        file('src/components/ResumeCard.tsx'),
        file('src/index.css'),
        file('src/main.tsx'),
        directory('tests'),
        file('tests/app.test.tsx'),
        directory('docs'),
        file('docs/deployment.md'),
        file('package.json'),
        file('tsconfig.json'),
        file('vite.config.ts'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'index.html',
          'src/App.tsx',
          'src/components/AppHeader.tsx',
          'src/main.tsx',
          'vite.config.ts',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic CRA-style React app', () => {
      const result = analyze([
        directory('public'),
        file('public/favicon.ico'),
        file('public/index.html'),
        file('public/manifest.json'),
        directory('src'),
        file('src/App.css'),
        file('src/App.js'),
        file('src/App.test.js'),
        directory('src/assets'),
        file('src/assets/logo.svg'),
        directory('src/components'),
        file('src/components/ProfileCard.jsx'),
        file('src/index.css'),
        file('src/index.js'),
        file('package.json'),
        file('README.md'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'public/index.html',
          'src/App.css',
          'src/App.js',
          'src/components/ProfileCard.jsx',
          'src/index.js',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic structured React app without entry proof', () => {
      const result = analyze([
        directory('src'),
        file('src/App.tsx'),
        directory('src/components'),
        file('src/components/AppShell.tsx'),
        file('src/components/Button.tsx'),
        directory('src/pages'),
        file('src/pages/Dashboard.tsx'),
        directory('src/services'),
        file('src/services/api.ts'),
        directory('src/styles'),
        file('src/styles/theme.css'),
        file('package.json'),
        file('tsconfig.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'src/App.tsx',
          'src/components/AppShell.tsx',
          'src/pages/Dashboard.tsx',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('blocks same-owner React fallback evidence when stronger framework proof exists', () => {
      const nextResult = analyze([
        file('next.config.ts'),
        file('index.html'),
        directory('src'),
        file('src/App.tsx'),
        file('src/main.tsx'),
        file('vite.config.ts'),
        file('package.json'),
      ]);
      const routerResult = analyze([
        file('react-router.config.ts'),
        directory('app'),
        file('app/root.tsx'),
        file('app/routes.ts'),
        file('index.html'),
        directory('src'),
        file('src/App.tsx'),
        file('src/main.tsx'),
        file('vite.config.ts'),
        file('package.json'),
      ]);

      expect(areaByName(nextResult, 'Frontend app', '.')).toMatchObject({
        evidence: ['next.config.ts'],
      });
      expect(areaByName(nextResult, 'Frontend app', '.')?.evidence).not.toEqual(
        expect.arrayContaining(['index.html', 'src/App.tsx', 'src/main.tsx']),
      );
      expect(areaByName(routerResult, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'app/root.tsx',
          'app/routes.ts',
          'react-router.config.ts',
        ]),
      });
      expect(
        areaByName(routerResult, 'Frontend app', '.')?.evidence,
      ).not.toEqual(
        expect.arrayContaining(['index.html', 'src/App.tsx', 'src/main.tsx']),
      );
    });

    it('keeps a realistic monorepo React app isolated from sibling framework apps', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/react'),
        file('apps/react/index.html'),
        directory('apps/react/src'),
        file('apps/react/src/App.tsx'),
        directory('apps/react/src/components'),
        file('apps/react/src/components/AppHeader.tsx'),
        file('apps/react/src/index.css'),
        file('apps/react/src/main.tsx'),
        file('apps/react/package.json'),
        file('apps/react/tsconfig.json'),
        file('apps/react/vite.config.ts'),
        directory('apps/next'),
        directory('apps/next/app'),
        file('apps/next/app/page.tsx'),
        file('apps/next/next.config.ts'),
        file('apps/next/package.json'),
        directory('apps/router'),
        directory('apps/router/app'),
        file('apps/router/app/root.tsx'),
        file('apps/router/app/routes.ts'),
        file('apps/router/react-router.config.ts'),
        file('apps/router/package.json'),
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

      expect(areaByName(result, 'Frontend app', 'apps/react')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/react/index.html',
          'apps/react/src/App.tsx',
          'apps/react/src/components/AppHeader.tsx',
          'apps/react/src/main.tsx',
          'apps/react/vite.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', 'apps/next')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/next/app/page.tsx',
          'apps/next/next.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', 'apps/router')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/router/app/root.tsx',
          'apps/router/app/routes.ts',
          'apps/router/react-router.config.ts',
        ]),
      });
      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('does not emit from realistic weak React-like hints alone', () => {
      const appOnly = analyze([
        directory('src'),
        file('src/App.tsx'),
        file('package.json'),
      ]);
      const viteOnly = analyze([file('vite.config.ts'), file('package.json')]);
      const componentsOnly = analyze([
        directory('src'),
        directory('src/components'),
        file('src/components/Button.tsx'),
        file('src/components/Card.tsx'),
        file('package.json'),
      ]);

      expect(areaByName(appOnly, 'Frontend app', '.')).toBeUndefined();
      expect(areaByName(viteOnly, 'Frontend app', '.')).toBeUndefined();
      expect(areaByName(componentsOnly, 'Frontend app', '.')).toBeUndefined();
    });
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

  describe('Static frontend detector realistic repo fixtures', () => {
    it('blocks same-owner static fallback evidence for recognized frontend apps', () => {
      const frameworkResults = [
        analyze([
          file('next.config.ts'),
          file('index.html'),
          file('style.css'),
          file('script.js'),
        ]),
        analyze([
          file('nuxt.config.ts'),
          file('index.html'),
          file('style.css'),
          file('script.js'),
        ]),
        analyze([
          file('index.html'),
          file('style.css'),
          file('script.js'),
          directory('src'),
          file('src/App.tsx'),
          file('src/main.tsx'),
          file('vite.config.ts'),
        ]),
        analyze([
          file('index.html'),
          file('style.css'),
          file('script.js'),
          directory('src'),
          file('src/App.vue'),
          file('src/main.ts'),
        ]),
        analyze([
          file('react-router.config.ts'),
          directory('app'),
          file('app/root.tsx'),
          file('index.html'),
          file('style.css'),
          file('script.js'),
        ]),
        analyze([
          file('angular.json'),
          file('index.html'),
          file('style.css'),
          file('script.js'),
        ]),
        analyze([
          file('svelte.config.js'),
          directory('src'),
          directory('src/routes'),
          file('src/routes/+page.svelte'),
          file('index.html'),
          file('style.css'),
          file('script.js'),
        ]),
        analyze([
          directory('src'),
          file('src/App.svelte'),
          file('src/main.ts'),
          file('index.html'),
          file('style.css'),
          file('script.js'),
        ]),
        analyze([
          file('astro.config.mjs'),
          file('index.html'),
          file('style.css'),
          file('script.js'),
        ]),
      ];

      for (const result of frameworkResults) {
        expect(areaByName(result, 'Frontend app', '.')).toBeDefined();
        expect(areaByName(result, 'Frontend app', '.')?.evidence).not.toEqual(
          expect.arrayContaining(['script.js', 'style.css']),
        );
      }
    });

    it('does not let framework proof from another owner block a static site', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/next'),
        file('apps/next/next.config.ts'),
        directory('apps/static'),
        file('apps/static/index.html'),
        file('apps/static/style.css'),
        file('apps/static/script.js'),
        file('package.json'),
      ]);

      expect(areaByName(result, 'Frontend app', 'apps/next')).toMatchObject({
        evidence: ['apps/next/next.config.ts'],
      });
      expect(areaByName(result, 'Frontend app', 'apps/static')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/static/index.html',
          'apps/static/script.js',
          'apps/static/style.css',
        ]),
      });
      expect(areaByName(result, 'Frontend app', '.')).toBeUndefined();
    });

    it('does not let incomplete framework hints block a static site', () => {
      const result = analyze([
        file('index.html'),
        file('style.css'),
        file('script.js'),
        directory('src'),
        file('src/App.tsx'),
        file('package.json'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'index.html',
          'script.js',
          'style.css',
        ]),
      });
    });

    it('detects a realistic static root site', () => {
      const result = analyze([
        file('index.html'),
        file('style.css'),
        file('script.js'),
        directory('images'),
        file('images/logo.svg'),
        file('images/team.jpg'),
        directory('docs'),
        file('docs/content.md'),
        file('README.md'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'index.html',
          'script.js',
          'style.css',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic static site with css and js directories', () => {
      const result = analyze([
        file('index.html'),
        directory('css'),
        file('css/site.css'),
        file('css/theme.css'),
        directory('js'),
        file('js/site.js'),
        file('js/analytics.js'),
        directory('images'),
        file('images/hero.png'),
        file('README.md'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'css/site.css',
          'index.html',
          'js/site.js',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic multi-page static site', () => {
      const result = analyze([
        file('index.html'),
        file('about.html'),
        file('contact.html'),
        directory('css'),
        file('css/site.css'),
        directory('js'),
        file('js/site.js'),
        directory('assets'),
        file('assets/logo.svg'),
        file('README.md'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'about.html',
          'css/site.css',
          'index.html',
          'js/site.js',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('detects a realistic Vite vanilla static app', () => {
      const result = analyze([
        file('index.html'),
        directory('src'),
        file('src/main.js'),
        file('src/style.css'),
        directory('src/assets'),
        file('src/assets/logo.svg'),
        directory('tests'),
        file('tests/site.test.js'),
        file('package.json'),
        file('vite.config.js'),
      ]);

      expect(areaByName(result, 'Frontend app', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'index.html',
          'src/main.js',
          'src/style.css',
          'vite.config.js',
        ]),
      });
      expect(
        result.detectedAreas.filter((area) => area.name === 'Frontend app'),
      ).toHaveLength(1);
    });

    it('keeps a realistic monorepo static site isolated from sibling frontend apps', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/static'),
        file('apps/static/index.html'),
        directory('apps/static/css'),
        file('apps/static/css/site.css'),
        directory('apps/static/js'),
        file('apps/static/js/site.js'),
        directory('apps/static/images'),
        file('apps/static/images/logo.svg'),
        directory('apps/react'),
        file('apps/react/index.html'),
        directory('apps/react/src'),
        file('apps/react/src/App.tsx'),
        file('apps/react/src/main.tsx'),
        file('apps/react/package.json'),
        file('apps/react/vite.config.ts'),
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

      expect(areaByName(result, 'Frontend app', 'apps/static')).toMatchObject({
        evidence: expect.arrayContaining([
          'apps/static/css/site.css',
          'apps/static/index.html',
          'apps/static/js/site.js',
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

    it('does not emit from realistic weak static hints alone', () => {
      const indexOnly = analyze([file('index.html')]);
      const nestedGeneratedHtml = analyze([
        directory('docs'),
        file('docs/index.html'),
        file('docs/about.html'),
        directory('docs/css'),
        file('docs/css/site.css'),
      ]);
      const assetsWithoutRootIndex = analyze([
        file('style.css'),
        file('script.js'),
        directory('css'),
        file('css/site.css'),
        directory('js'),
        file('js/site.js'),
      ]);

      expect(areaByName(indexOnly, 'Frontend app', '.')).toBeUndefined();
      expect(
        areaByName(nestedGeneratedHtml, 'Frontend app', '.'),
      ).toBeUndefined();
      expect(
        areaByName(assetsWithoutRootIndex, 'Frontend app', '.'),
      ).toBeUndefined();
    });
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

  describe('NestJS backend detector', () => {
    it('detects the official NestJS starter shape', () => {
      const result = analyze([
        file('nest-cli.json'),
        directory('src'),
        file('src/app.controller.ts'),
        file('src/app.module.ts'),
        file('src/app.service.ts'),
        file('src/main.ts'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'nest-cli.json',
          'src/app.controller.ts',
          'src/app.module.ts',
          'src/app.service.ts',
          'src/main.ts',
        ],
        inferredTechnologies: {
          primary: 'NestJS',
          related: [],
        },
      });
    });

    it('detects the canonical main-entry and root-module shape', () => {
      const result = analyze([
        directory('src'),
        file('src/app.module.ts'),
        file('src/main.ts'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 0.67,
        evidence: ['src/app.module.ts', 'src/main.ts'],
        inferredTechnologies: {
          primary: 'NestJS',
          related: [],
        },
      });
    });

    it.each([
      {
        name: 'REST or microservice',
        handlerPath: 'src/math/math.controller.ts',
      },
      {
        name: 'WebSocket',
        handlerPath: 'src/events/events.gateway.ts',
      },
      {
        name: 'GraphQL',
        handlerPath: 'src/recipes/recipes.resolver.ts',
      },
    ])(
      'detects a custom $name shape from entry, feature module, and handler',
      ({ handlerPath }) => {
        const result = analyze([
          directory('src'),
          directory(handlerPath.split('/').slice(0, -1).join('/')),
          file('src/main.ts'),
          file(
            `${handlerPath.split('/').slice(0, -1).join('/')}/feature.module.ts`,
          ),
          file(handlerPath),
        ]);

        expect(areaByName(result, 'Backend API', '.')).toMatchObject({
          confidence: 0.83,
          evidence: expect.arrayContaining([
            handlerPath,
            'src/main.ts',
            `${handlerPath.split('/').slice(0, -1).join('/')}/feature.module.ts`,
          ]),
          inferredTechnologies: {
            primary: 'NestJS',
            related: [],
          },
        });
      },
    );

    it.each([
      {
        name: 'controller',
        handlerPath: 'src/health/health.controller.ts',
      },
      {
        name: 'resolver',
        handlerPath: 'src/users/users.resolver.ts',
      },
    ])(
      'detects a backend package from a root module and $name',
      ({ handlerPath }) => {
        const result = analyze([
          directory('src'),
          file('src/app.module.ts'),
          file(handlerPath),
        ]);

        expect(areaByName(result, 'Backend API', '.')).toMatchObject({
          confidence: 0.83,
          evidence: expect.arrayContaining([handlerPath, 'src/app.module.ts']),
          inferredTechnologies: {
            primary: 'NestJS',
            related: [],
          },
        });
      },
    );

    it('detects an Nx-style NestJS app with a nested app module', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        directory('apps/api/src'),
        directory('apps/api/src/app'),
        file('apps/api/src/app/app.controller.ts'),
        file('apps/api/src/app/app.module.ts'),
        file('apps/api/src/main.ts'),
      ]);

      expect(areaByName(result, 'Backend API', 'apps/api')).toMatchObject({
        confidence: 0.83,
        evidence: [
          'apps/api/src/app/app.controller.ts',
          'apps/api/src/app/app.module.ts',
          'apps/api/src/main.ts',
        ],
        inferredTechnologies: {
          primary: 'NestJS',
          related: [],
        },
      });
    });

    it('keeps NestJS monorepo owners isolated', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        directory('apps/api/src'),
        file('apps/api/nest-cli.json'),
        file('apps/api/src/main.ts'),
        directory('apps/worker'),
        directory('apps/worker/src'),
        file('apps/worker/src/app.module.ts'),
        file('apps/worker/src/jobs/jobs.controller.ts'),
        directory('apps/web'),
        directory('apps/web/src'),
        file('apps/web/src/main.ts'),
        file('apps/web/src/app/app.module.ts'),
        file('apps/web/src/app/app.service.ts'),
      ]);

      expect(areaByName(result, 'Backend API', 'apps/api')).toMatchObject({
        evidence: ['apps/api/nest-cli.json', 'apps/api/src/main.ts'],
      });
      expect(areaByName(result, 'Backend API', 'apps/worker')).toMatchObject({
        evidence: [
          'apps/worker/src/app.module.ts',
          'apps/worker/src/jobs/jobs.controller.ts',
        ],
      });
      expect(areaByName(result, 'Backend API', 'apps/web')).toBeUndefined();
      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it.each([
      {
        name: 'CLI configuration alone',
        entries: [file('nest-cli.json')],
      },
      {
        name: 'main entry alone',
        entries: [file('src/main.ts')],
      },
      {
        name: 'root module alone',
        entries: [file('src/app.module.ts')],
      },
      {
        name: 'controller alone',
        entries: [file('src/users/users.controller.ts')],
      },
      {
        name: 'gateway alone',
        entries: [file('src/events/events.gateway.ts')],
      },
      {
        name: 'resolver alone',
        entries: [file('src/users/users.resolver.ts')],
      },
      {
        name: 'service alone',
        entries: [file('src/users/users.service.ts')],
      },
    ])('does not detect NestJS from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('does not detect Angular-like main, module, and service evidence', () => {
      const result = analyze([
        directory('src'),
        directory('src/app'),
        file('src/main.ts'),
        file('src/app/app.module.ts'),
        file('src/app/app.service.ts'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('does not detect an unanchored controller, service, and gateway cluster', () => {
      const result = analyze([
        file('src/events/events.controller.ts'),
        file('src/events/events.gateway.ts'),
        file('src/events/events.service.ts'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('does not detect a feature module, controller, and service without an anchor', () => {
      const result = analyze([
        file('src/users/users.controller.ts'),
        file('src/users/users.module.ts'),
        file('src/users/users.service.ts'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('counts repeated NestJS feature signals once per owner', () => {
      const result = analyze([
        file('src/main.ts'),
        file('src/users/users.controller.ts'),
        file('src/users/users.module.ts'),
        file('src/orders/orders.controller.ts'),
        file('src/orders/orders.module.ts'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 0.83,
        evidence: [
          'src/main.ts',
          'src/users/users.controller.ts',
          'src/users/users.module.ts',
        ],
      });
    });
  });

  describe('Django backend detector', () => {
    it('detects the official Django startproject shape', () => {
      const result = analyze([
        file('manage.py'),
        directory('mysite'),
        file('mysite/__init__.py'),
        file('mysite/settings.py'),
        file('mysite/urls.py'),
        file('mysite/asgi.py'),
        file('mysite/wsgi.py'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'manage.py',
          'mysite/asgi.py',
          'mysite/settings.py',
          'mysite/urls.py',
          'mysite/wsgi.py',
        ],
        inferredTechnologies: {
          primary: 'Django',
          related: ['Python'],
        },
      });
    });

    it.each([
      {
        name: 'classic settings module',
        entries: [file('manage.py'), file('config/settings.py')],
        evidence: ['config/settings.py', 'manage.py'],
      },
      {
        name: 'root URL configuration',
        entries: [file('manage.py'), file('config/urls.py')],
        evidence: ['config/urls.py', 'manage.py'],
      },
      {
        name: 'WSGI server entry',
        entries: [file('manage.py'), file('config/wsgi.py')],
        evidence: ['config/wsgi.py', 'manage.py'],
      },
      {
        name: 'ASGI server entry',
        entries: [file('manage.py'), file('config/asgi.py')],
        evidence: ['config/asgi.py', 'manage.py'],
      },
    ])(
      'detects a manage-backed Django project with $name',
      ({ entries, evidence }) => {
        const result = analyze(entries);

        expect(areaByName(result, 'Backend API', '.')).toMatchObject({
          confidence: 1,
          evidence,
          inferredTechnologies: {
            primary: 'Django',
            related: ['Python'],
          },
        });
      },
    );

    it('detects a Cookiecutter-style split settings project', () => {
      const result = analyze([
        file('manage.py'),
        directory('config'),
        directory('config/settings'),
        file('config/settings/base.py'),
        file('config/settings/production.py'),
        file('config/urls.py'),
        file('config/wsgi.py'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'config/settings/base.py',
          'config/urls.py',
          'config/wsgi.py',
          'manage.py',
        ],
        inferredTechnologies: {
          primary: 'Django',
          related: ['Python'],
        },
      });
    });

    it('detects a manage-backed Django project with app evidence', () => {
      const result = analyze([
        file('manage.py'),
        directory('users'),
        file('users/apps.py'),
        file('users/models.py'),
        directory('users/migrations'),
        file('users/migrations/0001_initial.py'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'manage.py',
          'users/apps.py',
          'users/migrations/0001_initial.py',
          'users/models.py',
        ],
        inferredTechnologies: {
          primary: 'Django',
          related: ['Python'],
        },
      });
    });

    it('detects a settings-backed Django app package', () => {
      const result = analyze([
        file('config/settings/base.py'),
        directory('users'),
        file('users/apps.py'),
        directory('users/migrations'),
        file('users/migrations/0001_initial.py'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'config/settings/base.py',
          'users/apps.py',
          'users/migrations/0001_initial.py',
        ],
        inferredTechnologies: {
          primary: 'Django',
          related: ['Python'],
        },
      });
    });

    it('keeps Django monorepo owners isolated', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        file('apps/api/manage.py'),
        directory('apps/api/config'),
        file('apps/api/config/settings.py'),
        directory('packages'),
        directory('packages/lib'),
        file('packages/lib/models.py'),
      ]);

      expect(areaByName(result, 'Backend API', 'apps/api')).toMatchObject({
        evidence: ['apps/api/config/settings.py', 'apps/api/manage.py'],
        inferredTechnologies: {
          primary: 'Django',
          related: ['Python'],
        },
      });
      expect(areaByName(result, 'Backend API', 'packages/lib')).toBeUndefined();
      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('counts repeated Django app signals once per owner', () => {
      const result = analyze([
        file('manage.py'),
        file('users/apps.py'),
        file('users/models.py'),
        file('users/migrations/0001_initial.py'),
        file('orders/apps.py'),
        file('orders/models.py'),
        file('orders/migrations/0001_initial.py'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'manage.py',
          'users/apps.py',
          'users/migrations/0001_initial.py',
          'users/models.py',
        ],
      });
    });

    it.each([
      {
        name: 'manage entry alone',
        entries: [file('manage.py')],
      },
      {
        name: 'settings module alone',
        entries: [file('config/settings.py')],
      },
      {
        name: 'root URL configuration alone',
        entries: [file('config/urls.py')],
      },
      {
        name: 'WSGI entry alone',
        entries: [file('config/wsgi.py')],
      },
      {
        name: 'ASGI entry alone',
        entries: [file('config/asgi.py')],
      },
      {
        name: 'generic Python module files',
        entries: [
          file('backend/models.py'),
          file('backend/views.py'),
          file('backend/admin.py'),
        ],
      },
      {
        name: 'reusable Django app without a project anchor',
        entries: [
          file('users/apps.py'),
          file('users/models.py'),
          file('users/migrations/0001_initial.py'),
        ],
      },
      {
        name: 'FastAPI or Flask-like Python project',
        entries: [
          file('app/main.py'),
          file('app/models.py'),
          file('app/views.py'),
        ],
      },
    ])('does not detect Django from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });
  });

  describe('Spring Boot backend detector', () => {
    it('detects the official Spring Boot application shape', () => {
      const result = analyze([
        file('pom.xml'),
        directory('src'),
        directory('src/main'),
        directory('src/main/java'),
        file('src/main/java/com/example/demo/DemoApplication.java'),
        directory('src/main/resources'),
        file('src/main/resources/application.properties'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'pom.xml',
          'src/main/java/com/example/demo/DemoApplication.java',
          'src/main/resources/application.properties',
        ],
        inferredTechnologies: {
          primary: 'Spring Boot',
          related: ['Java'],
        },
      });
    });

    it('detects a Gradle-backed Spring Boot web app', () => {
      const result = analyze([
        file('build.gradle'),
        file('src/main/java/com/example/api/ApiApplication.java'),
        file('src/main/java/com/example/api/UserController.java'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'build.gradle',
          'src/main/java/com/example/api/ApiApplication.java',
          'src/main/java/com/example/api/UserController.java',
        ],
        inferredTechnologies: {
          primary: 'Spring Boot',
          related: ['Java'],
        },
      });
    });

    it('detects a JHipster-style Spring Boot REST app', () => {
      const result = analyze([
        file('pom.xml'),
        file('src/main/java/io/github/app/MyApplicationApp.java'),
        file('src/main/resources/config/application.yml'),
        file('src/main/java/io/github/app/web/rest/UserResource.java'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'pom.xml',
          'src/main/java/io/github/app/MyApplicationApp.java',
          'src/main/java/io/github/app/web/rest/UserResource.java',
          'src/main/resources/config/application.yml',
        ],
        inferredTechnologies: {
          primary: 'Spring Boot',
          related: ['Java'],
        },
      });
    });

    it('detects a config-backed Spring Boot web app', () => {
      const result = analyze([
        file('src/main/resources/application.yml'),
        file('src/main/java/com/example/web/UserController.java'),
        file('src/main/java/com/example/service/UserService.java'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'src/main/java/com/example/service/UserService.java',
          'src/main/java/com/example/web/UserController.java',
          'src/main/resources/application.yml',
        ],
        inferredTechnologies: {
          primary: 'Spring Boot',
          related: ['Java'],
        },
      });
    });

    it('detects a Kotlin Spring Boot app', () => {
      const result = analyze([
        file('build.gradle.kts'),
        file('src/main/kotlin/com/example/DemoApplication.kt'),
        file('src/main/kotlin/com/example/GreetingController.kt'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'build.gradle.kts',
          'src/main/kotlin/com/example/DemoApplication.kt',
          'src/main/kotlin/com/example/GreetingController.kt',
        ],
        inferredTechnologies: {
          primary: 'Spring Boot',
          related: ['Kotlin'],
        },
      });
    });

    it('detects mixed Java and Kotlin Spring Boot evidence', () => {
      const result = analyze([
        file('src/main/java/com/example/DemoApplication.java'),
        file('src/main/kotlin/com/example/GreetingController.kt'),
        file('src/main/resources/application.yml'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        inferredTechnologies: {
          primary: 'Spring Boot',
          related: ['Java', 'Kotlin'],
        },
      });
    });

    it('keeps Spring Boot monorepo owners isolated', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        file('apps/api/build.gradle'),
        file('apps/api/src/main/java/com/example/api/ApiApplication.java'),
        file('apps/api/src/main/resources/application.yml'),
        directory('packages'),
        directory('packages/lib'),
        file('packages/lib/src/main/java/com/example/UserRepository.java'),
      ]);

      expect(areaByName(result, 'Backend API', 'apps/api')).toMatchObject({
        evidence: [
          'apps/api/build.gradle',
          'apps/api/src/main/java/com/example/api/ApiApplication.java',
          'apps/api/src/main/resources/application.yml',
        ],
        inferredTechnologies: {
          primary: 'Spring Boot',
          related: ['Java'],
        },
      });
      expect(areaByName(result, 'Backend API', 'packages/lib')).toBeUndefined();
      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('counts repeated Spring Boot support signals once per owner', () => {
      const result = analyze([
        file('src/main/java/com/example/DemoApplication.java'),
        file('src/main/resources/application.yml'),
        file('src/main/java/com/example/users/UserController.java'),
        file('src/main/java/com/example/orders/OrderController.java'),
        file('src/main/java/com/example/users/UserService.java'),
        file('src/main/java/com/example/orders/OrderService.java'),
        file('src/main/java/com/example/users/UserRepository.java'),
        file('src/main/java/com/example/orders/OrderRepository.java'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'src/main/java/com/example/DemoApplication.java',
          'src/main/java/com/example/users/UserController.java',
          'src/main/java/com/example/users/UserRepository.java',
          'src/main/java/com/example/users/UserService.java',
          'src/main/resources/application.yml',
        ],
      });
    });

    it.each([
      {
        name: 'Maven build file alone',
        entries: [file('pom.xml')],
      },
      {
        name: 'Gradle build file alone',
        entries: [file('build.gradle')],
      },
      {
        name: 'main application alone',
        entries: [file('src/main/java/com/example/DemoApplication.java')],
      },
      {
        name: 'application config alone',
        entries: [file('src/main/resources/application.yml')],
      },
      {
        name: 'controller, service, and repository without an anchor',
        entries: [
          file('src/main/java/com/example/UserController.java'),
          file('src/main/java/com/example/UserService.java'),
          file('src/main/java/com/example/UserRepository.java'),
        ],
      },
      {
        name: 'application plus service and repository without config or handler',
        entries: [
          file('src/main/java/com/example/DemoApplication.java'),
          file('src/main/java/com/example/UserService.java'),
          file('src/main/java/com/example/UserRepository.java'),
        ],
      },
      {
        name: 'application config plus repository and service without handler',
        entries: [
          file('src/main/resources/application.yml'),
          file('src/main/java/com/example/UserRepository.java'),
          file('src/main/java/com/example/UserService.java'),
        ],
      },
    ])('does not detect Spring Boot from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });
  });

  describe('ASP.NET Core backend detector', () => {
    it('detects a controller Web API app', () => {
      const result = analyze([
        file('Api.csproj'),
        file('Program.cs'),
        file('appsettings.json'),
        directory('Controllers'),
        file('Controllers/UsersController.cs'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'Api.csproj',
          'appsettings.json',
          'Controllers/UsersController.cs',
          'Program.cs',
        ],
        inferredTechnologies: {
          primary: 'ASP.NET Core',
          related: ['.NET', 'C#'],
        },
      });
    });

    it('detects a minimal API endpoint-folder app', () => {
      const result = analyze([
        file('Web.csproj'),
        file('Program.cs'),
        file('appsettings.json'),
        file('Endpoints/TodoItems.cs'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'appsettings.json',
          'Endpoints/TodoItems.cs',
          'Program.cs',
          'Web.csproj',
        ],
        inferredTechnologies: {
          primary: 'ASP.NET Core',
          related: ['.NET', 'C#'],
        },
      });
    });

    it('detects a legacy Startup ASP.NET Core app', () => {
      const result = analyze([
        file('Api.csproj'),
        file('Startup.cs'),
        file('appsettings.json'),
        file('Controllers/HomeController.cs'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'ASP.NET Core',
          related: ['.NET', 'C#'],
        },
      });
    });

    it('detects a launch-settings backed minimal host', () => {
      const result = analyze([
        file('Api.csproj'),
        file('Program.cs'),
        file('appsettings.Development.json'),
        file('Properties/launchSettings.json'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'ASP.NET Core',
          related: ['.NET', 'C#'],
        },
      });
    });

    it('detects a Razor Pages app', () => {
      const result = analyze([
        file('Web.csproj'),
        file('Program.cs'),
        file('appsettings.json'),
        file('Pages/Index.cshtml'),
        file('Pages/Index.cshtml.cs'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'ASP.NET Core',
          related: ['.NET', 'C#'],
        },
      });
    });

    it('detects an MVC Views app', () => {
      const result = analyze([
        file('Web.csproj'),
        file('Startup.cs'),
        file('appsettings.json'),
        file('Views/Home/Index.cshtml'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'ASP.NET Core',
          related: ['.NET', 'C#'],
        },
      });
    });

    it('keeps ASP.NET Core monorepo owners isolated', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        file('apps/api/Api.csproj'),
        file('apps/api/Program.cs'),
        file('apps/api/appsettings.json'),
        file('apps/api/Controllers/UsersController.cs'),
        directory('packages'),
        directory('packages/lib'),
        file('packages/lib/Library.csproj'),
      ]);

      expect(areaByName(result, 'Backend API', 'apps/api')).toMatchObject({
        evidence: [
          'apps/api/Api.csproj',
          'apps/api/appsettings.json',
          'apps/api/Controllers/UsersController.cs',
          'apps/api/Program.cs',
        ],
        inferredTechnologies: {
          primary: 'ASP.NET Core',
          related: ['.NET', 'C#'],
        },
      });
      expect(areaByName(result, 'Backend API', 'packages/lib')).toBeUndefined();
      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('counts repeated ASP.NET Core signals once per owner', () => {
      const result = analyze([
        file('Web.csproj'),
        file('Program.cs'),
        file('appsettings.json'),
        file('appsettings.Development.json'),
        file('Controllers/UsersController.cs'),
        file('Controllers/OrdersController.cs'),
        file('Endpoints/TodoItems.cs'),
        file('Endpoints/TodoLists.cs'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'appsettings.Development.json',
          'appsettings.json',
          'Controllers/UsersController.cs',
          'Endpoints/TodoItems.cs',
          'Program.cs',
          'Web.csproj',
        ],
      });
    });

    it.each([
      {
        name: 'project file alone',
        entries: [file('Api.csproj')],
      },
      {
        name: 'Program entry alone',
        entries: [file('Program.cs')],
      },
      {
        name: 'Startup class alone',
        entries: [file('Startup.cs')],
      },
      {
        name: 'appsettings alone',
        entries: [file('appsettings.json')],
      },
      {
        name: 'launch settings alone',
        entries: [file('Properties/launchSettings.json')],
      },
      {
        name: 'Program and project file without config or web handler',
        entries: [file('Api.csproj'), file('Program.cs')],
      },
      {
        name: 'controller, service, and model without an anchor',
        entries: [
          file('Controllers/UsersController.cs'),
          file('Services/UserService.cs'),
          file('Models/User.cs'),
        ],
      },
      {
        name: 'client wwwroot appsettings config',
        entries: [
          file('Client.csproj'),
          file('Program.cs'),
          file('wwwroot/appsettings.json'),
        ],
      },
    ])('does not detect ASP.NET Core from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });
  });

  describe('Laravel backend detector', () => {
    it('detects a current Laravel application', () => {
      const result = analyze([
        file('artisan'),
        file('bootstrap/app.php'),
        file('bootstrap/providers.php'),
        file('app/Providers/AppServiceProvider.php'),
        file('routes/web.php'),
        file('routes/console.php'),
        file('public/index.php'),
        file('composer.json'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'app/Providers/AppServiceProvider.php',
          'artisan',
          'bootstrap/app.php',
          'bootstrap/providers.php',
          'composer.json',
          'public/index.php',
          'routes/console.php',
          'routes/web.php',
        ],
        inferredTechnologies: {
          primary: 'Laravel',
          related: ['PHP'],
        },
      });
    });

    it('detects the canonical Laravel artisan and bootstrap pair', () => {
      const result = analyze([file('artisan'), file('bootstrap/app.php')]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'Laravel',
          related: ['PHP'],
        },
      });
    });

    it('detects a modern Laravel shape without artisan', () => {
      const result = analyze([
        file('bootstrap/app.php'),
        file('bootstrap/providers.php'),
        file('app/Providers/AppServiceProvider.php'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'Laravel',
          related: ['PHP'],
        },
      });
    });

    it('detects a legacy Laravel application shape', () => {
      const result = analyze([
        file('bootstrap/app.php'),
        file('app/Http/Kernel.php'),
        file('app/Providers/RouteServiceProvider.php'),
        file('routes/web.php'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'Laravel',
          related: ['PHP'],
        },
      });
    });

    it('detects an artisan-owned Laravel API shape', () => {
      const result = analyze([
        file('artisan'),
        file('app/Providers/AppServiceProvider.php'),
        file('routes/api.php'),
        file('app/Http/Controllers/UserController.php'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'app/Http/Controllers/UserController.php',
          'app/Providers/AppServiceProvider.php',
          'artisan',
          'routes/api.php',
        ],
        inferredTechnologies: {
          primary: 'Laravel',
          related: ['PHP'],
        },
      });
    });

    it('adds Blade as related technology when the owner has Blade views', () => {
      const result = analyze([
        file('artisan'),
        file('bootstrap/app.php'),
        file('resources/views/home.blade.php'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        inferredTechnologies: {
          primary: 'Laravel',
          related: ['Blade', 'PHP'],
        },
      });
    });

    it('keeps Laravel monorepo owners isolated', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        file('apps/api/artisan'),
        file('apps/api/bootstrap/app.php'),
        file('apps/api/routes/api.php'),
        directory('packages'),
        directory('packages/permissions'),
        file('packages/permissions/composer.json'),
        file('packages/permissions/src/PermissionServiceProvider.php'),
        file('packages/permissions/config/permission.php'),
        file(
          'packages/permissions/database/migrations/2024_01_01_000000_create_permissions_table.php',
        ),
      ]);

      expect(areaByName(result, 'Backend API', 'apps/api')).toMatchObject({
        inferredTechnologies: {
          primary: 'Laravel',
          related: ['PHP'],
        },
      });
      expect(
        areaByName(result, 'Backend API', 'packages/permissions'),
      ).toBeUndefined();
      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('counts repeated Laravel signals once per owner', () => {
      const result = analyze([
        file('artisan'),
        file('bootstrap/app.php'),
        file('app/Http/Controllers/UserController.php'),
        file('app/Http/Controllers/OrderController.php'),
        file('app/Models/User.php'),
        file('app/Models/Order.php'),
        file('database/migrations/2024_01_01_000000_create_users_table.php'),
        file('database/migrations/2024_01_02_000000_create_orders_table.php'),
        file('resources/views/users/index.blade.php'),
        file('resources/views/orders/index.blade.php'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'app/Http/Controllers/UserController.php',
          'app/Models/User.php',
          'artisan',
          'bootstrap/app.php',
          'database/migrations/2024_01_01_000000_create_users_table.php',
          'resources/views/users/index.blade.php',
        ],
        inferredTechnologies: {
          primary: 'Laravel',
          related: ['Blade', 'PHP'],
        },
      });
    });

    it.each([
      {
        name: 'artisan alone',
        entries: [file('artisan')],
      },
      {
        name: 'bootstrap app alone',
        entries: [file('bootstrap/app.php')],
      },
      {
        name: 'Composer and Laravel-like config',
        entries: [file('composer.json'), file('config/app.php')],
      },
      {
        name: 'route files without an application anchor',
        entries: [
          file('routes/web.php'),
          file('routes/api.php'),
          file('routes/console.php'),
        ],
      },
      {
        name: 'application support files without an anchor',
        entries: [
          file('app/Http/Controllers/UserController.php'),
          file('app/Models/User.php'),
          file('database/migrations/2024_01_01_000000_create_users_table.php'),
          file('database/seeders/DatabaseSeeder.php'),
          file('resources/views/users/index.blade.php'),
        ],
      },
      {
        name: 'reusable Laravel package structure',
        entries: [
          file('composer.json'),
          file('src/PermissionServiceProvider.php'),
          file('config/permission.php'),
          file(
            'database/migrations/2024_01_01_000000_create_permissions_table.php',
          ),
        ],
      },
      {
        name: 'generic PHP public application',
        entries: [file('composer.json'), file('public/index.php')],
      },
    ])('does not detect Laravel from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });
  });

  describe('Ruby on Rails backend detector', () => {
    it('detects a Rails 8-style full application', () => {
      const result = analyze([
        file('bin/rails'),
        file('config/application.rb'),
        file('config/boot.rb'),
        file('config/environment.rb'),
        file('config/environments/development.rb'),
        file('config/routes.rb'),
        file('config.ru'),
        file('app/controllers/application_controller.rb'),
        file('app/models/application_record.rb'),
        file('app/jobs/application_job.rb'),
        file('app/mailers/application_mailer.rb'),
        file('config/database.yml'),
        file('db/schema.rb'),
        file('Gemfile'),
        file('Rakefile'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: expect.arrayContaining([
          'bin/rails',
          'config/application.rb',
          'config/boot.rb',
          'config/environment.rb',
          'config/routes.rb',
        ]),
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['Ruby'],
        },
      });
    });

    it('detects canonical Rails boot through bin and boot config', () => {
      const result = analyze([
        file('bin/rails'),
        file('config/application.rb'),
        file('config/boot.rb'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['Ruby'],
        },
      });
    });

    it('detects canonical Rails boot through bin and environment entry', () => {
      const result = analyze([
        file('bin/rails'),
        file('config/application.rb'),
        file('config/environment.rb'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['Ruby'],
        },
      });
    });

    it('detects a Rack-booted Rails application', () => {
      const result = analyze([
        file('config/application.rb'),
        file('config/environment.rb'),
        file('config.ru'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['Ruby'],
        },
      });
    });

    it('detects a routed Rails application', () => {
      const result = analyze([
        file('config/application.rb'),
        file('config/routes.rb'),
        file('app/controllers/application_controller.rb'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['Ruby'],
        },
      });
    });

    it('detects a configured Rails application', () => {
      const result = analyze([
        file('config/application.rb'),
        file('config/boot.rb'),
        file('config/routes.rb'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['Ruby'],
        },
      });
    });

    it('detects an API-only Rails application without view evidence', () => {
      const result = analyze([
        file('bin/rails'),
        file('config/application.rb'),
        file('config/boot.rb'),
        file('config/routes.rb'),
        file('app/controllers/application_controller.rb'),
        file('app/controllers/api/users_controller.rb'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['Ruby'],
        },
      });
    });

    it('adds ERB as related technology for server-rendered Rails views', () => {
      const result = analyze([
        file('bin/rails'),
        file('config/application.rb'),
        file('config/boot.rb'),
        file('app/views/users/index.html.erb'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['ERB', 'Ruby'],
        },
      });
    });

    it('detects legacy Rails applications without ApplicationRecord', () => {
      const result = analyze([
        file('bin/rails'),
        file('config/application.rb'),
        file('config/environment.rb'),
        file('app/models/user.rb'),
        file('db/migrate/20160101120000_create_users.rb'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['Ruby'],
        },
      });
    });

    it.each(['db/schema.rb', 'db/structure.sql'])(
      'counts Rails database schema evidence from %s',
      (schemaPath) => {
        const result = analyze([
          file('bin/rails'),
          file('config/application.rb'),
          file('config/boot.rb'),
          file(schemaPath),
        ]);

        expect(areaByName(result, 'Backend API', '.')).toMatchObject({
          evidence: expect.arrayContaining([schemaPath]),
          inferredTechnologies: {
            primary: 'Ruby on Rails',
            related: ['Ruby'],
          },
        });
      },
    );

    it('keeps Rails monorepo owners isolated', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        file('apps/api/bin/rails'),
        file('apps/api/config/application.rb'),
        file('apps/api/config/boot.rb'),
        file('apps/api/config/routes.rb'),
        directory('packages'),
        directory('packages/engine'),
        file('packages/engine/Gemfile'),
        file('packages/engine/Rakefile'),
        file('packages/engine/bin/rails'),
        file('packages/engine/config/routes.rb'),
        file('packages/engine/app/controllers/users_controller.rb'),
      ]);

      expect(areaByName(result, 'Backend API', 'apps/api')).toMatchObject({
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['Ruby'],
        },
      });
      expect(
        areaByName(result, 'Backend API', 'packages/engine'),
      ).toBeUndefined();
      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('counts repeated Rails signals once per owner', () => {
      const result = analyze([
        file('bin/rails'),
        file('config/application.rb'),
        file('config/boot.rb'),
        file('app/controllers/users_controller.rb'),
        file('app/controllers/orders_controller.rb'),
        file('app/models/user.rb'),
        file('app/models/order.rb'),
        file('app/views/users/index.html.erb'),
        file('app/views/orders/index.html.erb'),
        file('db/migrate/20240101120000_create_users.rb'),
        file('db/migrate/20240102120000_create_orders.rb'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'app/controllers/users_controller.rb',
          'app/models/user.rb',
          'app/views/users/index.html.erb',
          'bin/rails',
          'config/application.rb',
          'config/boot.rb',
          'db/migrate/20240101120000_create_users.rb',
        ],
        inferredTechnologies: {
          primary: 'Ruby on Rails',
          related: ['ERB', 'Ruby'],
        },
      });
    });

    it('does not combine Rails gate evidence from sibling owners', () => {
      const result = analyze([
        file('apps/api/bin/rails'),
        file('apps/api/config/application.rb'),
        file('apps/web/config/boot.rb'),
        file('apps/web/config/routes.rb'),
      ]);

      expect(areaByName(result, 'Backend API', 'apps/api')).toBeUndefined();
      expect(areaByName(result, 'Backend API', 'apps/web')).toBeUndefined();
      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('does not promote a Devise-style nested Rails test application', () => {
      const result = analyze([
        file('Gemfile'),
        file('Rakefile'),
        file('test/rails_app/bin/rails'),
        file('test/rails_app/config/application.rb'),
        file('test/rails_app/config/boot.rb'),
        file('test/rails_app/config/environment.rb'),
        file('test/rails_app/config/routes.rb'),
        file('test/rails_app/config.ru'),
        file('test/rails_app/app/controllers/application_controller.rb'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('does not promote Rails framework generator templates', () => {
      const result = analyze([
        file('railties/lib/rails/generators/rails/app/templates/bin/rails.tt'),
        file(
          'railties/lib/rails/generators/rails/app/templates/config/application.rb.tt',
        ),
        file(
          'railties/lib/rails/generators/rails/app/templates/config/boot.rb.tt',
        ),
        file(
          'railties/lib/rails/generators/rails/app/templates/config/environment.rb.tt',
        ),
        file(
          'railties/lib/rails/generators/rails/app/templates/config/routes.rb.tt',
        ),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it.each([
      {
        name: 'bin entry alone',
        entries: [file('bin/rails')],
      },
      {
        name: 'application config alone',
        entries: [file('config/application.rb')],
      },
      {
        name: 'boot config alone',
        entries: [file('config/boot.rb')],
      },
      {
        name: 'environment entry alone',
        entries: [file('config/environment.rb')],
      },
      {
        name: 'routes alone',
        entries: [file('config/routes.rb')],
      },
      {
        name: 'Rack entry alone',
        entries: [file('config.ru')],
      },
      {
        name: 'bin and application config without a third anchor',
        entries: [file('bin/rails'), file('config/application.rb')],
      },
      {
        name: 'Gemfile and Rakefile',
        entries: [file('Gemfile'), file('Rakefile')],
      },
      {
        name: 'generic Rack application',
        entries: [file('Gemfile'), file('config.ru')],
      },
      {
        name: 'score-only Rails conventions',
        entries: [
          file('app/controllers/users_controller.rb'),
          file('app/models/application_record.rb'),
          file('app/models/user.rb'),
          file('app/views/users/index.html.erb'),
          file('db/migrate/20240101120000_create_users.rb'),
          file('db/schema.rb'),
          file('config/database.yml'),
          file('app/jobs/application_job.rb'),
          file('app/mailers/application_mailer.rb'),
        ],
      },
      {
        name: 'Rails Engine without application config',
        entries: [
          file('Gemfile'),
          file('Rakefile'),
          file('bin/rails'),
          file('config/routes.rb'),
          file('app/controllers/users_controller.rb'),
          file('app/models/user.rb'),
        ],
      },
    ])('does not detect Ruby on Rails from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });
  });

  describe('Express.js backend detector', () => {
    it('detects an Express generator application', () => {
      const result = analyze([
        file('app.js'),
        file('bin/www'),
        directory('routes'),
        file('routes/index.js'),
        file('routes/users.js'),
        directory('public'),
        directory('views'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'app.js',
          'bin/www',
          'public',
          'routes',
          'routes/index.js',
          'views',
        ],
        inferredTechnologies: {
          primary: 'Express.js',
          related: ['Node.js'],
        },
      });
    });

    it('detects an Express generator application without views', () => {
      const result = analyze([
        file('app.js'),
        file('bin/www'),
        directory('routes'),
        file('routes/index.js'),
        file('routes/users.js'),
        directory('public'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        inferredTechnologies: {
          primary: 'Express.js',
          related: ['Node.js'],
        },
      });
    });

    it('detects a TypeScript layered Express API', () => {
      const result = analyze([
        file('src/app.ts'),
        directory('src/routes'),
        file('src/routes/users.routes.ts'),
        directory('src/controllers'),
        file('src/controllers/users.controller.ts'),
        directory('src/middlewares'),
        file('src/middlewares/auth.middleware.ts'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'src/app.ts',
          'src/controllers',
          'src/controllers/users.controller.ts',
          'src/middlewares',
          'src/middlewares/auth.middleware.ts',
          'src/routes',
          'src/routes/users.routes.ts',
        ],
        inferredTechnologies: {
          primary: 'Express.js',
          related: ['Node.js'],
        },
      });
    });

    it('detects a JavaScript layered Express API with unsuffixed files', () => {
      const result = analyze([
        file('app.js'),
        directory('routes'),
        file('routes/user.js'),
        directory('controllers'),
        file('controllers/user.js'),
        directory('middleware'),
        file('middleware/auth.js'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        inferredTechnologies: {
          primary: 'Express.js',
          related: ['Node.js'],
        },
      });
    });

    it('detects a TailorCV-style server-owned Express API', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/backend'),
        file('apps/backend/package.json'),
        directory('apps/backend/src'),
        file('apps/backend/src/server.ts'),
        directory('apps/backend/src/routes'),
        file('apps/backend/src/routes/github.router.ts'),
        directory('apps/backend/src/controllers'),
        file('apps/backend/src/controllers/github.controller.ts'),
        directory('apps/backend/src/middleware'),
        file('apps/backend/src/middleware/auth.ts'),
        directory('apps/backend/src/services'),
        file('apps/backend/src/services/github.service.ts'),
      ]);

      expect(areaByName(result, 'Backend API', 'apps/backend')).toMatchObject({
        confidence: 1,
        inferredTechnologies: {
          primary: 'Express.js',
          related: ['Node.js'],
        },
      });
      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('detects a services-backed Express API without middleware', () => {
      const result = analyze([
        file('src/app.ts'),
        directory('src/routes'),
        file('src/routes/auth.route.ts'),
        directory('src/controllers'),
        file('src/controllers/auth.controller.ts'),
        directory('src/services'),
        file('src/services/auth.service.ts'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        inferredTechnologies: {
          primary: 'Express.js',
          related: ['Node.js'],
        },
      });
    });

    it('keeps Express monorepo owners isolated', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        file('apps/api/src/app.ts'),
        directory('apps/api/src/routes'),
        file('apps/api/src/routes/users.routes.ts'),
        directory('apps/api/src/controllers'),
        file('apps/api/src/controllers/users.controller.ts'),
        directory('apps/api/src/middlewares'),
        file('apps/api/src/middlewares/auth.middleware.ts'),
        directory('packages'),
        directory('packages/ui'),
        directory('packages/ui/src'),
        directory('packages/ui/src/controllers'),
        file('packages/ui/src/controllers/button.controller.ts'),
      ]);

      expect(areaByName(result, 'Backend API', 'apps/api')).toMatchObject({
        inferredTechnologies: {
          primary: 'Express.js',
          related: ['Node.js'],
        },
      });
      expect(areaByName(result, 'Backend API', 'packages/ui')).toBeUndefined();
      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });

    it('counts repeated Express signals once per owner', () => {
      const result = analyze([
        file('src/app.ts'),
        directory('src/routes'),
        file('src/routes/users.routes.ts'),
        file('src/routes/orders.routes.ts'),
        directory('src/controllers'),
        file('src/controllers/users.controller.ts'),
        file('src/controllers/orders.controller.ts'),
        directory('src/middlewares'),
        file('src/middlewares/auth.middleware.ts'),
        file('src/middlewares/errors.middleware.ts'),
        directory('src/services'),
        file('src/services/users.service.ts'),
        file('src/services/orders.service.ts'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'src/app.ts',
          'src/controllers',
          'src/controllers/users.controller.ts',
          'src/middlewares',
          'src/middlewares/auth.middleware.ts',
          'src/routes',
          'src/routes/users.routes.ts',
          'src/services',
          'src/services/users.service.ts',
        ],
        inferredTechnologies: {
          primary: 'Express.js',
          related: ['Node.js'],
        },
      });
    });

    it('does not add Express metadata when a stronger backend detector already claimed the owner', () => {
      const result = analyze([
        file('nest-cli.json'),
        file('src/main.ts'),
        file('src/app.module.ts'),
        directory('src/routes'),
        file('src/routes/users.routes.ts'),
        directory('src/controllers'),
        file('src/controllers/users.controller.ts'),
        directory('src/middlewares'),
        file('src/middlewares/auth.middleware.ts'),
      ]);

      expect(areaByName(result, 'Backend API', '.')).toMatchObject({
        inferredTechnologies: {
          primary: 'NestJS',
          related: ['Node.js'],
        },
      });
    });

    it.each([
      {
        name: 'package manifest alone',
        entries: [file('package.json')],
      },
      {
        name: 'app entry alone',
        entries: [file('app.js')],
      },
      {
        name: 'src app entry alone',
        entries: [file('src/app.ts')],
      },
      {
        name: 'server entry alone',
        entries: [file('server.js')],
      },
      {
        name: 'src index with package manifest',
        entries: [file('package.json'), file('src/index.ts')],
      },
      {
        name: 'routes, controllers, and middleware without app or server',
        entries: [
          directory('src/routes'),
          file('src/routes/users.routes.ts'),
          directory('src/controllers'),
          file('src/controllers/users.controller.ts'),
          directory('src/middleware'),
          file('src/middleware/auth.middleware.ts'),
        ],
      },
      {
        name: 'app entry and routes without controller',
        entries: [file('src/app.ts'), file('src/routes/users.routes.ts')],
      },
      {
        name: 'app entry, controller, and middleware without route',
        entries: [
          file('src/app.ts'),
          file('src/controllers/users.controller.ts'),
          file('src/middleware/auth.middleware.ts'),
        ],
      },
      {
        name: 'server entry, routes, and controller without package or support',
        entries: [
          file('src/server.ts'),
          file('src/routes/users.routes.ts'),
          file('src/controllers/users.controller.ts'),
        ],
      },
      {
        name: 'public and views',
        entries: [directory('public'), directory('views')],
      },
      {
        name: 'React-style frontend route and service folders',
        entries: [
          file('vite.config.ts'),
          file('src/App.tsx'),
          directory('src/routes'),
          file('src/routes/Profile.tsx'),
          directory('src/services'),
          file('src/services/api.ts'),
        ],
      },
      {
        name: 'generic Node CLI package',
        entries: [
          file('package.json'),
          file('src/server.ts'),
          directory('src/services'),
          file('src/services/jobs.service.ts'),
        ],
      },
    ])('does not detect Express.js from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(areaByName(result, 'Backend API', '.')).toBeUndefined();
    });
  });

  describe('Prisma database detector', () => {
    it('detects a conventional Prisma schema folder', () => {
      const result = analyze([
        directory('prisma'),
        file('prisma/schema.prisma'),
      ]);

      expect(areaByName(result, 'Database schema', 'prisma')).toMatchObject({
        confidence: expect.any(Number),
        evidence: ['prisma/schema.prisma'],
        inferredTechnologies: {
          primary: 'Prisma',
          related: [],
        },
      });
    });

    it('detects a root Prisma schema file at the repository root', () => {
      const result = analyze([file('schema.prisma')]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        confidence: expect.any(Number),
        evidence: ['schema.prisma'],
        inferredTechnologies: {
          primary: 'Prisma',
          related: [],
        },
      });
    });

    it('detects Prisma migration history without a schema file', () => {
      const result = analyze([
        directory('prisma'),
        directory('prisma/migrations'),
        file('prisma/migrations/20240610120000_init/migration.sql'),
        file('prisma/migrations/migration_lock.toml'),
      ]);

      expect(areaByName(result, 'Database schema', 'prisma')).toMatchObject({
        confidence: 1,
        evidence: [
          'prisma/migrations',
          'prisma/migrations/20240610120000_init/migration.sql',
          'prisma/migrations/migration_lock.toml',
        ],
        inferredTechnologies: {
          primary: 'Prisma',
          related: [],
        },
      });
    });

    it('detects config-backed Prisma schema fragments under one owner', () => {
      const result = analyze([
        directory('prisma'),
        file('prisma/prisma.config.ts'),
        directory('prisma/models'),
        file('prisma/models/user.prisma'),
        file('prisma/models/post.prisma'),
      ]);

      expect(areaByName(result, 'Database schema', 'prisma')).toMatchObject({
        confidence: expect.any(Number),
        evidence: ['prisma/models/user.prisma', 'prisma/prisma.config.ts'],
        inferredTechnologies: {
          primary: 'Prisma',
          related: [],
        },
      });
    });

    it('keeps Prisma database owners isolated in monorepos', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/backend'),
        directory('apps/backend/prisma'),
        file('apps/backend/prisma/schema.prisma'),
        directory('packages'),
        directory('packages/shared'),
        directory('packages/shared/prisma'),
        directory('packages/shared/prisma/models'),
        file('packages/shared/prisma/models/example.prisma'),
      ]);

      expect(
        areaByName(result, 'Database schema', 'apps/backend/prisma'),
      ).toMatchObject({
        evidence: ['apps/backend/prisma/schema.prisma'],
        inferredTechnologies: {
          primary: 'Prisma',
          related: [],
        },
      });
      expect(
        areaByName(result, 'Database schema', 'packages/shared/prisma'),
      ).toBeUndefined();
      expect(areaByName(result, 'Database schema', '.')).toBeUndefined();
    });

    it('counts repeated Prisma signals once per owner', () => {
      const result = analyze([
        directory('prisma'),
        file('prisma/schema.prisma'),
        directory('prisma/migrations'),
        file('prisma/migrations/20240610120000_init/migration.sql'),
        file('prisma/migrations/20240611120000_add_users/migration.sql'),
        file('prisma/migrations/migration_lock.toml'),
      ]);

      expect(areaByName(result, 'Database schema', 'prisma')).toMatchObject({
        confidence: 1,
        evidence: [
          'prisma/migrations',
          'prisma/migrations/20240610120000_init/migration.sql',
          'prisma/migrations/migration_lock.toml',
          'prisma/schema.prisma',
        ],
        inferredTechnologies: {
          primary: 'Prisma',
          related: [],
        },
      });
    });

    it.each([
      {
        name: 'Prisma config alone',
        entries: [file('prisma.config.ts')],
      },
      {
        name: 'schema fragment alone',
        entries: [file('prisma/models/user.prisma')],
      },
      {
        name: 'migrations directory alone',
        entries: [directory('prisma/migrations')],
      },
      {
        name: 'migration lock alone',
        entries: [file('prisma/migrations/migration_lock.toml')],
      },
      {
        name: 'migrations directory with lock but no schema or migration file',
        entries: [
          directory('prisma/migrations'),
          file('prisma/migrations/migration_lock.toml'),
        ],
      },
      {
        name: 'generic SQL migration outside Prisma migrations',
        entries: [file('migrations/20240610120000_init/migration.sql')],
      },
    ])('does not detect Prisma from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(
        result.detectedAreas.some(
          (area) => area.inferredTechnologies.primary === 'Prisma',
        ),
      ).toBe(false);
    });
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

  describe('Drizzle database detector', () => {
    it('detects the documented root config and src/db schema shape', () => {
      const result = analyze([
        file('drizzle.config.ts'),
        directory('src'),
        directory('src/db'),
        file('src/db/schema.ts'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        confidence: 1,
        evidence: ['drizzle.config.ts', 'src/db/schema.ts'],
        inferredTechnologies: {
          primary: 'Drizzle',
          related: [],
        },
      });
      expect(areaByName(result, 'Database schema', 'src/db')).toBeUndefined();
    });

    it('detects colocated config-backed schema folders', () => {
      const result = analyze([
        directory('db'),
        file('db/drizzle.config.ts'),
        file('db/schema.ts'),
        file('src/schema.ts'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        evidence: ['db/drizzle.config.ts', 'db/schema.ts'],
        inferredTechnologies: {
          primary: 'Drizzle',
          related: [],
        },
      });
      expect(areaByName(result, 'Database schema', 'db')).toBeUndefined();
      expect(
        result.detectedAreas.some((area) =>
          area.evidence.includes('src/schema.ts'),
        ),
      ).toBe(false);
    });

    it('detects custom config files backing src/lib/db schema locations', () => {
      const result = analyze([
        file('drizzle-dev.config.ts'),
        directory('src'),
        directory('src/lib'),
        directory('src/lib/db'),
        file('src/lib/db/schema.ts'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        evidence: ['drizzle-dev.config.ts', 'src/lib/db/schema.ts'],
        inferredTechnologies: {
          primary: 'Drizzle',
          related: [],
        },
      });
      expect(areaByName(result, 'Database schema', 'src/lib/db')).toBeUndefined();
    });

    it('detects package-owned db/src schema files with package-local config', () => {
      const result = analyze([
        directory('packages'),
        directory('packages/db'),
        file('packages/db/drizzle.config.ts'),
        directory('packages/db/src'),
        file('packages/db/src/schema.ts'),
      ]);

      expect(
        areaByName(result, 'Database schema', 'packages/db'),
      ).toMatchObject({
        evidence: [
          'packages/db/drizzle.config.ts',
          'packages/db/src/schema.ts',
        ],
        inferredTechnologies: {
          primary: 'Drizzle',
          related: [],
        },
      });
      expect(
        areaByName(result, 'Database schema', 'packages/db/src'),
      ).toBeUndefined();
    });

    it('detects generated default migration sets without config', () => {
      const result = analyze([
        directory('drizzle'),
        file('drizzle/0000_initial.sql'),
        file('drizzle/0001_add_users.sql'),
        directory('drizzle/meta'),
        file('drizzle/meta/_journal.json'),
        file('drizzle/meta/0000_snapshot.json'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'drizzle/0000_initial.sql',
          'drizzle/meta/_journal.json',
          'drizzle/meta/0000_snapshot.json',
        ],
        inferredTechnologies: {
          primary: 'Drizzle',
          related: [],
        },
      });
      expect(areaByName(result, 'Database schema', 'drizzle')).toBeUndefined();
    });

    it('detects config-backed custom migration output folders', () => {
      const result = analyze([
        file('drizzle.config.ts'),
        directory('migrations'),
        file('migrations/0000_initial.sql'),
        directory('migrations/meta'),
        file('migrations/meta/_journal.json'),
        file('migrations/meta/0000_snapshot.json'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        confidence: 1,
        evidence: [
          'drizzle.config.ts',
          'migrations/0000_initial.sql',
          'migrations/meta/_journal.json',
          'migrations/meta/0000_snapshot.json',
        ],
        inferredTechnologies: {
          primary: 'Drizzle',
          related: [],
        },
      });
      expect(areaByName(result, 'Database schema', 'migrations')).toBeUndefined();
    });

    it('keeps Drizzle owners isolated in monorepos', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        file('apps/api/drizzle.config.ts'),
        directory('apps/api/src'),
        directory('apps/api/src/db'),
        file('apps/api/src/db/schema.ts'),
        directory('packages'),
        directory('packages/shared'),
        directory('packages/shared/db'),
        file('packages/shared/db/schema.ts'),
      ]);

      expect(
        areaByName(result, 'Database schema', 'apps/api'),
      ).toMatchObject({
        evidence: [
          'apps/api/drizzle.config.ts',
          'apps/api/src/db/schema.ts',
        ],
        inferredTechnologies: {
          primary: 'Drizzle',
          related: [],
        },
      });
      expect(
        areaByName(result, 'Database schema', 'apps/api/src/db'),
      ).toBeUndefined();
      expect(
        areaByName(result, 'Database schema', 'packages/shared/db'),
      ).toBeUndefined();
      expect(areaByName(result, 'Database schema', '.')).toBeUndefined();
    });

    it('keeps service-owned Drizzle evidence under service owners', () => {
      const result = analyze([
        directory('services'),
        directory('services/api'),
        file('services/api/drizzle.config.ts'),
        directory('services/api/src'),
        directory('services/api/src/db'),
        file('services/api/src/db/schema.ts'),
      ]);

      expect(
        areaByName(result, 'Database schema', 'services/api'),
      ).toMatchObject({
        evidence: [
          'services/api/drizzle.config.ts',
          'services/api/src/db/schema.ts',
        ],
        inferredTechnologies: {
          primary: 'Drizzle',
          related: [],
        },
      });
      expect(areaByName(result, 'Database schema', '.')).toBeUndefined();
    });

    it('keeps library-owned Drizzle evidence under library owners', () => {
      const result = analyze([
        directory('libs'),
        directory('libs/db'),
        file('libs/db/drizzle.config.ts'),
        directory('libs/db/src'),
        file('libs/db/src/schema.ts'),
      ]);

      expect(areaByName(result, 'Database schema', 'libs/db')).toMatchObject({
        evidence: ['libs/db/drizzle.config.ts', 'libs/db/src/schema.ts'],
        inferredTechnologies: {
          primary: 'Drizzle',
          related: [],
        },
      });
      expect(areaByName(result, 'Database schema', '.')).toBeUndefined();
    });

    it.each([
      {
        name: 'standard config alone',
        entries: [file('drizzle.config.ts')],
      },
      {
        name: 'custom config alone',
        entries: [file('drizzle-prod.config.ts')],
      },
      {
        name: 'schema file alone',
        entries: [file('src/db/schema.ts')],
      },
      {
        name: 'ambiguous root schema file with config',
        entries: [file('drizzle.config.ts'), file('src/schema.ts')],
      },
      {
        name: 'migration SQL file alone',
        entries: [file('drizzle/0000_initial.sql')],
      },
      {
        name: 'migration journal alone',
        entries: [file('drizzle/meta/_journal.json')],
      },
      {
        name: 'migration snapshot alone',
        entries: [file('drizzle/meta/0000_snapshot.json')],
      },
      {
        name: 'migration metadata without SQL or config',
        entries: [
          file('drizzle/meta/_journal.json'),
          file('drizzle/meta/0000_snapshot.json'),
        ],
      },
      {
        name: 'generic SQL outside migration output folders',
        entries: [file('sql/0000_initial.sql')],
      },
    ])('does not detect Drizzle from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(
        result.detectedAreas.some(
          (area) => area.inferredTechnologies.primary === 'Drizzle',
        ),
      ).toBe(false);
    });
  });

  describe('SQLAlchemy database detector', () => {
    it('detects a root Alembic migration environment with SQLAlchemy models', () => {
      const result = analyze([
        file('alembic.ini'),
        directory('alembic'),
        file('alembic/env.py'),
        file('alembic/script.py.mako'),
        directory('alembic/versions'),
        file('alembic/versions/ae1027a6acf_init.py'),
        file('models.py'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        evidence: expect.arrayContaining([
          'alembic.ini',
          'alembic/env.py',
          'alembic/versions/ae1027a6acf_init.py',
          'alembic/script.py.mako',
          'models.py',
        ]),
        inferredTechnologies: {
          primary: 'SQLAlchemy',
          related: ['Alembic', 'Python'],
        },
      });
    });

    it('detects FastAPI-style app-local SQLAlchemy and Alembic ownership', () => {
      const result = analyze([
        file('backend/alembic.ini'),
        directory('backend'),
        directory('backend/app'),
        file('backend/app/models.py'),
        directory('backend/app/alembic'),
        file('backend/app/alembic/env.py'),
        directory('backend/app/alembic/versions'),
        file('backend/app/alembic/versions/e2412789c190_initialize_models.py'),
      ]);

      expect(areaByName(result, 'Database schema', 'backend/app')).toMatchObject({
        evidence: [
          'backend/app/alembic/env.py',
          'backend/app/alembic/versions/e2412789c190_initialize_models.py',
          'backend/app/models.py',
        ],
        inferredTechnologies: {
          primary: 'SQLAlchemy',
          related: ['Alembic', 'Python'],
        },
      });
      expect(areaByName(result, 'Database schema', 'backend')).toBeUndefined();
    });

    it('detects Superset-style models and migrations under one package owner', () => {
      const result = analyze([
        directory('superset'),
        directory('superset/models'),
        file('superset/models/core.py'),
        directory('superset/migrations'),
        file('superset/migrations/env.py'),
        file('superset/migrations/script.py.mako'),
        directory('superset/migrations/versions'),
        file('superset/migrations/versions/2015-09-21_17-30_4e6a06bad7a8_init.py'),
      ]);

      expect(areaByName(result, 'Database schema', 'superset')).toMatchObject({
        evidence: expect.arrayContaining([
          'superset/migrations/env.py',
          'superset/migrations/versions/2015-09-21_17-30_4e6a06bad7a8_init.py',
          'superset/migrations/script.py.mako',
          'superset/models/core.py',
        ]),
        inferredTechnologies: {
          primary: 'SQLAlchemy',
          related: ['Alembic', 'Python'],
        },
      });
      expect(
        areaByName(result, 'Database schema', 'superset/migrations'),
      ).toBeUndefined();
    });

    it('detects Prefect-style database modules with nested version folders', () => {
      const result = analyze([
        directory('src'),
        directory('src/prefect'),
        directory('src/prefect/server'),
        directory('src/prefect/server/database'),
        file('src/prefect/server/database/alembic.ini'),
        file('src/prefect/server/database/orm_models.py'),
        directory('src/prefect/server/database/_migrations'),
        file('src/prefect/server/database/_migrations/env.py'),
        directory('src/prefect/server/database/_migrations/versions'),
        directory('src/prefect/server/database/_migrations/versions/postgresql'),
        file(
          'src/prefect/server/database/_migrations/versions/postgresql/2021_01_20_122127_25f4b90a7a42_initial_migration.py',
        ),
      ]);

      expect(
        areaByName(result, 'Database schema', 'src/prefect/server/database'),
      ).toMatchObject({
        evidence: expect.arrayContaining([
          'src/prefect/server/database/alembic.ini',
          'src/prefect/server/database/_migrations/env.py',
          'src/prefect/server/database/_migrations/versions/postgresql/2021_01_20_122127_25f4b90a7a42_initial_migration.py',
          'src/prefect/server/database/orm_models.py',
        ]),
        inferredTechnologies: {
          primary: 'SQLAlchemy',
          related: ['Alembic', 'Python'],
        },
      });
    });

    it('keeps SQLAlchemy owners isolated in monorepos', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        directory('apps/api/app'),
        file('apps/api/app/models.py'),
        directory('apps/api/app/alembic'),
        file('apps/api/app/alembic/env.py'),
        directory('apps/api/app/alembic/versions'),
        file('apps/api/app/alembic/versions/ae1027a6acf_init.py'),
        directory('packages'),
        directory('packages/shared'),
        file('packages/shared/models.py'),
      ]);

      expect(areaByName(result, 'Database schema', 'apps/api')).toMatchObject({
        evidence: [
          'apps/api/app/alembic/env.py',
          'apps/api/app/alembic/versions/ae1027a6acf_init.py',
          'apps/api/app/models.py',
        ],
        inferredTechnologies: {
          primary: 'SQLAlchemy',
          related: ['Alembic', 'Python'],
        },
      });
      expect(
        areaByName(result, 'Database schema', 'packages/shared'),
      ).toBeUndefined();
      expect(areaByName(result, 'Database schema', '.')).toBeUndefined();
    });

    it('counts repeated SQLAlchemy migration version files once per owner', () => {
      const result = analyze([
        file('models.py'),
        directory('alembic'),
        file('alembic/env.py'),
        directory('alembic/versions'),
        file('alembic/versions/ae1027a6acf_init.py'),
        file('alembic/versions/1975ea83b712_add_account_table.py'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        confidence: expect.any(Number),
        evidence: [
          'alembic/env.py',
          'alembic/versions/ae1027a6acf_init.py',
          'models.py',
        ],
        inferredTechnologies: {
          primary: 'SQLAlchemy',
          related: ['Alembic', 'Python'],
        },
      });
    });

    it.each([
      {
        name: 'models file alone',
        entries: [file('models.py')],
      },
      {
        name: 'database session file alone',
        entries: [file('database.py')],
      },
      {
        name: 'Alembic config alone',
        entries: [file('alembic.ini')],
      },
      {
        name: 'Alembic env file alone',
        entries: [file('alembic/env.py')],
      },
      {
        name: 'version file outside Alembic migration paths',
        entries: [file('versions/ae1027a6acf_init.py')],
      },
      {
        name: 'generic SQL migrations',
        entries: [file('migrations/20240610120000_init.sql')],
      },
      {
        name: 'frontend TypeScript models folder',
        entries: [
          file('vite.config.ts'),
          directory('src'),
          directory('src/models'),
          file('src/models/user.ts'),
        ],
      },
    ])('does not detect SQLAlchemy from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(
        result.detectedAreas.some(
          (area) => area.inferredTechnologies.primary === 'SQLAlchemy',
        ),
      ).toBe(false);
    });
  });

  describe('TypeORM database detector', () => {
    it('detects legacy TypeORM config backed by entity files', () => {
      const result = analyze([
        file('ormconfig.json'),
        directory('src'),
        directory('src/users'),
        file('src/users/user.entity.ts'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        evidence: ['ormconfig.json', 'src/users/user.entity.ts'],
        inferredTechnologies: {
          primary: 'TypeORM',
          related: [],
        },
      });
    });

    it('detects data-source files backed by generated migrations', () => {
      const result = analyze([
        directory('src'),
        file('src/data-source.ts'),
        directory('src/migrations'),
        file('src/migrations/1700000000000-Init.ts'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        evidence: ['src/data-source.ts', 'src/migrations/1700000000000-Init.ts'],
        inferredTechnologies: {
          primary: 'TypeORM',
          related: [],
        },
      });
    });

    it('detects TypeORM entity and migration files without config', () => {
      const result = analyze([
        directory('src'),
        directory('src/entities'),
        file('src/entities/user.entity.ts'),
        directory('src/migrations'),
        file('src/migrations/Migration20240610120000.ts'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        evidence: [
          'src/entities/user.entity.ts',
          'src/migrations/Migration20240610120000.ts',
        ],
        inferredTechnologies: {
          primary: 'TypeORM',
          related: [],
        },
      });
    });

    it('detects example config only when backed by entity files', () => {
      const result = analyze([
        file('ormconfig.json.example'),
        directory('src'),
        directory('src/user'),
        file('src/user/user.entity.ts'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        evidence: ['ormconfig.json.example', 'src/user/user.entity.ts'],
        inferredTechnologies: {
          primary: 'TypeORM',
          related: [],
        },
      });
    });

    it('keeps TypeORM owners isolated in monorepos', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        directory('apps/api/src'),
        file('apps/api/src/data-source.ts'),
        directory('apps/api/src/entities'),
        file('apps/api/src/entities/user.entity.ts'),
        directory('packages'),
        directory('packages/shared'),
        directory('packages/shared/src'),
        directory('packages/shared/src/entities'),
        file('packages/shared/src/entities/user.entity.ts'),
      ]);

      expect(areaByName(result, 'Database schema', 'apps/api')).toMatchObject({
        evidence: [
          'apps/api/src/data-source.ts',
          'apps/api/src/entities/user.entity.ts',
        ],
        inferredTechnologies: {
          primary: 'TypeORM',
          related: [],
        },
      });
      expect(
        areaByName(result, 'Database schema', 'packages/shared'),
      ).toBeUndefined();
      expect(areaByName(result, 'Database schema', '.')).toBeUndefined();
    });

    it('detects package-level TypeORM entities and migrations', () => {
      const result = analyze([
        directory('packages'),
        directory('packages/db'),
        directory('packages/db/src'),
        directory('packages/db/src/entities'),
        file('packages/db/src/entities/user.ts'),
        directory('packages/db/src/migrations'),
        directory('packages/db/src/migrations/common'),
        file('packages/db/src/migrations/common/1620821879465-Init.ts'),
      ]);

      expect(areaByName(result, 'Database schema', 'packages/db')).toMatchObject(
        {
          evidence: [
            'packages/db/src/entities/user.ts',
            'packages/db/src/migrations/common/1620821879465-Init.ts',
          ],
          inferredTechnologies: {
            primary: 'TypeORM',
            related: [],
          },
        },
      );
      expect(
        areaByName(result, 'Database schema', 'packages/db/src'),
      ).toBeUndefined();
    });

    it('detects database-folder TypeORM ownership below non-monorepo roots', () => {
      const result = analyze([
        directory('backend'),
        directory('backend/app'),
        directory('backend/app/db'),
        file('backend/app/db/data-source.ts'),
        directory('backend/app/db/entities'),
        file('backend/app/db/entities/user.entity.ts'),
      ]);

      expect(
        areaByName(result, 'Database schema', 'backend/app/db'),
      ).toMatchObject({
        evidence: [
          'backend/app/db/data-source.ts',
          'backend/app/db/entities/user.entity.ts',
        ],
        inferredTechnologies: {
          primary: 'TypeORM',
          related: [],
        },
      });
      expect(areaByName(result, 'Database schema', 'backend')).toBeUndefined();
    });

    it('counts repeated TypeORM entity and migration signals once per owner', () => {
      const result = analyze([
        file('src/data-source.ts'),
        file('src/entities/user.entity.ts'),
        file('src/entities/post.entity.ts'),
        file('src/migrations/1700000000000-Init.ts'),
        file('src/migrations/1700000000001-AddPost.ts'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        confidence: expect.any(Number),
        evidence: [
          'src/data-source.ts',
          'src/entities/user.entity.ts',
          'src/migrations/1700000000000-Init.ts',
        ],
        inferredTechnologies: {
          primary: 'TypeORM',
          related: [],
        },
      });
    });

    it.each([
      {
        name: 'entity file alone',
        entries: [file('src/users/user.entity.ts')],
      },
      {
        name: 'migration file alone',
        entries: [file('src/migrations/1700000000000-Init.ts')],
      },
      {
        name: 'data source file alone',
        entries: [file('src/data-source.ts')],
      },
      {
        name: 'legacy config alone',
        entries: [file('ormconfig.json')],
      },
      {
        name: 'example config alone',
        entries: [file('ormconfig.json.example')],
      },
      {
        name: 'generic entity folder without config or migration',
        entries: [file('src/entities/user.ts')],
      },
      {
        name: 'generic migration outside migration folders',
        entries: [file('src/db/1700000000000-Init.ts')],
      },
      {
        name: 'generic schema file with data source',
        entries: [file('src/data-source.ts'), file('src/schemas/user.schema.ts')],
      },
    ])('does not detect TypeORM from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(
        result.detectedAreas.some(
          (area) => area.inferredTechnologies.primary === 'TypeORM',
        ),
      ).toBe(false);
    });
  });

  describe('Sequelize database detector', () => {
    it('detects default Sequelize CLI root shape', () => {
      const result = analyze([
        file('.sequelizerc'),
        directory('config'),
        file('config/config.json'),
        directory('models'),
        file('models/index.js'),
        file('models/user.js'),
        directory('migrations'),
        file('migrations/20211214181007-create-user.js'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        evidence: [
          '.sequelizerc',
          'config/config.json',
          'migrations/20211214181007-create-user.js',
          'models/index.js',
          'models/user.js',
        ],
        inferredTechnologies: {
          primary: 'Sequelize',
          related: [],
        },
      });
    });

    it('detects custom Sequelize CLI paths under a dedicated sequelize folder', () => {
      const result = analyze([
        file('.sequelizerc'),
        directory('sequelize'),
        file('sequelize/config.js'),
        directory('sequelize/migrations'),
        file('sequelize/migrations/01-create-demo-user.js'),
        directory('sequelize/seeders'),
        file('sequelize/seeders/01-demo-role.js'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toBeUndefined();
      expect(
        areaByName(result, 'Database schema', 'sequelize'),
      ).toMatchObject({
        evidence: [
          'sequelize/config.js',
          'sequelize/migrations/01-create-demo-user.js',
          'sequelize/seeders/01-demo-role.js',
        ],
        inferredTechnologies: {
          primary: 'Sequelize',
          related: [],
        },
      });
    });

    it('detects Sequelize infrastructure folders below source trees', () => {
      const result = analyze([
        directory('src'),
        directory('src/infra'),
        directory('src/infra/sequelize'),
        directory('src/infra/sequelize/config'),
        file('src/infra/sequelize/config/config.js'),
        directory('src/infra/sequelize/models'),
        file('src/infra/sequelize/models/index.ts'),
        file('src/infra/sequelize/models/album.js'),
        directory('src/infra/sequelize/migrations'),
        file('src/infra/sequelize/migrations/20190625131808-initial-migration.ts'),
      ]);

      expect(
        areaByName(result, 'Database schema', 'src/infra/sequelize'),
      ).toMatchObject({
        evidence: [
          'src/infra/sequelize/config/config.js',
          'src/infra/sequelize/migrations/20190625131808-initial-migration.ts',
          'src/infra/sequelize/models/album.js',
          'src/infra/sequelize/models/index.ts',
        ],
        inferredTechnologies: {
          primary: 'Sequelize',
          related: [],
        },
      });
    });

    it('does not over-broaden split DDD database and sequelize folders', () => {
      const result = analyze([
        directory('src'),
        directory('src/infra'),
        directory('src/infra/database'),
        directory('src/infra/database/models'),
        file('src/infra/database/models/user.js'),
        directory('src/infra/sequelize'),
        directory('src/infra/sequelize/migrations'),
        file('src/infra/sequelize/migrations/001-users.js'),
      ]);

      expect(
        areaByName(result, 'Database schema', 'src/infra/database'),
      ).toBeUndefined();
      expect(
        areaByName(result, 'Database schema', 'src/infra/sequelize'),
      ).toBeUndefined();
      expect(areaByName(result, 'Database schema', '.')).toBeUndefined();
    });

    it('keeps Sequelize owners isolated in monorepos', () => {
      const result = analyze([
        directory('apps'),
        directory('apps/api'),
        file('apps/api/.sequelizerc'),
        directory('apps/api/models'),
        file('apps/api/models/user.js'),
        directory('packages'),
        directory('packages/shared'),
        directory('packages/shared/models'),
        file('packages/shared/models/user.js'),
      ]);

      expect(areaByName(result, 'Database schema', 'apps/api')).toMatchObject({
        evidence: ['apps/api/.sequelizerc', 'apps/api/models/user.js'],
        inferredTechnologies: {
          primary: 'Sequelize',
          related: [],
        },
      });
      expect(
        areaByName(result, 'Database schema', 'packages/shared'),
      ).toBeUndefined();
      expect(areaByName(result, 'Database schema', '.')).toBeUndefined();
    });

    it('counts repeated Sequelize signals once per owner', () => {
      const result = analyze([
        file('.sequelizerc'),
        file('models/index.js'),
        file('models/user.js'),
        file('models/post.js'),
        file('migrations/20211214181007-create-user.js'),
        file('migrations/20211214181008-create-post.js'),
      ]);

      expect(areaByName(result, 'Database schema', '.')).toMatchObject({
        confidence: expect.any(Number),
        evidence: [
          '.sequelizerc',
          'migrations/20211214181007-create-user.js',
          'models/index.js',
          'models/user.js',
        ],
        inferredTechnologies: {
          primary: 'Sequelize',
          related: [],
        },
      });
    });

    it.each([
      {
        name: 'CLI config alone',
        entries: [file('.sequelizerc')],
      },
      {
        name: 'config alone',
        entries: [file('config/config.json')],
      },
      {
        name: 'model alone',
        entries: [file('models/user.js')],
      },
      {
        name: 'migration alone',
        entries: [file('migrations/20211214181007-create-user.js')],
      },
      {
        name: 'seeder alone',
        entries: [file('seeders/20211214190000-demo-user.js')],
      },
      {
        name: 'generic model and seeder without migration or config',
        entries: [
          file('models/user.js'),
          file('seeders/20211214190000-demo-user.js'),
        ],
      },
      {
        name: 'generic migration outside recognized shape',
        entries: [file('db/20211214181007-create-user.js')],
      },
    ])('does not detect Sequelize from $name', ({ entries }) => {
      const result = analyze(entries);

      expect(
        result.detectedAreas.some(
          (area) => area.inferredTechnologies.primary === 'Sequelize',
        ),
      ).toBe(false);
    });
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
