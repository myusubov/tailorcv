import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingVitePressNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only VitePress signal contract, from a GitHub-tree survey of 568
 * repositories (361 `.vitepress` folders after the exclusions, 360 of them real
 * sites; code search for config names, `topic:vitepress` and the topics of
 * other documentation tools; search-biased, tuned and checked on the same
 * sample, with no held-out set). A folder counts as real when its
 * `.vitepress` holds a config, a theme or other source, and not only generated
 * `cache/` or `dist/` output:
 * - Anchor, scored `2` (below the emission floor of 3, so it never emits
 *   alone): `vitepress-directory`, the `.vitepress` directory entry itself.
 *   VitePress treats the folder that holds it as the site root and the name is
 *   unique to the tool (0 of 216 repositories of other documentation tools).
 *   The owner is its parent, not `.vitepress`.
 * - Gate companions: `vitepress-config-file`, scored `2`
 *   (`.vitepress/config.mjs|js|ts|mts` or `.vitepress/config/index.*`, the set
 *   the 2.0 alpha loader tries; 99.7% of real folders), and
 *   `vitepress-theme`, scored `1` (`.vitepress/theme/**`; 80.3%), which keeps
 *   the config-less site since the config is optional.
 * - Support, scored `1` each, never opens the gate: `vitepress-modules`
 *   (other `.vitepress/` source, such as navigation, sidebar and components,
 *   excluding `cache`, `dist`, `theme`, `.temp` and `config*`; 38.9%) and
 *   `vitepress-data-loader` (`*.data.*` and `*.paths.*` loaders; 15.5%). With
 *   no anchor an orphan support file never emits.
 * - Scores of the 360 real folders: 65 at 4 (confidence 0.67), 145 at 5
 *   (0.83) and 150 at 6 or more (1.00).
 * - Deliberately not scored: `index.md` (96.9% against 35.2%, every
 *   documentation tool has one), `docs/**.md` (49.2% against 58.3%, an
 *   inverse signal), `public/**`, `package.json`, the generated
 *   `.vitepress/cache|dist/**` and `.vitepress/theme/*.css` (a subset of the
 *   theme signal).
 */
const VITEPRESS_DOCUMENTATION_SIGNAL_SCORES = {
  'vitepress-directory': 2,
  'vitepress-config-file': 2,
  'vitepress-theme': 1,
  'vitepress-modules': 1,
  'vitepress-data-loader': 1,
} as const;

type VitePressDocumentationSignal =
  keyof typeof VITEPRESS_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Adds a `Documentation` candidate for VitePress documentation sites.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `VitePress` and related technology `Vue` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder, and under a `templates?`, `template-*`, `playground` or
 * `.playground` folder (`excludingVitePressNonDocumentationFolders`), at any
 * depth. A
 * support file under such a folder contributes no signal, score or evidence,
 * so a scaffold or demo site cannot feed the owner of the real one. The
 * MkDocs, Docusaurus and mdBook extra names had zero hits among the surveyed
 * `.vitepress` folders and are not applied.
 *
 * Gate: `vitepress-directory` and at least one of `vitepress-config-file` or
 * `vitepress-theme`. The directory alone lets in a folder that holds only Vite
 * cache output (1 of 360 in the survey); the config alone loses the site whose
 * config has another name next to a theme; the theme alone loses 73 config-only
 * sites. The pair finds all 360 real folders and lets in none.
 *
 * Owner: `resolveUnitRootOwner`, with the `.vitepress` directory as the anchor
 * signal. The directory owns its parent (`.` at the repo root, `docs` for
 * `docs/.vitepress`), never `src`, never the nearest `package.json` folder and
 * never truncated to `apps/<name>`, because that parent is the VitePress root.
 * Every support file resolves to the longest non-root anchor directory that
 * encloses it, so a nested site keeps its own files, and sibling sites are
 * never folded. A support file that no non-root anchor encloses belongs to a
 * root anchor when there is one, and otherwise resolves through the generic
 * fallback to a folder with no `.vitepress`, which fails the gate and is
 * dropped.
 *
 * Limitations:
 * - Path-only: neither the config text nor `srcDir` is read, which does not
 *   matter because the owner is the `.vitepress` parent, not the pages folder.
 *   A site whose `.vitepress` is not committed is invisible.
 * - The shared and VitePress lists hide real plugin and theme demo sites and
 *   leave 4 of 352 surveyed repositories with nothing to emit; the template and
 *   playground names rest on 4 and 3 folders.
 * - A VitePress site may also yield a Vue `Frontend app` candidate at the same
 *   owner; reconciliation only compares candidates of the same area name, and
 *   the overlap was not measured.
 * - There is no cap on owners.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addVitePressDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<VitePressDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'VitePress',
    relatedTechs: ['Vue'],
    signalScores: VITEPRESS_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'vitepress-directory',
        regex: excludingVitePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vitepress`,
        ),
        indexMethod: 'findDirectoriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'vitepress-config-file',
        regex: excludingVitePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vitepress/config(?:/index)?\.(?:mjs|js|ts|mts)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vitepress-theme',
        regex: excludingVitePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vitepress/theme/.+`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vitepress-modules',
        regex: excludingVitePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vitepress/(?!cache/|dist/|theme/|\.temp/|config(?:/|\.))[^/]+(?:/.+|\.(?:mjs|js|ts|mts|vue|json))`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vitepress-data-loader',
        regex: excludingVitePressNonDocumentationFolders(
          String.raw`(?:.*/)?[^/]+\.(?:data|paths)\.(?:mjs|js|ts|mts)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'vitepress-directory',
          hasOneOf: ['vitepress-config-file', 'vitepress-theme'],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
