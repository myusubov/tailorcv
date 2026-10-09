import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Jest evidence paths, against the shared
 * `resolveUnitRootOwner`. `jest.config.*` is the anchor, so every config is
 * resolved first and the variant and setup files resolve against the config
 * directories in `anchorOwners`.
 *
 * Rows are `[evidence path, expected owner]` from real layouts named in the
 * comments. A config owns its own folder exactly; a support file belongs to the
 * longest enclosing config folder, and a root config owns the rest. The
 * `it.fails.each` rows are known gaps: they pass only while the resolver still
 * returns the wrong owner, and turn red once it is fixed.
 */
describe('resolveUnitRootOwner (Jest projects)', () => {
  describe('a config owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // Skolaczk/next-starter: the repo is the Jest project.
      ['jest.config.js', '.'],
      // anamtechjay/cowboy-v2: sibling projects, each with its own config.
      ['backend/jest.config.js', 'backend'],
      ['frontend/jest.config.js', 'frontend'],
      // DavidDimon/nx-monorepo: Nx apps and libraries, one config each.
      ['apps/app-test/jest.config.ts', 'apps/app-test'],
      ['apps/app-test-e2e/jest.config.json', 'apps/app-test-e2e'],
      ['libs/services/jest.config.ts', 'libs/services'],
      // A config deeper than the workspace unit keeps its full folder, where
      // the application-area fallback would cut it to `apps/<name>`.
      ['apps/web/e2e/jest.config.ts', 'apps/web/e2e'],
      // The original case of the folder is kept.
      ['Backend/jest.config.js', 'Backend'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });

    it.each(['js', 'ts', 'mjs', 'cjs', 'mts', 'cts', 'json'])(
      'resolves a .%s config to its folder',
      (extension) => {
        expect(
          resolveUnitRootOwner({
            path: `packages/server/jest.config.${extension}`,
            isAnchorSignal: true,
            anchorOwners,
          }),
        ).toBe('packages/server');
      },
    );
  });

  describe('variant and setup files follow the config beside them', () => {
    describe('a root config beside Nx projects', () => {
      // DavidDimon/nx-monorepo: root `jest.config.ts` plus one per project.
      const anchorOwners = new Set(['.', 'apps/app-test', 'libs/services']);
      it.each([
        // The nearest enclosing config wins over the root config.
        ['apps/app-test/jest.setup.ts', 'apps/app-test'],
        ['libs/services/jest.setup.ts', 'libs/services'],
        // No deeper config encloses these, so the root config owns them.
        ['libs/theme/jest.setup.ts', '.'],
        ['jest.preset.js', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('sibling projects', () => {
      // anamtechjay/cowboy-v2.
      const anchorOwners = new Set(['backend', 'frontend']);
      it.each([['frontend/jest.setup.js', 'frontend']])(
        '%s -> %s',
        (path, owner) => {
          expect(
            resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
          ).toBe(owner);
        },
      );
    });
  });

  describe('a variant file with no config anywhere', () => {
    // The Jest config lives in a `"jest"` key of `package.json`, which a path
    // reader cannot see, so the variant file opens the gate and the generic
    // fallback picks the owner.
    const anchorOwners = new Set<string>();
    it.each([
      // fantasticit/think: a NestJS app in a workspace unit.
      ['packages/server/test/jest-e2e.json', 'packages/server'],
      // 0xb4lamx/nestjs-boilerplate-microservice: the app is the repo.
      ['test/jest-e2e.json', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('known gaps', () => {
    it.fails.each([
      // apollographql/apollo-client: `config/jest.config.ts` sets `rootDir`
      // to the repo root, which a path reader cannot see. The project root is
      // `.`; the resolver returns `config`.
      ['config/jest.config.ts', '.', true],
      // boostcampwm-2022/web13-moyeomoyeo: a NestJS `test/jest-e2e.json`
      // inside a plain `backend/` folder. The project root is `backend`; the
      // generic fallback returns `.`.
      ['backend/test/jest-e2e.json', 'backend', false],
    ])('%s -> %s', (path, owner, isAnchorSignal) => {
      expect(
        resolveUnitRootOwner({
          path,
          isAnchorSignal,
          anchorOwners: new Set<string>(),
        }),
      ).toBe(owner);
    });
  });
});
