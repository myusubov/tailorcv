import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Vitest evidence paths, against the shared
 * `resolveUnitRootOwner`. The three config names are the anchors, so every
 * config is resolved first and the support files resolve against the config
 * directories in `anchorOwners`.
 *
 * Rows are `[evidence path, expected owner]` from real layouts named in the
 * comments. A config owns its own folder exactly; a support file belongs to the
 * longest enclosing config folder, and a root config owns the rest.
 */
describe('resolveUnitRootOwner (Vitest projects)', () => {
  describe('a config owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // holtwick/briefing: the repo is the Vitest project.
      ['vitest.config.ts', '.'],
      // KittyCAD/modeling-app: a root workspace file.
      ['vitest.workspace.ts', '.'],
      // Zorrow14/DevPilot: `client/` and `server/` are not workspace roots.
      ['client/vitest.config.mts', 'client'],
      ['server/vitest.config.mts', 'server'],
      // Flaviogonzalez/e-commerce: apps deeper than a workspace unit keep
      // their full folder.
      ['ui/apps/dashboard/vitest.config.ts', 'ui/apps/dashboard'],
      ['ui/apps/storefront/vitest.config.ts', 'ui/apps/storefront'],
      // KittyCAD/modeling-app: a named project config inside a package.
      [
        'packages/codemirror-lang-kcl/vitest.main.config.ts',
        'packages/codemirror-lang-kcl',
      ],
      // promptfoo/promptfoo: a named browser config in `src/app`, and a site
      // config in `site/`.
      ['src/app/vitest.browser.config.ts', 'src/app'],
      ['site/vitest.config.ts', 'site'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('supports follow the config beside them', () => {
    describe('a root config beside a workspace package', () => {
      // KittyCAD/modeling-app: root config plus `packages/ui-components`.
      const anchorOwners = new Set(['.', 'packages/ui-components']);
      it.each([
        // The nearest enclosing config wins over the root config.
        [
          'packages/ui-components/vitest.setup.ts',
          'packages/ui-components',
        ],
        // No deeper config encloses this, so the root config owns it.
        ['vitest.setup.ts', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('sibling projects', () => {
      // Zorrow14/DevPilot.
      const anchorOwners = new Set(['client', 'server']);
      it.each([['client/vitest.setup.ts', 'client']])(
        '%s -> %s',
        (path, owner) => {
          expect(
            resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
          ).toBe(owner);
        },
      );
    });

    describe('apps and a shared config package', () => {
      // Flaviogonzalez/e-commerce.
      const anchorOwners = new Set([
        'ui/apps/dashboard',
        'ui/apps/storefront',
        'ui/packages/config',
      ]);
      it.each([['ui/packages/config/vitest.setup.ts', 'ui/packages/config']])(
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
