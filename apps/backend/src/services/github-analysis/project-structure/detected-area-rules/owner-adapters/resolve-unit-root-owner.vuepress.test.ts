import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for VuePress evidence paths, asserted against the
 * shared `resolveUnitRootOwner`. The VuePress detector marks the `.vuepress`
 * directory entry as its anchor signal, so the engine resolves every
 * `.vuepress` directory first, collects the parent folders into `anchorOwners`,
 * and only then resolves the support files (config, public assets, styles,
 * components, theme files, client file) against that set. A row is
 * `[evidence path, expected owner]`.
 *
 * Mental model behind every expectation: the owner is the VuePress source
 * folder, the folder that holds `.vuepress`, whatever it is called (`src` is
 * the owner when it holds `.vuepress`). It is never the `.vuepress` folder
 * itself and never truncated to `packages/<name>`. Evidence belongs to the
 * nearest enclosing source folder.
 *
 * Layouts are real repositories from the VuePress survey, named in comments;
 * rows with no repository comment are synthetic.
 */
describe('resolveUnitRootOwner (VuePress sites)', () => {
  describe('a .vuepress directory owns its parent folder', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // cjm0/blog and basilosauridae: the repo root is the source folder.
      ['.vuepress', '.'],
      // wuxin0011/vuepress2: the source folder is docs/.
      ['docs/.vuepress', 'docs'],
      // guyutongxue/MyCppTutorial: a custom source folder, src/.
      ['src/.vuepress', 'src'],
      // Casual-UI/casual-ui: a workspace unit keeps its whole folder, never
      // cut to `packages/vue`.
      ['packages/vue/docs/.vuepress', 'packages/vue/docs'],
      // The original case of the folder is kept.
      ['Docs/.vuepress', 'Docs'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('support files follow the .vuepress above them', () => {
    describe('the standard layout', () => {
      // wuxin0011/vuepress2.
      const anchorOwners = new Set(['docs']);
      it.each([
        ['docs/.vuepress/config.ts', 'docs'],
        ['docs/.vuepress/client.ts', 'docs'],
        ['docs/.vuepress/components/ToggleColorModeButton.vue', 'docs'],
        ['docs/.vuepress/public/logo/logo.png', 'docs'],
        ['docs/.vuepress/styles/index.scss', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a custom source folder', () => {
      // guyutongxue/MyCppTutorial.
      const anchorOwners = new Set(['src']);
      it.each([
        ['src/.vuepress/public/assets/doubly-linked-list.svg', 'src'],
        ['src/.vuepress/styles/index.scss', 'src'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('several sites in one repository', () => {
    describe('sibling sites are not folded', () => {
      // SmartDengC/jet5devil-index: iron, sci and wiki are built separately.
      const anchorOwners = new Set(['iron', 'sci', 'wiki']);
      it.each([
        ['iron/.vuepress/theme.ts', 'iron'],
        ['sci/.vuepress/navbar.ts', 'sci'],
        ['sci/.vuepress/styles/index.scss', 'sci'],
        ['wiki/.vuepress/theme.ts', 'wiki'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a nested site keeps its own files', () => {
      // cjm0/blog: a root .vuepress plus docs/.vuepress.
      const anchorOwners = new Set(['.', 'docs']);
      it.each([
        ['.vuepress/config.ts', '.'],
        ['docs/.vuepress/config.ts', 'docs'],
        ['docs/.vuepress/client.ts', 'docs'],
        ['docs/.vuepress/public/img/logo.jpg', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a folder name that only shares a string prefix', () => {
      const anchorOwners = new Set(['docs', 'docs-admin']);
      it.each([
        ['docs/.vuepress/config.ts', 'docs'],
        ['docs-admin/.vuepress/config.ts', 'docs-admin'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('a root site claims stray evidence', () => {
    const anchorOwners = new Set(['.']);
    it.each([
      ['guide/.vuepress/config.ts', '.'],
      ['packages/helper/.vuepress/public/logo.png', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });
});
