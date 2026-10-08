import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for DocFX evidence paths, asserted against the shared
 * `resolveUnitRootOwner`. The DocFX detector marks `docfx.json` as its anchor
 * signal, so the engine resolves every config first, collects the config
 * directories into `anchorOwners`, and only then resolves the support files
 * (`toc.yml`, `articles/` pages, `api/` scaffold files) against that set. A row
 * is `[evidence path, expected owner]`.
 *
 * Mental model behind every expectation: the owner is the folder that holds
 * `docfx.json`, the folder where `docfx` runs and against which every path in
 * the config is resolved (DocFX never searches above it). Evidence belongs to
 * the nearest enclosing config folder.
 *
 * Layouts are real repositories from the DocFX survey, named in comments; rows
 * with no repository comment are synthetic.
 */
describe('resolveUnitRootOwner (DocFX projects)', () => {
  describe('a docfx.json owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // HrmsTrsmgs/WindowsCalculator: the repo root is a DocFX project.
      ['docfx.json', '.'],
      // steffen-wilke/darkfx: the project is in docs/.
      ['docs/docfx.json', 'docs'],
      // ZacharyPatten/Towel: a tool folder, not docs/.
      ['Tools/docfx_project/docfx.json', 'Tools/docfx_project'],
      // dotnet/docfx: one project per sample folder.
      ['samples/seed/docfx.json', 'samples/seed'],
      // A workspace unit keeps its folder, never cut to `apps/<name>`.
      ['apps/docs/docfx.json', 'apps/docs'],
      // The original case of the folder is kept.
      ['PERF/docfx.json', 'PERF'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('support files follow the docfx.json above them', () => {
    describe('the standard layout', () => {
      // steffen-wilke/darkfx: docs/ holds the config and the scaffold.
      const anchorOwners = new Set(['docs']);
      it.each([
        ['docs/toc.yml', 'docs'],
        ['docs/articles/toc.yml', 'docs'],
        ['docs/articles/intro.md', 'docs'],
        ['docs/api/index.md', 'docs'],
        ['docs/api/toc.yml', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a project in a tool folder', () => {
      // ZacharyPatten/Towel.
      const anchorOwners = new Set(['Tools/docfx_project']);
      it.each([
        ['Tools/docfx_project/toc.yml', 'Tools/docfx_project'],
        ['Tools/docfx_project/benchmarks/toc.yml', 'Tools/docfx_project'],
        ['Tools/docfx_project/api/.manifest', 'Tools/docfx_project'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('several projects in one repository', () => {
    describe('sibling projects are not folded', () => {
      // Sholtee/proxygen: PERF and SRC are built separately.
      const anchorOwners = new Set(['PERF', 'SRC']);
      it.each([
        ['PERF/toc.yml', 'PERF'],
        ['SRC/toc.yml', 'SRC'],
        ['SRC/api/index.md', 'SRC'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a nested project keeps its own files', () => {
      // HrmsTrsmgs/WindowsCalculator: a root project that extracts the API,
      // plus the Visual Studio scaffold in docfx_project/.
      const anchorOwners = new Set(['.', 'docfx_project']);
      it.each([
        ['api/toc.yml', '.'],
        ['api/.manifest', '.'],
        ['docfx_project/toc.yml', 'docfx_project'],
        ['docfx_project/articles/toc.yml', 'docfx_project'],
        ['docfx_project/api/index.md', 'docfx_project'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a folder name that only shares a string prefix', () => {
      const anchorOwners = new Set(['docs', 'docs-api']);
      it.each([
        ['docs/toc.yml', 'docs'],
        ['docs-api/toc.yml', 'docs-api'],
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
      ['toc.yml', '.'],
      ['site/toc.yml', '.'],
      ['packages/helper/api/index.md', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });
});
