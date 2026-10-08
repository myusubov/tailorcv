import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only Antora signal contract, from a GitHub-tree survey of 693
 * repositories (844 `antora.yml` folders after the shared exclusion, 815 of
 * them real components; code search for the file name plus three extra
 * searches; search-biased, tuned and checked on the same sample, with no
 * held-out set, and only 52 repositories without a real descriptor as the
 * baseline). A folder counts as real when its `antora.yml` has a `name` key:
 * - Anchor, scored `2` (below the emission floor of 3, so it never emits
 *   alone): `antora-component-descriptor` (`antora.yml`). Antora matches the
 *   exact path at the content source root and never searches above it, so its
 *   folder is the owner anchor. 96.6% of folders are real, but descriptor
 *   folders with no module content were real only 46% of the time (25 of 54):
 *   workflow files, Spring build-time copies under `antora-resources/` and
 *   empty stubs.
 * - Gate companion, scored `2`: `antora-module-pages`
 *   (`modules/<module>/pages/**.adoc`), beside 95.6% of real folders and 1.9%
 *   of the others.
 * - Support, scored `1` each: `antora-module-nav` (`modules/<m>/nav*.adoc`;
 *   85.9% against 0%), `antora-root-index` (`modules/ROOT/pages/index.adoc`;
 *   70.8% against 0%), `antora-module-partials` (`partials/` or
 *   `pages/_partials/`; 38.9% against 0%) and `antora-module-media`
 *   (`images/` or `attachments/`, with or without `assets/`; 56.9% against
 *   0%). Nav, partials and media also open the gate, so a component with no
 *   pages still emits. With no anchor an orphan support file never emits.
 * - Deliberately not scored: playbook files (27.1% against 9.6%; the playbook
 *   lives at the site root, so its owner would be `.`, not the component),
 *   `site.yml`, `supplemental-ui/`, `antora-assembler.yml` and the module
 *   `examples` family (the shared exclusion already rejects every `examples`
 *   folder).
 */
const ANTORA_DOCUMENTATION_SIGNAL_SCORES = {
  'antora-component-descriptor': 2,
  'antora-module-pages': 2,
  'antora-module-nav': 1,
  'antora-root-index': 1,
  'antora-module-partials': 1,
  'antora-module-media': 1,
} as const;

type AntoraDocumentationSignal =
  keyof typeof ANTORA_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Adds a `Documentation` candidate for Antora documentation components.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `Antora` and related technology `Node.js` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder (`excludingNonDocumentationFolders`), at any depth. A
 * support file under such a folder contributes no signal, score or evidence,
 * so a fixture component cannot feed the owner of the real one. The MkDocs,
 * Docusaurus and mdBook extra folder lists are not applied: they removed no
 * descriptor that the gate does not already drop, and `archive*` would hide 33
 * real versioned copies.
 *
 * Gate: `antora-component-descriptor` and at least one of pages, nav,
 * partials or media. The descriptor alone lets in 29 non-components (4
 * workflows named `antora.yml`, 24 Spring build-time copies and 1 stub); the
 * pair kept 96.9% of real components (790 of 815) and let in none. Pages alone
 * would have no anchor to resolve an owner from.
 *
 * Owner: `resolveUnitRootOwner`, with the descriptor as the anchor signal. The
 * descriptor owns its own directory (`.` at the repo root, `src/main/antora`
 * for a Maven layout), never `modules/ROOT` and never the parent of `src`,
 * because that folder is the content source root. Every support file resolves
 * to the longest non-root descriptor directory that encloses it, so a nested
 * component keeps its own files, and sibling components are never folded. A
 * root descriptor claims the `modules/` families beneath it (the
 * native-platform resolver would send them to a `modules/<name>` owner). A
 * support file that no descriptor encloses resolves through the generic
 * fallback to a folder with no descriptor, which fails the gate and is
 * dropped.
 *
 * Limitations:
 * - Path-only: `antora.yml` is not read, so a repository with Antora content
 *   but no descriptor is invisible, as are 18 empty descriptors and the 4
 *   Antora 3.2 implicit-ROOT layouts that put pages beside the descriptor.
 * - There is no cap on owners: one surveyed repository emits 37 versioned
 *   copies.
 * - The shared list also hides real fixture components (9 of the 10 hidden
 *   descriptor folders in the survey).
 * - A DocFX project inside a component does not share its owner, so both
 *   detectors keep their own candidate.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addAntoraDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<AntoraDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'Antora',
    relatedTechs: ['Node.js'],
    signalScores: ANTORA_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'antora-component-descriptor',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?antora\.yml`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'antora-module-pages',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?modules/[^/]+/pages/.+\.adoc`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'antora-module-nav',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?modules/[^/]+/nav(?:-[^/]*)?\.adoc`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        // Paths are lowercased by `normalizePath`, so `ROOT` matches as `root`.
        signalType: 'antora-root-index',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?modules/root/pages/index\.adoc`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'antora-module-partials',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?modules/[^/]+/(?:pages/_partials|partials)/.+`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'antora-module-media',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?modules/[^/]+/(?:assets/)?(?:images|attachments)/.+`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'antora-component-descriptor',
          hasOneOf: [
            'antora-module-pages',
            'antora-module-nav',
            'antora-module-partials',
            'antora-module-media',
          ],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
