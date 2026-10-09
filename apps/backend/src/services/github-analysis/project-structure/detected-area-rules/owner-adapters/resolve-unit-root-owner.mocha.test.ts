import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Mocha evidence paths, against the shared
 * `resolveUnitRootOwner`. `.mocharc.*` is the anchor, so every config is
 * resolved first and `test/mocha.opts` and the `test/` supports resolve against
 * the config directories in `anchorOwners`.
 *
 * Rows are `[evidence path, expected owner]` from real layouts named in the
 * comments. A config owns its own folder exactly; a support file belongs to the
 * longest enclosing config folder, and a root config owns the rest. The
 * `it.fails.each` row is a known gap: it passes only while the resolver still
 * returns the wrong owner, and turns red once it is fixed.
 */
describe('resolveUnitRootOwner (Mocha projects)', () => {
  describe('a config owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // cypress-io/cypress-chrome-recorder: the repo is the Mocha project.
      ['.mocharc.json', '.'],
      // 1024pix/pix: the suite lives in `api/`.
      ['api/.mocharc.cjs', 'api'],
      // overleaf/overleaf: one config per library, `libraries/` is not a
      // workspace root.
      ['libraries/logger/.mocharc.cjs', 'libraries/logger'],
      ['libraries/metrics/.mocharc.cjs', 'libraries/metrics'],
      // medic/cht-conf: a second suite run from its own folder.
      ['test/e2e/.mocharc.js', 'test/e2e'],
      // overleaf/overleaf: a service in a workspace root.
      ['services/web/.mocharc.js', 'services/web'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('supports follow the config beside them', () => {
    describe('a root config', () => {
      // medic/cht-conf: root `.mocharc.js` and `test/e2e/.mocharc.js`.
      const anchorOwners = new Set(['.', 'test/e2e']);
      it.each([
        ['test/api-stub.js', '.'],
        ['test/mock-hierarchies.spec.js', '.'],
        // The nearest enclosing config wins over the root config.
        ['test/e2e/setup.js', 'test/e2e'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a root config beside a workspace package', () => {
      // A root config owns what no deeper config encloses.
      const anchorOwners = new Set(['.', 'packages/cli']);
      it.each([
        ['packages/core/test/support.ts', '.'],
        ['packages/cli/test/setup.js', 'packages/cli'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('test/mocha.opts with no config anywhere', () => {
    // Mocha before v8 read `test/mocha.opts`. With no config the generic
    // fallback picks the owner.
    const anchorOwners = new Set<string>();
    it.each([
      // enb/enb: the repo is the project.
      ['test/mocha.opts', '.'],
      // A package inside a workspace root.
      ['packages/server/test/mocha.opts', 'packages/server'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('known gaps', () => {
    it.fails.each([
      // A project in a plain folder that is not a workspace root. The project
      // root is the folder above `test/`; the generic fallback returns `.`.
      ['js/dav/test/mocha.opts', 'js/dav'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({
          path,
          isAnchorSignal: false,
          anchorOwners: new Set<string>(),
        }),
      ).toBe(owner);
    });
  });
});
