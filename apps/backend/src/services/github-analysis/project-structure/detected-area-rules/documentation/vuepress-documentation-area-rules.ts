import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingVuePressNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only VuePress signal contract (v1 and v2), from a GitHub-tree survey of
 * 585 repositories (404 real `.vuepress` folders after the exclusions among 412
 * candidates; topic and code searches plus 135 repositories of other
 * documentation tools as the look-alike baseline; search-biased, tuned and
 * checked on the same sample, with no held-out set):
 * - Anchor, scored `2` (below the emission floor of 3, so it never emits
 *   alone): `vuepress-dir`, the `.vuepress` directory entry itself. It always
 *   sits in the source folder, whatever that folder is called, so its parent is
 *   the owner and a custom source folder is not a miss. The name appeared in 0
 *   of 135 repositories of other documentation tools. A folder that holds only
 *   `dist`, `.cache` or `.temp` stays under the floor.
 * - Support, never opens the gate by itself: `vuepress-config-file`, scored
 *   `2` (`.vuepress/config.js|ts|mjs|yml|toml`, the names v1 and v2 load;
 *   92.1% of real folders), and scored `1` each `vuepress-public` (78.2%),
 *   `vuepress-styles` (51.2%), `vuepress-components` (`*.vue`; 32.9%),
 *   `vuepress-theme-files` (`theme|navbar|sidebar.ts|js`, the theme-hope
 *   convention; 25.2%), `vuepress-v1-markers` (`enhanceApp.js` and a local
 *   `theme/`; 22.8%) and `vuepress-client-file` (`client.ts|js|mjs`, the v2
 *   client config; 16.8%). Each sits beside 0% of other-tool repositories. With
 *   no anchor an orphan support file never emits.
 * - Emitted scores of the 402 folders: 15 at 3, 49 at 4, 80 at 5 and 258 at 6
 *   or more (confidence 0.50 to 1.00).
 * - Deliberately not scored: the root `vuepress.config.*` (it resolves to a
 *   different owner than the `.vuepress` parent in 14 sites), committed
 *   `.vuepress/dist|.temp|.cache` output, author-named folders
 *   (`configs|plugins|layouts|utils`), `readme.md` or `index.md` (94.8% against
 *   209 of 215 repositories), any Markdown, and `package.json` (an inverse
 *   signal, since the source folder is usually a subfolder).
 */
const VUEPRESS_DOCUMENTATION_SIGNAL_SCORES = {
  'vuepress-dir': 2,
  'vuepress-config-file': 2,
  'vuepress-public': 1,
  'vuepress-styles': 1,
  'vuepress-components': 1,
  'vuepress-theme-files': 1,
  'vuepress-v1-markers': 1,
  'vuepress-client-file': 1,
} as const;

type VuePressDocumentationSignal =
  keyof typeof VUEPRESS_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Adds a `Documentation` candidate for VuePress documentation sites.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `VuePress` and related technology `Vue` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder, and under a `templates?` folder
 * (`excludingVuePressNonDocumentationFolders`), at any depth. A support file
 * under such a folder contributes no signal, score or evidence, so a scaffold
 * or example site cannot feed the owner of the real one. The MkDocs,
 * Docusaurus and mdBook extra names hit no non-site and are not applied.
 *
 * Gate: `vuepress-dir` alone. The anchor scores 2, so the emission floor of 3
 * supplies the companion: one more file under `.vuepress` is required, which
 * keeps the generated-output-only folders out. Requiring the config file would
 * lose 47 of 419 real sites (config in the root `vuepress.config.*` or in a
 * theme-hope style file).
 *
 * Owner: `resolveUnitRootOwner`, with the `.vuepress` directory as the anchor
 * signal. The directory owns its parent (`.` at the repo root, `docs` for
 * `docs/.vuepress`), never `src` and never truncated to `packages/<name>`,
 * because that parent is the VuePress source folder. Every support file
 * resolves to the longest non-root anchor directory that encloses it, so a
 * nested site keeps its own files, and sibling sites are never folded. A
 * support file that no non-root anchor encloses belongs to a root anchor when
 * there is one, and otherwise resolves through the generic fallback to a
 * folder with no `.vuepress`, which fails the gate and is dropped.
 *
 * Limitations:
 * - Path-only: a v2 project that keeps only a root `vuepress.config.*` and
 *   passes the source folder on the command line has no `.vuepress` and is
 *   invisible (15 of 419 real sites). Adding the root config as a second anchor
 *   finds them but makes 14 sites emit twice (`.` and `docs`).
 * - The shared list hides real theme and plugin test and demo sites (93 of 505
 *   `.vuepress` folders), leaving 12 repositories with nothing to emit.
 * - A committed `.vuepress/templates/` folder is rejected by the template
 *   exclusion; only the v1 HTML templates beneath it are lost.
 * - There is no cap on owners.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addVuePressDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<VuePressDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'VuePress',
    relatedTechs: ['Vue'],
    signalScores: VUEPRESS_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'vuepress-dir',
        regex: excludingVuePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vuepress`,
        ),
        indexMethod: 'findDirectoriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'vuepress-config-file',
        regex: excludingVuePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vuepress/config\.(?:js|ts|mjs|yml|toml)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vuepress-public',
        regex: excludingVuePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vuepress/public/.+`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vuepress-styles',
        regex: excludingVuePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vuepress/styles/.+`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vuepress-components',
        regex: excludingVuePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vuepress/components/.+\.vue`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vuepress-theme-files',
        regex: excludingVuePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vuepress/(?:theme|navbar|sidebar)\.(?:ts|js)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        // Paths are lowercased by `normalizePath`, so `enhanceApp.js` matches
        // as `enhanceapp.js`. The v1 `templates/*.html` files the survey also
        // counted sit under a `templates` folder, which the exclusion rejects.
        signalType: 'vuepress-v1-markers',
        regex: excludingVuePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vuepress/(?:enhanceapp\.js|theme/.+)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vuepress-client-file',
        regex: excludingVuePressNonDocumentationFolders(
          String.raw`(?:.*/)?\.vuepress/client\.(?:ts|js|mjs)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'vuepress-dir',
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
