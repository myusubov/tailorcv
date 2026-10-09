import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Cypress evidence paths, against the shared
 * `resolveUnitRootOwner`. `cypress.config.*` and `cypress.json` are the
 * anchors, so every config is resolved first and the spec folders, spec files
 * and support files resolve against the config directories in `anchorOwners`.
 *
 * Rows are `[evidence path, expected owner]` from real layouts named in the
 * comments. A config owns its own folder exactly; a support file belongs to the
 * longest enclosing config folder, and a root config owns the rest. A support
 * file that no config encloses resolves to a folder with no config, which the
 * detector's gate drops.
 */
describe('resolveUnitRootOwner (Cypress projects)', () => {
  describe('a config owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // bahmutov/cy-spok: the repo is the Cypress project.
      ['cypress.config.ts', '.'],
      // Cypress before 10 kept its config in `cypress.json`.
      ['cypress.json', '.'],
      // Nx workspaces: the e2e project, not the app it tests.
      ['apps/web-e2e/cypress.config.ts', 'apps/web-e2e'],
      // AlbertoBasaloLabs/ng-classic-ai: the project root is `tests/`.
      ['tests/cypress.config.js', 'tests'],
      // CodeCraft-Dispatch/automated-sec-analysis: sibling e2e projects under
      // a `src/apps` folder that is not a workspace root.
      [
        'src/apps/fa-portal-host-e2e/cypress.config.cjs',
        'src/apps/fa-portal-host-e2e',
      ],
      [
        'src/apps/fa_portal_file_capture-e2e/cypress.config.cjs',
        'src/apps/fa_portal_file_capture-e2e',
      ],
      // batje/cypress-vite-preprocessor: a demo project that is a working
      // Cypress project of its own.
      ['examples/react-app/cypress.config.js', 'examples/react-app'],
      // filiphric/cypress-plugin-api: a second config inside the first
      // project's spec folder.
      ['cypress/e2e/cypress.config.js', 'cypress/e2e'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('supports follow the config beside them', () => {
    describe('a root config', () => {
      // bahmutov/cy-spok.
      const anchorOwners = new Set(['.']);
      it.each([
        ['cypress/e2e', '.'],
        ['cypress/e2e/deep-equal.cy.ts', '.'],
        ['cypress/support/e2e.js', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a root config beside a nested config', () => {
      // filiphric/cypress-plugin-api: the specs belong to the inner project;
      // the support file is outside it and falls to the root config.
      const anchorOwners = new Set(['.', 'cypress/e2e']);
      it.each([
        ['cypress/e2e', 'cypress/e2e'],
        ['cypress/e2e/cookies.cy.ts', 'cypress/e2e'],
        ['cypress/support/e2e.ts', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a config in a custom folder', () => {
      // AlbertoBasaloLabs/ng-classic-ai: `tests/cypress.config.js` with the
      // specs in `tests/cypress/e2e`.
      const anchorOwners = new Set(['tests']);
      it.each([
        ['tests/cypress/e2e', 'tests'],
        ['tests/cypress/e2e/smoke.cy.js', 'tests'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('sibling e2e projects', () => {
      // CodeCraft-Dispatch/automated-sec-analysis.
      const anchorOwners = new Set([
        'src/apps/fa-portal-host-e2e',
        'src/apps/fa_portal_file_capture-e2e',
      ]);
      it.each([
        [
          'src/apps/fa-portal-host-e2e/src/e2e/app.cy.ts',
          'src/apps/fa-portal-host-e2e',
        ],
        [
          'src/apps/fa_portal_file_capture-e2e/src/e2e/app.cy.ts',
          'src/apps/fa_portal_file_capture-e2e',
        ],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('spec folders with no config anywhere', () => {
    // konradkubiec/ts-react-redux-sample: `cypress/integration` is committed
    // but no `cypress.json` is, so the generic fallback picks a folder with no
    // config and the detector's gate drops it.
    const anchorOwners = new Set<string>();
    it.each([['cypress/integration', '.']])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });
});
