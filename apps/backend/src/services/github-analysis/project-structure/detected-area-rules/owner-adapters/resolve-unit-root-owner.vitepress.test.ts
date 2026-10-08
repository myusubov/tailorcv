import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for VitePress evidence paths, asserted against the
 * shared `resolveUnitRootOwner`. The VitePress detector marks the `.vitepress`
 * directory entry as its anchor signal, so the engine resolves every
 * `.vitepress` directory first, collects the parent folders into
 * `anchorOwners`, and only then resolves the support files (config, theme,
 * other `.vitepress/` source, `*.data.*` loaders) against that set. A row is
 * `[evidence path, expected owner]`.
 *
 * Mental model behind every expectation: the owner is the folder that holds
 * `.vitepress`, the VitePress root where the CLI runs, never the `.vitepress`
 * folder itself, never `src` and never the nearest `package.json` folder.
 * Evidence belongs to the nearest enclosing root.
 *
 * Layouts are real repositories from the VitePress survey, named in comments;
 * rows with no repository comment are synthetic.
 */
describe('resolveUnitRootOwner (VitePress sites)', () => {
  describe('a .vitepress directory owns its parent folder', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // The repo is the site.
      ['.vitepress', '.'],
      // EternalCodeTeam/Docs: the site is docs/ and has no package.json.
      ['docs/.vitepress', 'docs'],
      // mihonapp/website: the root is website/src, not website.
      ['website/src/.vitepress', 'website/src'],
      // suenyiyang/archived-vitepress-blog: a workspace unit keeps its folder.
      ['packages/docs/.vitepress', 'packages/docs'],
      ['apps/docs/.vitepress', 'apps/docs'],
      // The original case of the folder is kept.
      ['Docs/.vitepress', 'Docs'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('support files follow the .vitepress above them', () => {
    describe('the standard layout', () => {
      // EternalCodeTeam/Docs.
      const anchorOwners = new Set(['docs']);
      it.each([
        ['docs/.vitepress/config.ts', 'docs'],
        ['docs/.vitepress/theme/index.ts', 'docs'],
        ['docs/.vitepress/theme/style.css', 'docs'],
        ['docs/.vitepress/sidebar.ts', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a workspace unit', () => {
      // shopware/frontends: the site is apps/docs.
      const anchorOwners = new Set(['apps/docs']);
      it.each([
        ['apps/docs/.vitepress/theme/index.ts', 'apps/docs'],
        ['apps/docs/.vitepress/data/design-tokens-colors.ts', 'apps/docs'],
        ['apps/docs/posts.data.ts', 'apps/docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('several sites in one repository', () => {
    describe('sibling sites are not folded', () => {
      // suenyiyang/archived-vitepress-blog: three separate sites.
      const anchorOwners = new Set(['docs', 'packages/blog', 'packages/docs']);
      it.each([
        ['docs/.vitepress/config.ts', 'docs'],
        ['packages/blog/.vitepress/config.ts', 'packages/blog'],
        ['packages/docs/.vitepress/theme/index.ts', 'packages/docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a nested site keeps its own files', () => {
      // SitinCloud/owlyshield-doc: a root site plus docs/.vitepress.
      const anchorOwners = new Set(['.', 'docs']);
      it.each([
        ['.vitepress/config.ts', '.'],
        ['.vitepress/theme/index.ts', '.'],
        ['docs/.vitepress/config.ts', 'docs'],
        ['docs/.vitepress/theme/index.ts', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a folder name that only shares a string prefix', () => {
      const anchorOwners = new Set(['docs', 'docs-admin']);
      it.each([
        ['docs/.vitepress/config.ts', 'docs'],
        ['docs-admin/.vitepress/config.ts', 'docs-admin'],
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
      ['guide/posts.data.ts', '.'],
      ['packages/helper/posts.paths.ts', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });
});
