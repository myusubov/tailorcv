import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Dumi evidence paths, asserted against the shared
 * `resolveUnitRootOwner`. The Dumi detector marks `.dumirc.(ts|js)` as its
 * anchor signal, so the engine resolves every config first, collects the config
 * directories into `anchorOwners`, and only then resolves the support files
 * (`.dumi/` customisation files, `.fatherrc`, `docs/index.md`,
 * `src/<name>/index.md`) against that set. A row is
 * `[evidence path, expected owner]`.
 *
 * Mental model behind every expectation: the owner is the folder that holds
 * `.dumirc.ts`, the folder where `dumi` runs (it reads its config from the
 * working directory and never searches above it). Evidence belongs to the
 * nearest enclosing config folder.
 *
 * Layouts are real repositories from the Dumi survey, named in comments; rows
 * with no repository comment are synthetic.
 */
describe('resolveUnitRootOwner (Dumi sites)', () => {
  describe('a .dumirc owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // umijs/dumi, ant-design/ant-design: the repo is the site.
      ['.dumirc.ts', '.'],
      // The `js` extension is a valid config name.
      ['.dumirc.js', '.'],
      // indredK/icons: a config in a nested folder.
      ['create-dumi/.dumirc.ts', 'create-dumi'],
      // alipay/Z-RareCharacterSolution: a deep folder keeps its whole path.
      ['frontend/input/h5-react/.dumirc.ts', 'frontend/input/h5-react'],
      // nocobase/nocobase: never truncated to `packages/core`.
      ['packages/core/client/.dumirc.ts', 'packages/core/client'],
      // The original case of the folder is kept.
      ['Docs/.dumirc.ts', 'Docs'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('support files follow the .dumirc above them', () => {
    describe('the standard layout', () => {
      // lin-mt/json-schema-editor-arco.
      const anchorOwners = new Set(['.']);
      it.each([
        ['.dumi/overrides.less', '.'],
        ['.dumi/theme/slots/header/index.tsx', '.'],
        ['.fatherrc.ts', '.'],
        ['docs/index.md', '.'],
        ['src/jsonschemaeditor/index.md', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a project in a package folder', () => {
      // nocobase/nocobase.
      const anchorOwners = new Set(['packages/core/client']);
      it.each([
        [
          'packages/core/client/.dumi/theme/slots/langSwitch.tsx',
          'packages/core/client',
        ],
        ['packages/core/client/.fatherrc.ts', 'packages/core/client'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('several projects in one repository', () => {
    describe('sibling projects are not folded', () => {
      // alipay/Z-RareCharacterSolution: h5-react and pc-react are built
      // separately.
      const anchorOwners = new Set([
        'frontend/input/h5-react',
        'frontend/input/pc-react',
      ]);
      it.each([
        [
          'frontend/input/h5-react/docs/index.md',
          'frontend/input/h5-react',
        ],
        [
          'frontend/input/pc-react/.fatherrc.ts',
          'frontend/input/pc-react',
        ],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a nested project keeps its own files', () => {
      // indredK/icons: a root project plus create-dumi/.
      const anchorOwners = new Set(['.', 'create-dumi']);
      it.each([
        ['.fatherrc.ts', '.'],
        ['docs/index.md', '.'],
        ['create-dumi/.fatherrc.ts', 'create-dumi'],
        ['create-dumi/docs/index.md', 'create-dumi'],
        ['create-dumi/src/foo/index.md', 'create-dumi'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a folder name that only shares a string prefix', () => {
      const anchorOwners = new Set(['docs', 'docs-site']);
      it.each([
        ['docs/.dumi/global.less', 'docs'],
        ['docs-site/.dumi/global.less', 'docs-site'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('a root project claims stray evidence', () => {
    const anchorOwners = new Set(['.']);
    it.each([
      ['site/docs/index.md', '.'],
      ['packages/helper/.fatherrc.ts', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });
});
