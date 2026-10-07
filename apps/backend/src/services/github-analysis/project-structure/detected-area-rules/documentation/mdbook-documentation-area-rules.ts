import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingMdBookNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only mdBook signal contract, from a GitHub-tree survey of 4,949
 * repositories (5,598 `book.toml` files, 5,025 book folders in 3,704
 * repositories after the exclusions; code search sliced by file size, topic
 * and keyword search, and named projects; search-biased, tuned and checked on
 * the same sample, with no held-out set):
 * - Anchor, scored `3` (the emission floor): `mdbook-config-file`
 *   (`book.toml`). mdBook loads it from the book root and never searches
 *   above that folder, so its folder is both the gate and the owner anchor.
 *   96.4% of anchor folders also hold a `SUMMARY.md` beneath them; the other
 *   3.6% are mostly real books (generated or untracked summary, `src`
 *   pointing outside the folder, the `nostarch` print variant), with about
 *   0.4% a data file that happens to be called `book.toml`.
 * - Support, which never opens the gate: `mdbook-summary-file` (`SUMMARY.md`),
 *   scored `2`, beside 96.4% of anchors and also used by GitBook, so it cannot
 *   be an anchor; `mdbook-theme-dir` (the file names mdBook documents for a
 *   custom theme), scored `1`, 16.2% against 1.3% elsewhere;
 *   `mdbook-plugin-assets` (`mermaid-init.js`, `mdbook-*.css|js`), scored `1`,
 *   7.9% (`mermaid-init.js`) and 2.3% (`mdbook-*.css|js`) against 0.3%
 *   elsewhere. With no anchor an orphan support file never emits.
 * - Deliberately not scored: `src/chapter_1.md` (the `mdbook init`
 *   placeholder), `src/README.md`, committed build output
 *   (`elasticlunr.min.js`, `ayu-highlight*.css`: no lift), `po/*.po`,
 *   `404.md`, `CNAME`, `.nojekyll`, workflows, `Cargo.toml` and other
 *   Markdown.
 */
const MDBOOK_DOCUMENTATION_SIGNAL_SCORES = {
  'mdbook-config-file': 3,
  'mdbook-summary-file': 2,
  'mdbook-theme-dir': 1,
  'mdbook-plugin-assets': 1,
} as const;

type MdBookDocumentationSignal =
  keyof typeof MDBOOK_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Adds a `Documentation` candidate for mdBook books.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `mdBook` and related technology `Rust` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder, under the mdBook-only template, `managed_components` and
 * demo-prefix folders (`excludingMdBookNonDocumentationFolders`), and any path
 * with a `{{` placeholder, at any depth. A support file under such a folder
 * contributes no signal, score or evidence, so a fixture book cannot feed the
 * owner of the real one (`rust-lang/mdBook` holds 76 `book.toml` files and
 * only `guide/` is real).
 *
 * Gate: `mdbook-config-file` alone. Requiring a `SUMMARY.md` as well would
 * lose 2.6% of emitting repositories, nearly all real books, to reject about
 * 0.4% data files. `SUMMARY.md` alone is not a gate because GitBook and HonKit
 * use the same file.
 *
 * Owner: `resolveUnitRootOwner`, with the config as the anchor signal. The
 * config owns its own directory (`.` at the repo root), never its parent, never
 * the `src` folder and never truncated to `apps/<name>`, because that folder
 * is where `mdbook` runs. Every support file resolves to the longest non-root
 * config directory that encloses it, so a nested book keeps its own files, and
 * sibling books are never folded. A support file that no non-root config
 * encloses belongs to a root config when there is one, and otherwise resolves
 * through the generic fallback to a folder with no config, which fails the
 * gate and is dropped.
 *
 * Limitations:
 * - Path-only: `book.toml` is not read, so a custom `src` that points outside
 *   the book folder (1.1% of survey folders) leaves its summary unclaimed, and
 *   a book with no `book.toml` at all (mdBook falls back to its default
 *   config) is invisible.
 * - Nested translations and editions (`translations/<lang>`, `2018-edition`)
 *   are real build roots and each emits its own candidate; a path-only rule
 *   cannot tell them from distinct nested books.
 * - There is no cap on owners: 11 surveyed repositories hold more than 20
 *   books, the largest 71.
 * - The shared `spec` exclusion also hides real specification books
 *   (`docs/spec/book.toml`), 4 of 4,949 surveyed repositories. Fixture folders
 *   with other names (`integration/`) are not excluded.
 * - Paths are lowercased before matching, so the summary regex also matches a
 *   page called `summary.md`; a signal counts once per owner, so this adds
 *   nothing.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addMdBookDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<MdBookDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'mdBook',
    relatedTechs: ['Rust'],
    signalScores: MDBOOK_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'mdbook-config-file',
        regex: excludingMdBookNonDocumentationFolders(
          String.raw`(?:.*/)?book\.toml`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'mdbook-summary-file',
        regex: excludingMdBookNonDocumentationFolders(
          String.raw`(?:.*/)?summary\.md`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'mdbook-theme-dir',
        regex: excludingMdBookNonDocumentationFolders(
          String.raw`(?:.*/)?theme/(?:index\.hbs|head\.hbs|header\.hbs|css/.+|book\.js|highlight\.(?:js|css)|favicon\.(?:svg|png)|fonts/fonts\.css)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'mdbook-plugin-assets',
        regex: excludingMdBookNonDocumentationFolders(
          String.raw`(?:.*/)?(?:mermaid-init\.js|mdbook-[\w-]+\.(?:css|js))`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'mdbook-config-file',
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
