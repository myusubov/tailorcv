import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Rspress evidence paths, asserted against the shared
 * `resolveUnitRootOwner`. The Rspress detector marks
 * `rspress.config.(js|ts|mjs|mts|cjs|cts)` as its anchor signal, so the engine
 * resolves every config first, collects the config directories into
 * `anchorOwners`, and only then resolves the support files (`_meta.json` and
 * `_nav.json`, `docs/**.md|mdx`, `i18n.json`, the `docs/public/rspress-*`
 * logos) against that set. A row is `[evidence path, expected owner]`.
 *
 * Mental model behind every expectation: the owner is the folder that holds
 * `rspress.config.*`, the working folder where `rspress` runs and loads its
 * config (the doc root `docs/` is a config value, not the project). Evidence
 * belongs to the nearest enclosing config folder.
 *
 * Layouts are real repositories from the Rspress survey, named in comments;
 * rows with no repository comment are synthetic.
 */
describe('resolveUnitRootOwner (Rspress sites)', () => {
  describe('an rspress.config owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // LuckierLove/Documents: the repo is the site, with docs/ as the pages.
      ['rspress.config.ts', '.'],
      // ohah/cheolsu-proxy: a custom folder name, not docs/.
      ['document/rspress.config.ts', 'document'],
      // jiggy/jig: one site per folder under site/.
      ['site/flow/rspress.config.ts', 'site/flow'],
      // web-infra-dev/rsdoctor-style workspace unit, never cut to `packages`.
      ['packages/document/rspress.config.ts', 'packages/document'],
      // All six extensions Rspress loads are valid anchors.
      ['website/rspress.config.mjs', 'website'],
      ['website/rspress.config.cts', 'website'],
      // The original case of the folder is kept.
      ['Docs/rspress.config.ts', 'Docs'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('support files follow the rspress.config above them', () => {
    describe('the standard layout', () => {
      // LuckierLove/Documents.
      const anchorOwners = new Set(['.']);
      it.each([
        ['docs/_meta.json', '.'],
        ['docs/guide/index.mdx', '.'],
        ['docs/public/rspress-dark-logo.png', '.'],
        ['i18n.json', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a custom folder name', () => {
      // ohah/cheolsu-proxy: pages in document/, not docs/.
      const anchorOwners = new Set(['document']);
      it.each([
        ['document/i18n.json', 'document'],
        ['document/en/guide/_meta.json', 'document'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('several sites in one repository', () => {
    describe('sibling sites are not folded', () => {
      // jiggy/jig: flow and jig are built separately.
      const anchorOwners = new Set(['site/flow', 'site/jig']);
      it.each([
        ['site/flow/docs/_nav.json', 'site/flow'],
        ['site/jig/docs/index.md', 'site/jig'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a nested site keeps its own files', () => {
      // hardfist/rspress-legacy-cache-invalidation-repro: a root site plus
      // benchmark/.
      const anchorOwners = new Set(['.', 'benchmark']);
      it.each([
        ['docs/index.md', '.'],
        ['benchmark/docs/index.md', 'benchmark'],
        ['benchmark/i18n.json', 'benchmark'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a folder name that only shares a string prefix', () => {
      const anchorOwners = new Set(['docs', 'docs-site']);
      it.each([
        ['docs/docs/_meta.json', 'docs'],
        ['docs-site/docs/_meta.json', 'docs-site'],
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
      ['site/docs/index.md', '.'],
      ['packages/helper/docs/_meta.json', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });
});
