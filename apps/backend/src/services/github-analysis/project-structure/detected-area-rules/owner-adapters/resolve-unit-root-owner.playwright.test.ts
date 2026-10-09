import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Playwright evidence paths, against the shared
 * `resolveUnitRootOwner`. `playwright.config.*` is the anchor, so every config
 * is resolved first and the support files resolve against the config
 * directories in `anchorOwners`.
 *
 * Rows are `[evidence path, expected owner]` from real layouts named in the
 * comments. A config owns its own folder exactly; a support file belongs to the
 * longest enclosing config folder, and a root config owns the rest. A support
 * file that no config encloses resolves to a folder with no config, which the
 * detector's gate drops.
 */
describe('resolveUnitRootOwner (Playwright projects)', () => {
  describe('a config owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // siyavushn/tsautomationframework: the repo is the Playwright project.
      ['playwright.config.ts', '.'],
      // toxeydotdev/god-roll: an Nx e2e project, not the app it tests.
      ['apps/web-e2e/playwright.config.ts', 'apps/web-e2e'],
      // econgraph/econ-graph: two sibling projects, each with its own config.
      ['admin-frontend/playwright.config.ts', 'admin-frontend'],
      ['frontend/playwright.config.ts', 'frontend'],
      // andredesousa/angular-playwright-cucumber: the suite is in `e2e/`.
      ['e2e/playwright.config.js', 'e2e'],
      // vitalets/global-cache: a config deeper than the workspace unit keeps
      // its full folder.
      [
        'packages/playwright/test/playwright.config.ts',
        'packages/playwright/test',
      ],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('supports follow the config beside them', () => {
    describe('sibling projects', () => {
      // econgraph/econ-graph.
      const anchorOwners = new Set(['admin-frontend', 'frontend']);
      it.each([
        ['admin-frontend/tests/demo.spec.ts', 'admin-frontend'],
        ['frontend/e2e/login.spec.ts', 'frontend'],
        [
          'frontend/tests/login.spec.ts-snapshots/home-chromium-linux.png',
          'frontend',
        ],
        // The CI workflow sits at the repository root, which no config
        // directory encloses, so it resolves to a folder with no config.
        ['.github/workflows/playwright-tests.yml', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a root config', () => {
      // siyavushn/tsautomationframework: config, init demo and workflow at
      // the root.
      const anchorOwners = new Set(['.']);
      it.each([
        ['tests-examples/demo-todo-app.spec.ts', '.'],
        ['.github/workflows/playwright.yml', '.'],
        ['playwright-report/index.html', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a config inside e2e/', () => {
      // andredesousa/angular-playwright-cucumber.
      const anchorOwners = new Set(['e2e']);
      it.each([['e2e/auth.setup.ts', 'e2e']])(
        '%s -> %s',
        (path, owner) => {
          expect(
            resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
          ).toBe(owner);
        },
      );
    });
  });
});
