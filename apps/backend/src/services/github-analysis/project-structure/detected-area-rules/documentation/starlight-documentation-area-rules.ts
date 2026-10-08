import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only Starlight signal contract, from a GitHub-tree survey of 1,499
 * repositories (1,540 candidate folders, 1,007 real Starlight folders after
 * the shared exclusion; code search, topic search and named projects;
 * search-biased, tuned and checked on the same sample, with no held-out set).
 * A folder counts as real when its `astro.config` or `package.json` names
 * `@astrojs/starlight`:
 * - Anchor, scored `2` (below the emission floor of 3, so it never emits
 *   alone): `starlight-config-file` (`astro.config.` plus `mjs`, `js`, `ts` or
 *   `mts`, the complete set Astro loads, from the project root only). The name
 *   belongs to every Astro site, and the `starlight()` call lives inside the
 *   file, which paths cannot read. Used alone it was a Starlight project in
 *   5.1% of folders drawn from the generic Astro topic. It is the owner anchor.
 * - Gate companion, scored `2`: `starlight-docs-content`
 *   (`src/content/docs/**` with a Markdown extension Starlight's `docsLoader`
 *   reads), beside 93.5% of real folders and 3.7% of the others.
 * - Support, scored `1` each, never opens the gate: `starlight-docs-index`
 *   (`src/content/docs/index.md|mdx`; 78.2% against 0.9%),
 *   `starlight-custom-css` (`src/styles|css/*custom*.css`; 32.2% against 0%),
 *   `starlight-i18n` (`src/content/i18n/*.json|yml|yaml` or any two- or
 *   three-letter folder under `src/content/docs/`, which covers locale folders
 *   but also matches `api/` or `cli/`; 30.0% against 2.0%, measured with this
 *   same pattern) and
 *   `starlight-template-asset` (`src/assets/houston.webp`; 26.0% against 0%).
 *   With no anchor an orphan support file never emits.
 * - Deliberately not scored: `src/content.config.ts` and
 *   `src/content/config.ts` (98.2% against 44.1%), Starlight component
 *   override names (31.3% against 39.5%), `public/favicon.svg` (68.5% against
 *   58.2%), `src/pages/**` (32.2% against 96.3%, an inverse signal), `ec.config.*`,
 *   the template's `guides|reference/example.md` pages, `markdoc.config.*` and
 *   `route-middleware.*`.
 */
const STARLIGHT_DOCUMENTATION_SIGNAL_SCORES = {
  'starlight-config-file': 2,
  'starlight-docs-content': 2,
  'starlight-docs-index': 1,
  'starlight-custom-css': 1,
  'starlight-i18n': 1,
  'starlight-template-asset': 1,
} as const;

type StarlightDocumentationSignal =
  keyof typeof STARLIGHT_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Adds a `Documentation` candidate for Astro Starlight documentation sites.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `Starlight` and related technology `Astro` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder (`excludingNonDocumentationFolders`), at any depth. A
 * support file under such a folder contributes no signal, score or evidence,
 * so a fixture site cannot feed the owner of the real one. The MkDocs,
 * Docusaurus and mdBook extra folder lists are not applied: beyond the shared
 * list they removed no non-Starlight folder, and every `templates`,
 * `playground`, `wiki`, `.github` and suffix-named hit was a real project.
 *
 * Gate: `starlight-config-file` and `starlight-docs-content`. The config alone
 * is every Astro site; the docs content alone also matches other tools that
 * keep pages in `src/content/docs` (Fumadocs) and has no anchor to resolve an
 * owner from. On the survey the pair kept 93.5% of real folders and let in
 * 1.4% non-Starlight ones (custom Astro docs sites with their own `docs`
 * collection, where the area is right and only the label is wrong).
 *
 * Owner: `resolveUnitRootOwner`, with the config as the anchor signal. The
 * config owns its own directory (`.` at the repo root), never `src` and never
 * truncated to `apps/<name>`, because Astro runs from, and loads its config
 * from, that folder. Every support file resolves to the longest non-root
 * config directory that encloses it, so a nested site keeps its own files.
 * Sibling sites are not folded: each config folder is its own candidate. A
 * support file that no non-root config encloses belongs to a root config when
 * there is one, and otherwise resolves through the generic fallback to a
 * folder with no config, which fails the gate and is dropped.
 *
 * Limitations:
 * - Path-only: `astro.config` is not read, so a custom `srcDir` (12 of 1,098
 *   surveyed real configs) moves the content out of sight and the project is
 *   invisible, as is a project whose pages are generated or untracked.
 * - A custom Astro docs site with its own `docs` collection and no Starlight
 *   cannot be told apart from paths and gets the `Starlight` label.
 * - A Starlight site also yields a `Frontend app` Astro candidate at the same
 *   owner; reconciliation only compares candidates of the same area name.
 * - The shared list also hides real Starlight plugin test and example sites
 *   (76 gate-passing folders in the survey, 8 repositories left with nothing
 *   to emit).
 * - A config nested inside a content folder emits a candidate of its own.
 * - There is no cap on owners.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addStarlightDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<StarlightDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'Starlight',
    relatedTechs: ['Astro'],
    signalScores: STARLIGHT_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'starlight-config-file',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?astro\.config\.(?:mjs|js|ts|mts)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'starlight-docs-content',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?src/content/docs/.+\.(?:mdx?|mdoc|markdown|mdown|mkdn|mkd|mdwn)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'starlight-docs-index',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?src/content/docs/index\.mdx?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'starlight-custom-css',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?src/(?:styles|css)/[^/]*custom[^/]*\.css`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'starlight-i18n',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?src/content/(?:i18n/[^/]+\.(?:json|ya?ml)|docs/[a-z]{2,3}(?:-[a-z0-9]+)?/.+)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'starlight-template-asset',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?src/assets/houston\.webp`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasAllOf: ['starlight-config-file', 'starlight-docs-content'],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
