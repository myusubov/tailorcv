import { describe, expect, it } from 'vitest';
import { resolveUnitRootOwner } from './resolve-unit-root-owner';

/**
 * Owner-resolution spec for mdBook evidence paths, asserted against the shared
 * `resolveUnitRootOwner`. The mdBook detector marks `book.toml` as its anchor
 * signal, so the engine resolves every config first, collects the config
 * directories into `anchorOwners`, and only then resolves the support files
 * (`SUMMARY.md`, theme files, plugin assets) against that set. A row is
 * `[evidence path, expected owner]`.
 *
 * Mental model behind every expectation: the owner is the book root, the
 * folder that holds `book.toml` and where `mdbook` runs (mdBook joins
 * `book.toml` and `src` onto the root it is given and never searches above
 * it). Evidence belongs to the nearest enclosing book root; evidence that no
 * book root encloses belongs to nobody useful, which the detector's gate then
 * drops.
 *
 * Layouts are real repositories from the mdBook survey, named in comments;
 * rows with no repository comment are synthetic.
 */
describe('resolveUnitRootOwner (mdBook books)', () => {
  describe('a book.toml owns its own directory', () => {
    const anchorOwners = new Set<string>();
    it.each([
      // rust-lang/rust-by-example, rust-lang/nomicon: the repo is the book.
      ['book.toml', '.'],
      // zed-industries/zed, nanomsg/nng: the book is in docs/.
      ['docs/book.toml', 'docs'],
      // helix-editor/helix.
      ['book/book.toml', 'book'],
      // rust-lang/cargo: two books under doc/.
      ['doc/book/book.toml', 'doc/book'],
      ['doc/contrib/book.toml', 'doc/contrib'],
      // rust-lang/rust: books under src/doc/.
      ['src/doc/rustc-dev-guide/book.toml', 'src/doc/rustc-dev-guide'],
      // A workspace unit keeps the full folder, never truncated to
      // `packages/<name>`.
      ['packages/guide/docs/book.toml', 'packages/guide/docs'],
      ['apps/docs-site/book.toml', 'apps/docs-site'],
      // The original case of the folder is kept.
      ['Book/book.toml', 'Book'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: true, anchorOwners }),
      ).toBe(owner);
    });
  });

  describe('support files follow the book.toml above them', () => {
    describe('the standard layout in a subfolder', () => {
      // zed-industries/zed.
      const anchorOwners = new Set(['docs']);
      it.each([
        ['docs/src/SUMMARY.md', 'docs'],
        ['docs/theme/head.hbs', 'docs'],
        ['docs/theme/css/chrome.css', 'docs'],
        ['docs/mermaid-init.js', 'docs'],
        ['docs/mdbook-admonish.css', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a custom src folder', () => {
      // The owner is the book root, never the src folder. Each row is
      // `[evidence path, anchor owners, expected owner]`.
      it.each([
        // nanomsg/nng: docs/book.toml with chapters in docs/ref/.
        ['docs/ref/SUMMARY.md', ['docs'], 'docs'],
        // harnesslabs/arbiter: book.toml at the root, chapters in docs/.
        ['docs/SUMMARY.md', ['.'], '.'],
      ])('%s with anchors %j -> %s', (path, anchors, owner) => {
        expect(
          resolveUnitRootOwner({
            path,
            isAnchorSignal: false,
            anchorOwners: new Set(anchors),
          }),
        ).toBe(owner);
      });
    });
  });

  describe('several books in one repository', () => {
    describe('sibling books are not folded', () => {
      // rust-lang/cargo, rust-lang/rustup, mozilla/glean.
      const anchorOwners = new Set(['doc/book', 'doc/contrib']);
      it.each([
        ['doc/book/src/SUMMARY.md', 'doc/book'],
        ['doc/book/theme/head.hbs', 'doc/book'],
        ['doc/contrib/src/SUMMARY.md', 'doc/contrib'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a nested book keeps its own files', () => {
      // rust-lang/reference: the Reference at the root, a separate
      // contributor guide in dev-guide/.
      const anchorOwners = new Set(['.', 'dev-guide']);
      it.each([
        ['src/SUMMARY.md', '.'],
        ['theme/head.hbs', '.'],
        ['dev-guide/src/SUMMARY.md', 'dev-guide'],
        ['dev-guide/theme/head.hbs', 'dev-guide'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('archived editions beside the current book', () => {
      // rust-lang/book: root book plus 2018-edition/ and first-edition/.
      const anchorOwners = new Set(['.', '2018-edition', 'first-edition']);
      it.each([
        ['src/SUMMARY.md', '.'],
        ['2018-edition/src/SUMMARY.md', '2018-edition'],
        ['first-edition/src/SUMMARY.md', 'first-edition'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('a folder name that only shares a string prefix', () => {
      const anchorOwners = new Set(['guide', 'guide-admin']);
      it.each([
        ['guide/src/SUMMARY.md', 'guide'],
        ['guide-admin/src/SUMMARY.md', 'guide-admin'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('support files outside every book root', () => {
    // A summary in a repo-root folder, beside a book that lives in website/.
    // The generic fallback gives it a folder with no book.toml, so the
    // detector's gate drops that candidate.
    describe('beside a book in a subfolder', () => {
      const anchorOwners = new Set(['website']);
      it.each([
        ['src/SUMMARY.md', '.'],
        ['docs/SUMMARY.md', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });

    describe('beside a book in another workspace unit', () => {
      // The fallback is the unit, a folder with no book.toml of its own.
      const anchorOwners = new Set(['apps/docs']);
      it.each([
        ['apps/web/theme/head.hbs', 'apps/web'],
        ['packages/ui/docs/SUMMARY.md', 'packages/ui'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
        ).toBe(owner);
      });
    });
  });

  describe('a root book claims stray evidence', () => {
    // rust-lang/book has a redirects/SUMMARY.md that no deeper book encloses.
    const anchorOwners = new Set(['.']);
    it.each([
      ['redirects/SUMMARY.md', '.'],
      ['src/SUMMARY.md', '.'],
      ['packages/helper/docs/SUMMARY.md', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveUnitRootOwner({ path, isAnchorSignal: false, anchorOwners }),
      ).toBe(owner);
    });
  });
});
