import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only Dumi (2.x) signal contract, from a GitHub-tree survey of 640
 * repositories (283 `.dumirc` folders after the shared exclusion, 230
 * repositories; 340 drawn for Dumi, 250 other documentation and component
 * library repositories and 50 Umi apps as the baseline; search-biased, tuned
 * and checked on the same sample, with no held-out set). A folder counted as
 * real when the nearest `package.json` lists a dumi package:
 * - Anchor, scored `3` (the emission floor): `dumi-config-file`
 *   (`.dumirc.ts` or `.dumirc.js`, the only two names Dumi 2 lists). Dumi reads
 *   it from the working directory and never searches above it, so its folder
 *   is both the gate and the owner anchor. 280 of 283 folders were real
 *   projects (the other 3 are one stray nocobase `plugin-mobile` config in 3
 *   forks), and none of 299 repositories without it had a `.dumirc` file.
 * - Support, never opens the gate: `dumi-local-dir`, scored `2` (the
 *   documented customisation names under `.dumi/`: `theme`, `pages`, `global`,
 *   `overrides`, `app`, `loading`, `favicon`; 30.7% against 0.3%), and scored
 *   `1` each `dumi-father-config` (`.fatherrc` with an optional `ts|js|json`
 *   extension, the library build tool Dumi templates ship beside it; 70.3%
 *   against 3.0%), `dumi-docs-index` (`docs/index.md`, locale suffix allowed;
 *   84.1% against 15.1%, so only +1) and `dumi-component-doc`
 *   (`src/<name>/index.md`, the default `atomDirs` shape; 25.8% against 2.3%).
 *   With no anchor an orphan support file never emits.
 * - Deliberately not scored: `docs/**.md` (95.1% against 45.2%, shared with
 *   every documentation tool), demo files under `demo/` or `demos/` (20.5%
 *   against 0.3%, but the shared exclusion removes every such path so it could
 *   never match), `.umirc.*` and `config/config.*` (the Dumi 1.x names, shared
 *   with every Umi app), locale-suffixed pages and the generated `.dumi/tmp*`.
 */
const DUMI_DOCUMENTATION_SIGNAL_SCORES = {
  'dumi-config-file': 3,
  'dumi-local-dir': 2,
  'dumi-father-config': 1,
  'dumi-docs-index': 1,
  'dumi-component-doc': 1,
} as const;

type DumiDocumentationSignal = keyof typeof DUMI_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Adds a `Documentation` candidate for Dumi documentation sites.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `Dumi` and related technology `React` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder (`excludingNonDocumentationFolders`), at any depth. A
 * support file under such a folder contributes no signal, score or evidence,
 * so an example site cannot feed the owner of the real one. The MkDocs,
 * Docusaurus and mdBook extra folder lists are not applied: they would hide 4
 * real sites (three `playground/` sites from one author and a `dumi-demo`) and
 * remove no non-Dumi folder.
 *
 * Gate: `dumi-config-file` alone. Every companion gate lost real projects (7
 * to 143 of 283; theme and component packages whose docs are demos only), and
 * a companion alone is unsafe: `docs/**.md` alone lets in 45.2% of the
 * repositories without a Dumi config.
 *
 * Owner: `resolveUnitRootOwner`, with the config as the anchor signal. The
 * config owns its own directory (`.` at the repo root), never `src` and never
 * truncated to `packages/<name>`, because that folder is where `dumi` runs.
 * Every support file resolves to the longest non-root config directory that
 * encloses it, so a nested project keeps its own files, and sibling projects
 * are never folded. A support file that no non-root config encloses belongs to
 * a root config when there is one, and otherwise resolves through the generic
 * fallback to a folder with no config, which fails the gate and is dropped.
 *
 * Limitations:
 * - Path-only: Dumi 1.x reads `.umirc.*` or `config/config.*`, the names every
 *   Umi app shares, so a 1.x site is invisible (57 of the 340 Dumi-drawn
 *   folders in the survey; `config/config.*` also has no usable owner here).
 * - A custom `docDirs` or `atomDirs` (ant-design keeps components in
 *   `components/`) thins the docs evidence, but the anchor still finds the
 *   project.
 * - A stray `.dumirc.ts` with no Dumi dependency emits at confidence 0.50.
 * - A Dumi library may also yield a React `Frontend app` candidate at the same
 *   owner; reconciliation only compares candidates of the same area name, and
 *   the overlap was not measured.
 * - The shared list also hides real example sites (9 Dumi theme and plugin
 *   repositories with no other site were left with nothing to emit).
 * - `.dumirc.js` was never searched for in the survey, so its rate is unknown.
 * - There is no cap on owners.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addDumiDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<DumiDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'Dumi',
    relatedTechs: ['React'],
    signalScores: DUMI_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'dumi-config-file',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?\.dumirc\.(?:ts|js)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'dumi-local-dir',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?\.dumi/(?:theme|pages|global|overrides|app|loading|favicon)[^/]*(?:/.+)?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'dumi-father-config',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?\.fatherrc(?:\.(?:ts|js|json))?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'dumi-docs-index',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?docs/index(?:\.[a-z]{2}(?:-[a-z0-9]+)?)?\.md`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'dumi-component-doc',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?src/[^/]+/index(?:\.[a-z]{2}(?:-[a-z0-9]+)?)?\.md`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'dumi-config-file',
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
