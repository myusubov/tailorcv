import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Fumadocs evidence paths, asserted against the
 * shared `resolveUnitRootOwner`. The Fumadocs detector marks
 * `source.config.(ts|mts)` as its anchor signal, so the engine resolves every
 * config first, collects the config directories into `anchorOwners`, and only
 * then resolves the support files (`content/docs/**\/meta.json`,
 * `lib/source.ts`, the `app/docs/[[...slug]]` route) against that set. A row is
 * `[evidence path, expected owner]`.
 *
 * Mental model behind every expectation: the owner is the project folder that
 * holds `source.config.ts`, where the host framework runs and where
 * `fumadocs-mdx` resolves the config and its `.source/` output from the working
 * directory. Evidence belongs to the nearest enclosing config folder.
 *
 * Layouts are real repositories from the Fumadocs survey, named in comments;
 * rows with no repository comment are synthetic.
 */
describe('resolveUnitRootOwner (Fumadocs sites)', () => {
  describe('a source.config owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // KieSun/how-to-build-agent: the repo is the site.
      ['source.config.ts', '.'],
      // fuma-nama/fumadocs: the site is apps/docs, never cut to `apps`.
      ['apps/docs/source.config.ts', 'apps/docs'],
      // Outblock/FlowIndex-monorepo: a config three levels deep owns itself,
      // not the repository root.
      ['sim-workflow/apps/docs/source.config.ts', 'sim-workflow/apps/docs'],
      // codante-io/guias: one site per app folder.
      ['apps/next-v16-fumadocs/source.config.ts', 'apps/next-v16-fumadocs'],
      // The `mts` extension is a valid config name.
      ['site/source.config.mts', 'site'],
      // The original case of the folder is kept.
      ['Docs/source.config.ts', 'Docs'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('support files follow the source.config above them', () => {
    describe('the standard layout in a workspace unit', () => {
      // fuma-nama/fumadocs: apps/docs is the site.
      const anchorOwners = new Set(['apps/docs']);
      it.each([
        ['apps/docs/content/docs/meta.json', 'apps/docs'],
        ['apps/docs/content/docs/guide/meta.json', 'apps/docs'],
        ['apps/docs/lib/source.ts', 'apps/docs'],
        ['apps/docs/app/docs/[[...slug]]/page.tsx', 'apps/docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a src folder stays inside the project', () => {
      // KieSun/how-to-build-agent: src/lib/source.ts beside a root config.
      const anchorOwners = new Set(['.']);
      it.each([
        ['src/lib/source.ts', '.'],
        ['content/docs/en/meta.json', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('several sites in one repository', () => {
    describe('sibling sites are not folded', () => {
      // codante-io/guias: two Fumadocs apps side by side.
      const anchorOwners = new Set([
        'apps/codando-com-ia',
        'apps/next-v16-fumadocs',
      ]);
      it.each([
        ['apps/codando-com-ia/content/docs/meta.json', 'apps/codando-com-ia'],
        [
          'apps/next-v16-fumadocs/src/app/docs/[[...slug]]/page.tsx',
          'apps/next-v16-fumadocs',
        ],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a deep site keeps its own files beside a shallow one', () => {
      // Outblock/FlowIndex-monorepo: devportal and a site three levels down.
      const anchorOwners = new Set(['devportal', 'sim-workflow/apps/docs']);
      it.each([
        ['devportal/lib/source.ts', 'devportal'],
        [
          'sim-workflow/apps/docs/src/lib/source.ts',
          'sim-workflow/apps/docs',
        ],
        [
          'sim-workflow/apps/docs/content/docs/meta.json',
          'sim-workflow/apps/docs',
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
        ['docs/content/docs/meta.json', 'docs'],
        ['docs-admin/content/docs/meta.json', 'docs-admin'],
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
      ['docs/content/docs/meta.json', '.'],
      ['packages/helper/lib/source.ts', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });
});
