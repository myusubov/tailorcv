import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Starlight evidence paths, asserted against the
 * shared `resolveUnitRootOwner`. The Starlight detector marks
 * `astro.config.(mjs|js|ts|mts)` as its anchor signal, so the engine resolves
 * every config first, collects the config directories into `anchorOwners`, and
 * only then resolves the support files (docs content, index page, custom CSS,
 * locale files, template asset) against that set. A row is
 * `[evidence path, expected owner]`.
 *
 * Mental model behind every expectation: the owner is the Astro project root,
 * the folder that holds `astro.config.*` and where `astro` runs (Astro loads
 * its config from the root folder only and never searches above it). Evidence
 * belongs to the nearest enclosing project root; evidence that no project root
 * encloses belongs to nobody useful, which the detector's gate then drops.
 *
 * Layouts are real repositories from the Starlight survey, named in comments;
 * rows with no repository comment are synthetic.
 */
describe('resolveUnitRootOwner (Starlight sites)', () => {
  describe('an astro.config owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // The repo is the site.
      ['astro.config.mjs', '.'],
      // HiDeoo/starlight-auto-sidebar: the site is in docs/.
      ['docs/astro.config.ts', 'docs'],
      // slint-ui/slint: one site per folder under docs/.
      ['docs/cpp/astro.config.mjs', 'docs/cpp'],
      ['ui-libraries/material/docs/astro.config.ts', 'ui-libraries/material/docs'],
      // pixelmord/prestyled: a workspace unit keeps its folder.
      ['apps/docs/astro.config.mjs', 'apps/docs'],
      // Never truncated to `packages/<name>`: the docs folder is where Astro runs.
      [
        'packages/starlight-blog/docs/astro.config.mjs',
        'packages/starlight-blog/docs',
      ],
      // The `mts` extension is a valid Astro config name.
      ['site/astro.config.mts', 'site'],
      // The original case of the folder is kept.
      ['Docs/astro.config.mjs', 'Docs'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('support files follow the astro.config above them', () => {
    describe('the standard layout in a workspace unit', () => {
      // pixelmord/prestyled: apps/docs is Starlight, apps/web is plain Astro.
      const anchorOwners = new Set(['apps/docs', 'apps/web']);
      it.each([
        ['apps/docs/src/content/docs/index.mdx', 'apps/docs'],
        ['apps/docs/src/content/docs/guides/example.md', 'apps/docs'],
        ['apps/docs/src/assets/houston.webp', 'apps/docs'],
        ['apps/web/src/content/docs/index.mdx', 'apps/web'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a locale folder and UI strings stay with their site', () => {
      const anchorOwners = new Set(['docs']);
      it.each([
        ['docs/src/content/docs/fr/index.mdx', 'docs'],
        ['docs/src/content/i18n/fr.json', 'docs'],
        ['docs/src/styles/custom.css', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('several sites in one repository', () => {
    describe('sibling sites are not folded', () => {
      // slint-ui/slint: each folder has its own astro.config and is built
      // separately, so none is folded into `docs`.
      const anchorOwners = new Set(['docs/astro', 'docs/cpp', 'docs/safety']);
      it.each([
        ['docs/astro/src/content/docs/index.mdx', 'docs/astro'],
        ['docs/cpp/src/content/docs/index.mdx', 'docs/cpp'],
        ['docs/safety/src/content/docs/index.mdx', 'docs/safety'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a nested site keeps its own files', () => {
      // abdulhakim-alshanqiti/sanabel-al-firdaws.github.io.old: a root site
      // plus the starlight-blog docs site two folders into packages/.
      const anchorOwners = new Set(['.', 'packages/starlight-blog/docs']);
      it.each([
        ['src/content/docs/index.mdx', '.'],
        ['src/styles/custom.css', '.'],
        [
          'packages/starlight-blog/docs/src/content/docs/index.mdx',
          'packages/starlight-blog/docs',
        ],
        [
          'packages/starlight-blog/docs/src/styles/custom.css',
          'packages/starlight-blog/docs',
        ],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a folder name that only shares a string prefix', () => {
      const anchorOwners = new Set(['docs', 'docs-admin']);
      it.each([
        ['docs/src/content/docs/index.mdx', 'docs'],
        ['docs-admin/src/content/docs/index.mdx', 'docs-admin'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('support files outside every project root', () => {
    // A docs page with no config above it. The generic fallback gives it a
    // folder with no astro.config, so the detector's gate drops that
    // candidate.
    describe('beside a site in a subfolder', () => {
      const anchorOwners = new Set(['website']);
      it.each([['src/content/docs/index.mdx', '.']])(
        '%s -> %s',
        (path, owner) => {
          expect(
            resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
          ).toBe(owner);
        },
      );
    });

    describe('beside a site in another workspace unit', () => {
      const anchorOwners = new Set(['apps/docs']);
      it.each([['apps/web/src/content/docs/index.mdx', 'apps/web']])(
        '%s -> %s',
        (path, owner) => {
          expect(
            resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
          ).toBe(owner);
        },
      );
    });

    describe('with no config anywhere', () => {
      // entro314-labs/starlight-document-converter: a stray page at the root.
      const anchorOwners = new Set<string>();
      it.each([['src/content/docs/test-doc.md', '.']])(
        '%s -> %s',
        (path, owner) => {
          expect(
            resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
          ).toBe(owner);
        },
      );
    });
  });

  describe('a root site claims stray evidence', () => {
    const anchorOwners = new Set(['.']);
    it.each([
      ['src/content/docs/index.mdx', '.'],
      ['site/src/content/docs/index.mdx', '.'],
      ['packages/helper/src/content/docs/index.mdx', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });
});
