import { describe, expect, it } from 'vitest';
import { buildMaturitySignals } from './project-structure-maturity-signals';

describe('buildMaturitySignals', () => {
  describe('testing', () => {
    describe('present and evidence', () => {
      it('is absent when there is no Test suite area', () => {
        const result = buildMaturitySignals({
          entries: [],
          detectedAreas: [],
        });

        expect(result.testing).toEqual({
          present: false,
          evidence: [],
          repoTotals: { testFileCount: 0, sourceFileCount: 0, ratio: null },
          byArea: [],
        });
      });

      it('is present with one evidence entry for one Test suite area', () => {
        const result = buildMaturitySignals({
          entries: [],
          detectedAreas: [
            {
              name: 'Test suite',
              path: 'apps/frontend',
              confidence: 0.8,
              evidence: ['apps/frontend/vitest.config.ts'],
              inferredTechnologies: { primary: 'Vitest', related: [] },
            },
          ],
        });

        expect(result.testing).toEqual({
          present: true,
          evidence: ['Vitest @ apps/frontend'],
          repoTotals: { testFileCount: 0, sourceFileCount: 0, ratio: null },
          byArea: [],
        });
      });

      it('lists every Test suite area as evidence, sorted', () => {
        const result = buildMaturitySignals({
          entries: [],
          detectedAreas: [
            {
              name: 'Test suite',
              path: 'apps/frontend',
              confidence: 0.8,
              evidence: ['apps/frontend/vitest.config.ts'],
              inferredTechnologies: { primary: 'Vitest', related: [] },
            },
            {
              name: 'Test suite',
              path: 'apps/frontend',
              confidence: 0.8,
              evidence: ['apps/frontend/playwright.config.ts'],
              inferredTechnologies: { primary: 'Playwright', related: [] },
            },
          ],
        });

        expect(result.testing).toEqual({
          present: true,
          evidence: ['Playwright @ apps/frontend', 'Vitest @ apps/frontend'],
          repoTotals: { testFileCount: 0, sourceFileCount: 0, ratio: null },
          byArea: [],
        });
      });

      it('ignores areas that are not Test suite areas', () => {
        const result = buildMaturitySignals({
          entries: [],
          detectedAreas: [
            {
              name: 'Frontend app',
              path: 'apps/frontend',
              confidence: 0.8,
              evidence: ['apps/frontend/next.config.ts'],
              inferredTechnologies: { primary: 'Next.js', related: [] },
            },
          ],
        });

        expect(result.testing).toEqual({
          present: false,
          evidence: [],
          repoTotals: { testFileCount: 0, sourceFileCount: 0, ratio: null },
          byArea: [
            {
              areaName: 'Next.js',
              path: 'apps/frontend',
              testFileCount: 0,
              sourceFileCount: 0,
              ratio: null,
            },
          ],
        });
      });

      it('does not become present from test files alone', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/a.test.ts', name: 'a.test.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing).toEqual({
          present: false,
          evidence: [],
          repoTotals: { testFileCount: 1, sourceFileCount: 0, ratio: null },
          byArea: [],
        });
      });
    });

    describe('repoTotals', () => {
      it('is zero with a null ratio for an empty repository', () => {
        const result = buildMaturitySignals({
          entries: [],
          detectedAreas: [],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 0,
          sourceFileCount: 0,
          ratio: null,
        });
      });

      it('counts a .test. file as a test file', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/a.test.ts', name: 'a.test.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 1,
          sourceFileCount: 0,
          ratio: null,
        });
      });

      it('counts a .spec. file as a test file', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/a.spec.ts', name: 'a.spec.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 1,
          sourceFileCount: 0,
          ratio: null,
        });
      });

      it('counts a file inside __tests__ as a test file', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/__tests__/a.ts', name: 'a.ts', type: 'file', depth: 2, parentPath: 'src/__tests__', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 1,
          sourceFileCount: 0,
          ratio: null,
        });
      });

      it('counts a plain source file as source with a ratio of 0', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/a.ts', name: 'a.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 0,
          sourceFileCount: 1,
          ratio: 0,
        });
      });

      it('ignores files that are not source code', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'README.md', name: 'README.md', type: 'file', depth: 0, parentPath: null, extension: 'md', sizeBytes: 100 },
            { path: 'package.json', name: 'package.json', type: 'file', depth: 0, parentPath: null, extension: 'json', sizeBytes: 100 },
            { path: 'logo.png', name: 'logo.png', type: 'file', depth: 0, parentPath: null, extension: 'png', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 0,
          sourceFileCount: 0,
          ratio: null,
        });
      });

      it('divides test files by source files and rounds to 2 decimals', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/a.ts', name: 'a.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
            { path: 'src/b.ts', name: 'b.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
            { path: 'src/c.ts', name: 'c.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
            { path: 'src/a.test.ts', name: 'a.test.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 1,
          sourceFileCount: 3,
          ratio: 0.33,
        });
      });

    });

    describe('byArea', () => {
      it('is empty when there are no application areas', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/a.ts', name: 'a.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing.byArea).toEqual([]);
      });

      it('counts the files under one application area', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'apps/frontend/lib/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'apps/frontend/lib', extension: 'ts', sizeBytes: 100 },
            { path: 'apps/frontend/lib/b.ts', name: 'b.ts', type: 'file', depth: 3, parentPath: 'apps/frontend/lib', extension: 'ts', sizeBytes: 100 },
            { path: 'apps/frontend/lib/a.test.ts', name: 'a.test.ts', type: 'file', depth: 3, parentPath: 'apps/frontend/lib', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [
            {
              name: 'Frontend app',
              path: 'apps/frontend',
              confidence: 0.8,
              evidence: ['apps/frontend/next.config.ts'],
              inferredTechnologies: { primary: 'Next.js', related: [] },
            },
          ],
        });

        expect(result.testing.byArea).toEqual([
          {
            areaName: 'Next.js',
            path: 'apps/frontend',
            testFileCount: 1,
            sourceFileCount: 2,
            ratio: 0.5,
          },
        ]);
      });

      it('keeps each area to its own files, in detectedAreas order', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'apps/frontend/lib/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'apps/frontend/lib', extension: 'ts', sizeBytes: 100 },
            { path: 'apps/frontend/lib/a.test.ts', name: 'a.test.ts', type: 'file', depth: 3, parentPath: 'apps/frontend/lib', extension: 'ts', sizeBytes: 100 },
            { path: 'apps/backend/src/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'apps/backend/src', extension: 'ts', sizeBytes: 100 },
            { path: 'apps/backend/src/b.ts', name: 'b.ts', type: 'file', depth: 3, parentPath: 'apps/backend/src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [
            {
              name: 'Frontend app',
              path: 'apps/frontend',
              confidence: 0.8,
              evidence: ['apps/frontend/next.config.ts'],
              inferredTechnologies: { primary: 'Next.js', related: [] },
            },
            {
              name: 'Backend API',
              path: 'apps/backend',
              confidence: 0.8,
              evidence: ['apps/backend/src/index.ts'],
              inferredTechnologies: { primary: 'Express.js', related: [] },
            },
          ],
        });

        expect(result.testing.byArea).toEqual([
          {
            areaName: 'Next.js',
            path: 'apps/frontend',
            testFileCount: 1,
            sourceFileCount: 1,
            ratio: 1,
          },
          {
            areaName: 'Express.js',
            path: 'apps/backend',
            testFileCount: 0,
            sourceFileCount: 2,
            ratio: 0,
          },
        ]);
      });

      it('lists an area with no files with a null ratio', () => {
        const result = buildMaturitySignals({
          entries: [],
          detectedAreas: [
            {
              name: 'Backend API',
              path: 'apps/backend',
              confidence: 0.8,
              evidence: ['apps/backend/src/index.ts'],
              inferredTechnologies: { primary: 'Express.js', related: [] },
            },
          ],
        });

        expect(result.testing.byArea).toEqual([
          {
            areaName: 'Express.js',
            path: 'apps/backend',
            testFileCount: 0,
            sourceFileCount: 0,
            ratio: null,
          },
        ]);
      });

      it('counts a file outside every area only in repoTotals', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'apps/frontend/lib/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'apps/frontend/lib', extension: 'ts', sizeBytes: 100 },
            { path: 'e2e/login.spec.ts', name: 'login.spec.ts', type: 'file', depth: 1, parentPath: 'e2e', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [
            {
              name: 'Frontend app',
              path: 'apps/frontend',
              confidence: 0.8,
              evidence: ['apps/frontend/next.config.ts'],
              inferredTechnologies: { primary: 'Next.js', related: [] },
            },
          ],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 1,
          sourceFileCount: 1,
          ratio: 1,
        });
        expect(result.testing.byArea).toEqual([
          {
            areaName: 'Next.js',
            path: 'apps/frontend',
            testFileCount: 0,
            sourceFileCount: 1,
            ratio: 0,
          },
        ]);
      });

      it('does not list Test suite areas', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'apps/frontend/lib/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'apps/frontend/lib', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [
            {
              name: 'Test suite',
              path: 'apps/frontend',
              confidence: 0.8,
              evidence: ['apps/frontend/vitest.config.ts'],
              inferredTechnologies: { primary: 'Vitest', related: [] },
            },
          ],
        });

        expect(result.testing.byArea).toEqual([]);
      });

      it('collapses to one row when a root code area exists', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/app.ts', name: 'app.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
            { path: 'src/app.test.ts', name: 'app.test.ts', type: 'file', depth: 1, parentPath: 'src', extension: 'ts', sizeBytes: 100 },
            { path: 'apps/api/src/server.ts', name: 'server.ts', type: 'file', depth: 3, parentPath: 'apps/api/src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [
            {
              name: 'Frontend app',
              path: '.',
              confidence: 0.8,
              evidence: ['next.config.ts'],
              inferredTechnologies: { primary: 'Next.js', related: [] },
            },
            {
              name: 'Backend API',
              path: 'apps/api',
              confidence: 0.8,
              evidence: ['apps/api/src/server.ts'],
              inferredTechnologies: { primary: 'Express.js', related: [] },
            },
          ],
        });

        expect(result.testing.byArea).toEqual([
          {
            areaName: 'Next.js',
            path: '.',
            testFileCount: 1,
            sourceFileCount: 2,
            ratio: 0.5,
          },
        ]);
      });

      it('does not let a root Database schema area collapse the application areas', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'apps/web/src/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'apps/web/src', extension: 'ts', sizeBytes: 100 },
            { path: 'apps/api/src/b.ts', name: 'b.ts', type: 'file', depth: 3, parentPath: 'apps/api/src', extension: 'ts', sizeBytes: 100 },
            { path: 'apps/api/src/b.test.ts', name: 'b.test.ts', type: 'file', depth: 3, parentPath: 'apps/api/src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [
            {
              name: 'Database schema',
              path: '.',
              confidence: 0.8,
              evidence: ['prisma/schema.prisma'],
              inferredTechnologies: { primary: 'Prisma', related: [] },
            },
            {
              name: 'Frontend app',
              path: 'apps/web',
              confidence: 0.8,
              evidence: ['apps/web/next.config.ts'],
              inferredTechnologies: { primary: 'Next.js', related: [] },
            },
            {
              name: 'Backend API',
              path: 'apps/api',
              confidence: 0.8,
              evidence: ['apps/api/src/b.ts'],
              inferredTechnologies: { primary: 'Express.js', related: [] },
            },
          ],
        });

        expect(result.testing.byArea).toEqual([
          {
            areaName: 'Next.js',
            path: 'apps/web',
            testFileCount: 0,
            sourceFileCount: 1,
            ratio: 0,
          },
          {
            areaName: 'Express.js',
            path: 'apps/api',
            testFileCount: 1,
            sourceFileCount: 1,
            ratio: 1,
          },
        ]);
      });

      it('keeps only the first area when two areas share a path', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'apps/api/src/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'apps/api/src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [
            {
              name: 'Backend API',
              path: 'apps/api',
              confidence: 0.8,
              evidence: ['apps/api/src/a.ts'],
              inferredTechnologies: { primary: 'Express.js', related: [] },
            },
            {
              name: 'Frontend app',
              path: 'apps/api',
              confidence: 0.8,
              evidence: ['apps/api/next.config.ts'],
              inferredTechnologies: { primary: 'Next.js', related: [] },
            },
          ],
        });

        expect(result.testing.byArea).toEqual([
          {
            areaName: 'Express.js',
            path: 'apps/api',
            testFileCount: 0,
            sourceFileCount: 1,
            ratio: 0,
          },
        ]);
      });

      it('lists only the application areas and skips tooling and schema areas', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'apps/web/src/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'apps/web/src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [
            {
              name: 'Test suite',
              path: 'tests',
              confidence: 0.8,
              evidence: ['tests/vitest.config.ts'],
              inferredTechnologies: { primary: 'Vitest', related: [] },
            },
            {
              name: 'Documentation',
              path: 'docs',
              confidence: 0.8,
              evidence: ['docs/docusaurus.config.js'],
              inferredTechnologies: { primary: 'Docusaurus', related: [] },
            },
            {
              name: 'CI/CD workflows',
              path: '.github',
              confidence: 0.8,
              evidence: ['.github/workflows/ci.yml'],
              inferredTechnologies: { primary: 'GitHub Actions', related: [] },
            },
            {
              name: 'Containerization',
              path: 'docker',
              confidence: 0.8,
              evidence: ['docker/Dockerfile'],
              inferredTechnologies: { primary: 'Docker', related: [] },
            },
            {
              name: 'Infrastructure as code',
              path: 'infra',
              confidence: 0.8,
              evidence: ['infra/main.tf'],
              inferredTechnologies: { primary: 'Terraform', related: [] },
            },
            {
              name: 'Database schema',
              path: 'db',
              confidence: 0.8,
              evidence: ['db/schema.prisma'],
              inferredTechnologies: { primary: 'Prisma', related: [] },
            },
            {
              name: 'Frontend app',
              path: 'apps/web',
              confidence: 0.8,
              evidence: ['apps/web/next.config.ts'],
              inferredTechnologies: { primary: 'Next.js', related: [] },
            },
          ],
        });

        expect(result.testing.byArea).toEqual([
          {
            areaName: 'Next.js',
            path: 'apps/web',
            testFileCount: 0,
            sourceFileCount: 1,
            ratio: 0,
          },
        ]);
      });

      it('does not let an area claim a sibling folder that shares its prefix', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'apps/web/src/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'apps/web/src', extension: 'ts', sizeBytes: 100 },
            { path: 'apps/web-admin/src/b.ts', name: 'b.ts', type: 'file', depth: 3, parentPath: 'apps/web-admin/src', extension: 'ts', sizeBytes: 100 },
            { path: 'apps/web-admin/src/b.test.ts', name: 'b.test.ts', type: 'file', depth: 3, parentPath: 'apps/web-admin/src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [
            {
              name: 'Frontend app',
              path: 'apps/web',
              confidence: 0.8,
              evidence: ['apps/web/next.config.ts'],
              inferredTechnologies: { primary: 'Next.js', related: [] },
            },
          ],
        });

        expect(result.testing.byArea).toEqual([
          {
            areaName: 'Next.js',
            path: 'apps/web',
            testFileCount: 0,
            sourceFileCount: 1,
            ratio: 0,
          },
        ]);
      });

      it('matches area paths case-insensitively and keeps the area casing in the output', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'Apps/Web/src/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'Apps/Web/src', extension: 'ts', sizeBytes: 100 },
            { path: 'Apps/Web/src/a.test.ts', name: 'a.test.ts', type: 'file', depth: 3, parentPath: 'Apps/Web/src', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [
            {
              name: 'Frontend app',
              path: 'Apps/Web',
              confidence: 0.8,
              evidence: ['Apps/Web/next.config.ts'],
              inferredTechnologies: { primary: 'Next.js', related: [] },
            },
          ],
        });

        expect(result.testing.byArea).toEqual([
          {
            areaName: 'Next.js',
            path: 'Apps/Web',
            testFileCount: 1,
            sourceFileCount: 1,
            ratio: 1,
          },
        ]);
      });
    });

    describe('test folders', () => {
      it('counts source files under test, tests and spec folders as test files, not source', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/a.js', name: 'a.js', type: 'file', depth: 1, parentPath: 'src', extension: 'js', sizeBytes: 100 },
            { path: 'test/helper.js', name: 'helper.js', type: 'file', depth: 1, parentPath: 'test', extension: 'js', sizeBytes: 100 },
            { path: 'tests/conftest.py', name: 'conftest.py', type: 'file', depth: 1, parentPath: 'tests', extension: 'py', sizeBytes: 100 },
            { path: 'spec/spec_helper.rb', name: 'spec_helper.rb', type: 'file', depth: 1, parentPath: 'spec', extension: 'rb', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 3,
          sourceFileCount: 1,
          ratio: 3,
        });
      });

      it('counts Java files under src/test as test files and src/main as source', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/main/java/A.java', name: 'A.java', type: 'file', depth: 3, parentPath: 'src/main/java', extension: 'java', sizeBytes: 100 },
            { path: 'src/test/java/ATest.java', name: 'ATest.java', type: 'file', depth: 3, parentPath: 'src/test/java', extension: 'java', sizeBytes: 100 },
            { path: 'src/test/java/Helper.java', name: 'Helper.java', type: 'file', depth: 3, parentPath: 'src/test/java', extension: 'java', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 2,
          sourceFileCount: 1,
          ratio: 2,
        });
      });

      it('does not treat a folder that only ends in test as a test folder', () => {
        const result = buildMaturitySignals({
          entries: [
            { path: 'src/contest/a.ts', name: 'a.ts', type: 'file', depth: 2, parentPath: 'src/contest', extension: 'ts', sizeBytes: 100 },
            { path: 'src/latest/b.ts', name: 'b.ts', type: 'file', depth: 2, parentPath: 'src/latest', extension: 'ts', sizeBytes: 100 },
          ],
          detectedAreas: [],
        });

        expect(result.testing.repoTotals).toEqual({
          testFileCount: 0,
          sourceFileCount: 2,
          ratio: 0,
        });
      });
    });
  });

  describe('automation', () => {
    it('is absent when there is no CI/CD workflows area', () => {
      const result = buildMaturitySignals({ entries: [], detectedAreas: [] });

      expect(result.automation).toEqual({ present: false, evidence: [] });
    });

    it('is present with one evidence entry for one CI/CD workflows area', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'CI/CD workflows',
            path: '.',
            confidence: 0.8,
            evidence: ['.github/workflows/ci.yml'],
            inferredTechnologies: { primary: 'GitHub Actions', related: [] },
          },
        ],
      });

      expect(result.automation).toEqual({
        present: true,
        evidence: ['GitHub Actions @ .'],
      });
    });

    it('lists every CI/CD workflows area as evidence, sorted', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'CI/CD workflows',
            path: '.',
            confidence: 0.8,
            evidence: ['.gitlab-ci.yml'],
            inferredTechnologies: { primary: 'GitLab CI/CD', related: [] },
          },
          {
            name: 'CI/CD workflows',
            path: '.',
            confidence: 0.8,
            evidence: ['.github/workflows/ci.yml'],
            inferredTechnologies: { primary: 'GitHub Actions', related: [] },
          },
        ],
      });

      expect(result.automation).toEqual({
        present: true,
        evidence: ['GitHub Actions @ .', 'GitLab CI/CD @ .'],
      });
    });

    it('ignores areas that are not CI/CD workflows areas', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'Test suite',
            path: 'apps/frontend',
            confidence: 0.8,
            evidence: ['apps/frontend/vitest.config.ts'],
            inferredTechnologies: { primary: 'Vitest', related: [] },
          },
        ],
      });

      expect(result.automation).toEqual({ present: false, evidence: [] });
    });
  });

  describe('deployability', () => {
    it('is absent when there is no containerization or infrastructure area', () => {
      const result = buildMaturitySignals({ entries: [], detectedAreas: [] });

      expect(result.deployability).toEqual({ present: false, evidence: [] });
    });

    it('is present for a Containerization area', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'Containerization',
            path: 'apps/backend',
            confidence: 0.8,
            evidence: ['apps/backend/Dockerfile'],
            inferredTechnologies: { primary: 'Docker', related: [] },
          },
        ],
      });

      expect(result.deployability).toEqual({
        present: true,
        evidence: ['Docker @ apps/backend'],
      });
    });

    it('is present for an Infrastructure as code area', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'Infrastructure as code',
            path: 'infra',
            confidence: 0.8,
            evidence: ['infra/main.tf'],
            inferredTechnologies: { primary: 'Terraform', related: [] },
          },
        ],
      });

      expect(result.deployability).toEqual({
        present: true,
        evidence: ['Terraform @ infra'],
      });
    });

    it('merges containerization and infrastructure areas into one sorted evidence list', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'Infrastructure as code',
            path: 'infra',
            confidence: 0.8,
            evidence: ['infra/main.tf'],
            inferredTechnologies: { primary: 'Terraform', related: [] },
          },
          {
            name: 'Containerization',
            path: 'apps/backend',
            confidence: 0.8,
            evidence: ['apps/backend/Dockerfile'],
            inferredTechnologies: { primary: 'Docker', related: [] },
          },
        ],
      });

      expect(result.deployability).toEqual({
        present: true,
        evidence: ['Docker @ apps/backend', 'Terraform @ infra'],
      });
    });

    it('ignores areas that are not containerization or infrastructure areas', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'CI/CD workflows',
            path: '.',
            confidence: 0.8,
            evidence: ['.github/workflows/ci.yml'],
            inferredTechnologies: { primary: 'GitHub Actions', related: [] },
          },
        ],
      });

      expect(result.deployability).toEqual({ present: false, evidence: [] });
    });
  });

  describe('documentation', () => {
    it('is absent when there is no Documentation area', () => {
      const result = buildMaturitySignals({ entries: [], detectedAreas: [] });

      expect(result.documentation).toEqual({ present: false, evidence: [] });
    });

    it('is present with one evidence entry for one Documentation area', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'Documentation',
            path: 'docs',
            confidence: 0.8,
            evidence: ['docs/docusaurus.config.js'],
            inferredTechnologies: { primary: 'Docusaurus', related: [] },
          },
        ],
      });

      expect(result.documentation).toEqual({
        present: true,
        evidence: ['Docusaurus @ docs'],
      });
    });

    it('lists every Documentation area as evidence, sorted', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'Documentation',
            path: 'docs',
            confidence: 0.8,
            evidence: ['docs/mkdocs.yml'],
            inferredTechnologies: { primary: 'MkDocs', related: [] },
          },
          {
            name: 'Documentation',
            path: 'website',
            confidence: 0.8,
            evidence: ['website/docusaurus.config.js'],
            inferredTechnologies: { primary: 'Docusaurus', related: [] },
          },
        ],
      });

      expect(result.documentation).toEqual({
        present: true,
        evidence: ['Docusaurus @ website', 'MkDocs @ docs'],
      });
    });

    it('ignores areas that are not Documentation areas', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'Test suite',
            path: 'apps/frontend',
            confidence: 0.8,
            evidence: ['apps/frontend/vitest.config.ts'],
            inferredTechnologies: { primary: 'Vitest', related: [] },
          },
        ],
      });

      expect(result.documentation).toEqual({ present: false, evidence: [] });
    });
  });

  describe('codeStyle', () => {
    it('is absent for an empty repository', () => {
      const result = buildMaturitySignals({ entries: [], detectedAreas: [] });

      expect(result.codeStyle).toEqual({ present: false, evidence: [] });
    });

    it('is absent when only unrelated config or prose files exist', () => {
      const result = buildMaturitySignals({
        entries: [
          { path: 'tsconfig.json', name: 'tsconfig.json', type: 'file', depth: 0, parentPath: null, extension: 'json', sizeBytes: 100 },
          { path: 'vite.config.json', name: 'vite.config.json', type: 'file', depth: 0, parentPath: null, extension: 'json', sizeBytes: 100 },
          { path: 'docs/prettier.md', name: 'prettier.md', type: 'file', depth: 1, parentPath: 'docs', extension: 'md', sizeBytes: 100 },
        ],
        detectedAreas: [],
      });

      expect(result.codeStyle).toEqual({ present: false, evidence: [] });
    });

    it.each([
      '.eslintrc',
      '.eslintrc.json',
      'eslint.config.mjs',
      '.prettierrc',
      '.prettierrc.json',
      'prettier.config.js',
      'biome.json',
      'ruff.toml',
      '.flake8',
      '.rubocop.yml',
      '.golangci.yml',
      'rustfmt.toml',
    ])('detects %s at the repository root', (configFile) => {
      const result = buildMaturitySignals({
        entries: [
          { path: configFile, name: configFile, type: 'file', depth: 0, parentPath: null, extension: null, sizeBytes: 100 },
        ],
        detectedAreas: [],
      });

      expect(result.codeStyle).toEqual({
        present: true,
        evidence: [configFile],
      });
    });

    it('detects a style config at any depth and reports its full path', () => {
      const result = buildMaturitySignals({
        entries: [
          { path: 'apps/web/.prettierrc', name: '.prettierrc', type: 'file', depth: 2, parentPath: 'apps/web', extension: null, sizeBytes: 100 },
        ],
        detectedAreas: [],
      });

      expect(result.codeStyle).toEqual({
        present: true,
        evidence: ['apps/web/.prettierrc'],
      });
    });

    it('lists every style config as evidence, sorted by path', () => {
      const result = buildMaturitySignals({
        entries: [
          { path: '.prettierrc', name: '.prettierrc', type: 'file', depth: 0, parentPath: null, extension: null, sizeBytes: 100 },
          { path: 'apps/api/ruff.toml', name: 'ruff.toml', type: 'file', depth: 2, parentPath: 'apps/api', extension: 'toml', sizeBytes: 100 },
          { path: '.eslintrc.json', name: '.eslintrc.json', type: 'file', depth: 0, parentPath: null, extension: 'json', sizeBytes: 100 },
        ],
        detectedAreas: [],
      });

      expect(result.codeStyle).toEqual({
        present: true,
        evidence: ['.eslintrc.json', '.prettierrc', 'apps/api/ruff.toml'],
      });
    });
  });

  describe('dependencyPinning', () => {
    it('is absent for an empty repository', () => {
      const result = buildMaturitySignals({ entries: [], detectedAreas: [] });

      expect(result.dependencyPinning).toEqual({ present: false, evidence: [] });
    });

    it('is absent when only manifests and lookalike names exist', () => {
      const result = buildMaturitySignals({
        entries: [
          { path: 'package.json', name: 'package.json', type: 'file', depth: 0, parentPath: null, extension: 'json', sizeBytes: 100 },
          { path: 'notes/yarn.lock.md', name: 'yarn.lock.md', type: 'file', depth: 1, parentPath: 'notes', extension: 'md', sizeBytes: 100 },
          { path: 'vendor/yarn.lock', name: 'yarn.lock', type: 'directory', depth: 1, parentPath: 'vendor', extension: 'lock', sizeBytes: null },
        ],
        detectedAreas: [],
      });

      expect(result.dependencyPinning).toEqual({ present: false, evidence: [] });
    });

    it.each([
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'bun.lock',
      'bun.lockb',
      'poetry.lock',
      'Pipfile.lock',
      'uv.lock',
      'Cargo.lock',
      'Gemfile.lock',
      'composer.lock',
    ])('detects %s at the repository root', (lockfile) => {
      const result = buildMaturitySignals({
        entries: [
          { path: lockfile, name: lockfile, type: 'file', depth: 0, parentPath: null, extension: null, sizeBytes: 100 },
        ],
        detectedAreas: [],
      });

      expect(result.dependencyPinning).toEqual({
        present: true,
        evidence: [lockfile],
      });
    });

    it('detects a lockfile at any depth and reports its full path', () => {
      const result = buildMaturitySignals({
        entries: [
          { path: 'apps/web/package-lock.json', name: 'package-lock.json', type: 'file', depth: 2, parentPath: 'apps/web', extension: 'json', sizeBytes: 100 },
        ],
        detectedAreas: [],
      });

      expect(result.dependencyPinning).toEqual({
        present: true,
        evidence: ['apps/web/package-lock.json'],
      });
    });

    it('lists every lockfile as evidence, sorted by path', () => {
      const result = buildMaturitySignals({
        entries: [
          { path: 'services/api/poetry.lock', name: 'poetry.lock', type: 'file', depth: 2, parentPath: 'services/api', extension: 'lock', sizeBytes: 100 },
          { path: 'package-lock.json', name: 'package-lock.json', type: 'file', depth: 0, parentPath: null, extension: 'json', sizeBytes: 100 },
          { path: 'apps/web/yarn.lock', name: 'yarn.lock', type: 'file', depth: 2, parentPath: 'apps/web', extension: 'lock', sizeBytes: 100 },
        ],
        detectedAreas: [],
      });

      expect(result.dependencyPinning).toEqual({
        present: true,
        evidence: [
          'apps/web/yarn.lock',
          'package-lock.json',
          'services/api/poetry.lock',
        ],
      });
    });
  });

  describe('coverage', () => {
    it('is 0 of 6 for an empty repository', () => {
      const result = buildMaturitySignals({ entries: [], detectedAreas: [] });

      expect(result.coverage).toEqual({ met: 0, total: 6 });
    });

    it('counts a partial set of present checks', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'Test suite',
            path: '.',
            confidence: 0.8,
            evidence: ['vitest.config.ts'],
            inferredTechnologies: { primary: 'Vitest', related: [] },
          },
          {
            name: 'CI/CD workflows',
            path: '.',
            confidence: 0.8,
            evidence: ['.github/workflows/ci.yml'],
            inferredTechnologies: { primary: 'GitHub Actions', related: [] },
          },
        ],
      });

      expect(result.coverage).toEqual({ met: 2, total: 6 });
    });

    it('counts deployability once when both containerization and infrastructure exist', () => {
      const result = buildMaturitySignals({
        entries: [],
        detectedAreas: [
          {
            name: 'Containerization',
            path: '.',
            confidence: 0.8,
            evidence: ['Dockerfile'],
            inferredTechnologies: { primary: 'Docker', related: [] },
          },
          {
            name: 'Infrastructure as code',
            path: 'infra',
            confidence: 0.8,
            evidence: ['infra/main.tf'],
            inferredTechnologies: { primary: 'Terraform', related: [] },
          },
        ],
      });

      expect(result.coverage).toEqual({ met: 1, total: 6 });
    });

    it('is 6 of 6 when every check is present', () => {
      const result = buildMaturitySignals({
        entries: [
          { path: 'yarn.lock', name: 'yarn.lock', type: 'file', depth: 0, parentPath: null, extension: 'lock', sizeBytes: 100 },
          { path: '.prettierrc', name: '.prettierrc', type: 'file', depth: 0, parentPath: null, extension: null, sizeBytes: 100 },
        ],
        detectedAreas: [
          {
            name: 'Test suite',
            path: '.',
            confidence: 0.8,
            evidence: ['vitest.config.ts'],
            inferredTechnologies: { primary: 'Vitest', related: [] },
          },
          {
            name: 'CI/CD workflows',
            path: '.',
            confidence: 0.8,
            evidence: ['.github/workflows/ci.yml'],
            inferredTechnologies: { primary: 'GitHub Actions', related: [] },
          },
          {
            name: 'Containerization',
            path: '.',
            confidence: 0.8,
            evidence: ['Dockerfile'],
            inferredTechnologies: { primary: 'Docker', related: [] },
          },
          {
            name: 'Documentation',
            path: 'docs',
            confidence: 0.8,
            evidence: ['docs/docusaurus.config.js'],
            inferredTechnologies: { primary: 'Docusaurus', related: [] },
          },
        ],
      });

      expect(result.coverage).toEqual({ met: 6, total: 6 });
    });
  });

  describe('realistic monorepo', () => {
    it('produces the agreed output shape', () => {
      const result = buildMaturitySignals({
        entries: [
          { path: 'package-lock.json', name: 'package-lock.json', type: 'file', depth: 0, parentPath: null, extension: 'json', sizeBytes: 100 },
          { path: '.prettierrc', name: '.prettierrc', type: 'file', depth: 0, parentPath: null, extension: null, sizeBytes: 100 },
          { path: '.eslintrc.json', name: '.eslintrc.json', type: 'file', depth: 0, parentPath: null, extension: 'json', sizeBytes: 100 },
          { path: '.github/workflows/ci.yml', name: 'ci.yml', type: 'file', depth: 2, parentPath: '.github/workflows', extension: 'yml', sizeBytes: 100 },
          { path: 'apps/backend/Dockerfile', name: 'Dockerfile', type: 'file', depth: 2, parentPath: 'apps/backend', extension: null, sizeBytes: 100 },
          { path: 'apps/frontend/app/page.tsx', name: 'page.tsx', type: 'file', depth: 3, parentPath: 'apps/frontend/app', extension: 'tsx', sizeBytes: 100 },
          { path: 'apps/frontend/app/layout.tsx', name: 'layout.tsx', type: 'file', depth: 3, parentPath: 'apps/frontend/app', extension: 'tsx', sizeBytes: 100 },
          { path: 'apps/frontend/lib/a.ts', name: 'a.ts', type: 'file', depth: 3, parentPath: 'apps/frontend/lib', extension: 'ts', sizeBytes: 100 },
          { path: 'apps/frontend/lib/b.ts', name: 'b.ts', type: 'file', depth: 3, parentPath: 'apps/frontend/lib', extension: 'ts', sizeBytes: 100 },
          { path: 'apps/frontend/lib/a.test.ts', name: 'a.test.ts', type: 'file', depth: 3, parentPath: 'apps/frontend/lib', extension: 'ts', sizeBytes: 100 },
          { path: 'apps/backend/src/index.ts', name: 'index.ts', type: 'file', depth: 3, parentPath: 'apps/backend/src', extension: 'ts', sizeBytes: 100 },
          { path: 'apps/backend/src/routes.ts', name: 'routes.ts', type: 'file', depth: 3, parentPath: 'apps/backend/src', extension: 'ts', sizeBytes: 100 },
          { path: 'apps/backend/src/service.ts', name: 'service.ts', type: 'file', depth: 3, parentPath: 'apps/backend/src', extension: 'ts', sizeBytes: 100 },
          { path: 'apps/backend/src/routes.test.ts', name: 'routes.test.ts', type: 'file', depth: 3, parentPath: 'apps/backend/src', extension: 'ts', sizeBytes: 100 },
          { path: 'apps/backend/src/service.test.ts', name: 'service.test.ts', type: 'file', depth: 3, parentPath: 'apps/backend/src', extension: 'ts', sizeBytes: 100 },
          { path: 'e2e/login.spec.ts', name: 'login.spec.ts', type: 'file', depth: 1, parentPath: 'e2e', extension: 'ts', sizeBytes: 100 },
        ],
        detectedAreas: [
          {
            name: 'Frontend app',
            path: 'apps/frontend',
            confidence: 0.9,
            evidence: ['apps/frontend/app/page.tsx'],
            inferredTechnologies: { primary: 'Next.js', related: [] },
          },
          {
            name: 'Backend API',
            path: 'apps/backend',
            confidence: 0.9,
            evidence: ['apps/backend/src/routes.ts'],
            inferredTechnologies: { primary: 'Express.js', related: [] },
          },
          {
            name: 'Test suite',
            path: 'apps/frontend',
            confidence: 0.8,
            evidence: ['apps/frontend/vitest.config.ts'],
            inferredTechnologies: { primary: 'Vitest', related: [] },
          },
          {
            name: 'Test suite',
            path: 'apps/backend',
            confidence: 0.8,
            evidence: ['apps/backend/vitest.config.ts'],
            inferredTechnologies: { primary: 'Vitest', related: [] },
          },
          {
            name: 'CI/CD workflows',
            path: '.',
            confidence: 0.8,
            evidence: ['.github/workflows/ci.yml'],
            inferredTechnologies: { primary: 'GitHub Actions', related: [] },
          },
          {
            name: 'Containerization',
            path: 'apps/backend',
            confidence: 0.8,
            evidence: ['apps/backend/Dockerfile'],
            inferredTechnologies: { primary: 'Docker', related: [] },
          },
        ],
      });

      expect(result).toEqual({
        testing: {
          present: true,
          evidence: ['Vitest @ apps/backend', 'Vitest @ apps/frontend'],
          repoTotals: { testFileCount: 4, sourceFileCount: 7, ratio: 0.57 },
          byArea: [
            { areaName: 'Next.js', path: 'apps/frontend', testFileCount: 1, sourceFileCount: 4, ratio: 0.25 },
            { areaName: 'Express.js', path: 'apps/backend', testFileCount: 2, sourceFileCount: 3, ratio: 0.67 },
          ],
        },
        automation: { present: true, evidence: ['GitHub Actions @ .'] },
        deployability: { present: true, evidence: ['Docker @ apps/backend'] },
        documentation: { present: false, evidence: [] },
        codeStyle: { present: true, evidence: ['.eslintrc.json', '.prettierrc'] },
        dependencyPinning: { present: true, evidence: ['package-lock.json'] },
        coverage: { met: 5, total: 6 },
      });
    });
  });
});
