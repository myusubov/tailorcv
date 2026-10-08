import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for Antora evidence paths, asserted against the shared
 * `resolveUnitRootOwner`. The Antora detector marks `antora.yml` as its anchor
 * signal, so the engine resolves every descriptor first, collects the
 * descriptor directories into `anchorOwners`, and only then resolves the
 * support files (`modules/<module>/pages`, `nav*.adoc`, `partials`, `images`)
 * against that set. A row is `[evidence path, expected owner]`.
 *
 * Mental model behind every expectation: the owner is the folder that holds
 * `antora.yml`, the content source root where Antora looks for `modules/`
 * (it never searches above it). Module files belong to the nearest enclosing
 * descriptor folder and never to a `modules/<name>` folder of their own.
 *
 * Layouts are real repositories from the Antora survey, named in comments;
 * rows with no repository comment are synthetic.
 */
describe('resolveUnitRootOwner (Antora components)', () => {
  describe('an antora.yml owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // The repo is the component.
      ['antora.yml', '.'],
      // rubocop/rubocop: the component is in docs/.
      ['docs/antora.yml', 'docs'],
      // spring-projects/spring-data-jpa: a Maven start path.
      ['src/main/antora/antora.yml', 'src/main/antora'],
      // AxonIQ/AxonFramework: one component per guide folder.
      ['docs/reference-guide/antora.yml', 'docs/reference-guide'],
      // cppalliance/mrdocs: a component nested inside another.
      ['docs/ui/docs/antora.yml', 'docs/ui/docs'],
      // A workspace unit keeps its folder, never cut to `apps/<name>`.
      ['apps/docs/antora.yml', 'apps/docs'],
      // The original case of the folder is kept.
      ['Docs/antora.yml', 'Docs'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('module files follow the antora.yml above them', () => {
    describe('the standard layout', () => {
      // rubocop/rubocop.
      const anchorOwners = new Set(['docs']);
      it.each([
        ['docs/modules/ROOT/nav.adoc', 'docs'],
        ['docs/modules/ROOT/pages/index.adoc', 'docs'],
        ['docs/modules/ROOT/partials/cops_layout_footer.adoc', 'docs'],
        ['docs/modules/ROOT/images/logo.png', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a Maven start path', () => {
      // spring-projects/spring-data-jpa.
      const anchorOwners = new Set(['src/main/antora']);
      it.each([
        ['src/main/antora/modules/ROOT/nav.adoc', 'src/main/antora'],
        ['src/main/antora/modules/ROOT/pages/index.adoc', 'src/main/antora'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('several components in one repository', () => {
    describe('sibling components are not folded', () => {
      // AxonIQ/AxonFramework: each guide has its own antora.yml.
      const anchorOwners = new Set([
        'docs/getting-started',
        'docs/reference-guide',
        'docs/saga-guide',
      ]);
      it.each([
        [
          'docs/getting-started/modules/ROOT/nav.adoc',
          'docs/getting-started',
        ],
        [
          'docs/reference-guide/modules/ROOT/pages/index.adoc',
          'docs/reference-guide',
        ],
        // A named module belongs to its component, not to a folder of its own.
        [
          'docs/reference-guide/modules/commands/pages/index.adoc',
          'docs/reference-guide',
        ],
        ['docs/saga-guide/modules/ROOT/pages/index.adoc', 'docs/saga-guide'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a nested component keeps its own files', () => {
      // cppalliance/mrdocs: docs/ and the UI bundle docs/ui/docs.
      const anchorOwners = new Set(['docs', 'docs/ui/docs']);
      it.each([
        ['docs/modules/ROOT/nav.adoc', 'docs'],
        ['docs/modules/ROOT/pages/index.adoc', 'docs'],
        ['docs/ui/docs/modules/ROOT/nav.adoc', 'docs/ui/docs'],
        ['docs/ui/docs/modules/ROOT/pages/index.adoc', 'docs/ui/docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a folder name that only shares a string prefix', () => {
      const anchorOwners = new Set(['docs', 'docs-guide']);
      it.each([
        ['docs/modules/ROOT/pages/index.adoc', 'docs'],
        ['docs-guide/modules/ROOT/pages/index.adoc', 'docs-guide'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('a root component claims the modules beneath it', () => {
    // vkutuev/computer-workshop: antora.yml at the root, modules/ beside it,
    // and module names that are not ROOT. The owner is `.`, never a
    // `modules/<name>` folder.
    const anchorOwners = new Set(['.']);
    it.each([
      ['modules/ROOT/pages/index.adoc', '.'],
      ['modules/00-intro-work/nav.adoc', '.'],
      ['modules/00-intro-work/pages/index.adoc', '.'],
      ['modules/01-lab-git/pages/index.adoc', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });
});
