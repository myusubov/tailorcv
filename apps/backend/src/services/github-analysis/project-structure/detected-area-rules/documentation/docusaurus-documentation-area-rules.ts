import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingDocusaurusNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only Docusaurus signal contract, from a GitHub-tree survey of 2,413
 * repositories (2,181 with a raw `docusaurus.config.*`; topic search, code
 * search and named projects; search-biased, tuned and checked on the same
 * sample, with no held-out set):
 * - Anchor, scored `3` (the emission floor): `docusaurus-config-file`
 *   (`docusaurus.config.` plus `js`, `ts`, `mjs`, `cjs`, `mts` or `cts`, the
 *   complete set Docusaurus itself loads). The site folder always holds it, so
 *   it is both the gate and the owner anchor. A trailing extension match skips
 *   `docusaurus.config.js.mdx` (an API page copied into versioned folders) and
 *   `docusaurus.config.localized.json`.
 * - Support, scored `1` each, never opens the gate:
 *   `docusaurus-sidebars-file` (`sidebars.*`, `sidebar-*.js`, a file named
 *   `sidebar*` inside a `sidebars/` folder; beside 96.5% of anchors),
 *   `docusaurus-docs-content` (`docs/**.md` or `.mdx`; 89.7%),
 *   `docusaurus-blog-content` (`blog/**.md` or `.mdx`; 35.4%),
 *   `docusaurus-i18n-locale` (`i18n/<locale>/docusaurus-plugin-content-*` or
 *   `docusaurus-theme-classic`; 13.1%) and `docusaurus-versioning`
 *   (`versions.json`, `versioned_docs/`, `versioned_sidebars/`, with an
 *   optional `<id>_` prefix for multi-instance sites such as airbyte's
 *   `platform_versioned_docs/`; 10.8%). With no anchor an orphan support file
 *   never emits.
 * - Deliberately not scored, because they are generic: `package.json`,
 *   `static/`, `src/pages/`, `tsconfig.json` and `babel.config.js`.
 */
const DOCUSAURUS_DOCUMENTATION_SIGNAL_SCORES = {
  'docusaurus-config-file': 3,
  'docusaurus-sidebars-file': 1,
  'docusaurus-docs-content': 1,
  'docusaurus-blog-content': 1,
  'docusaurus-i18n-locale': 1,
  'docusaurus-versioning': 1,
} as const;

type DocusaurusDocumentationSignal =
  keyof typeof DOCUSAURUS_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Adds a `Documentation` candidate for Docusaurus documentation sites.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `Docusaurus` and related technology `React` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder, under the Docusaurus-only template, sample, starter and
 * generated-cache (`.docusaurus`) folders
 * (`excludingDocusaurusNonDocumentationFolders`), at any depth. A support file
 * under such a folder contributes no signal, score or evidence, so a fixture
 * cannot feed the owner of the real site.
 *
 * Gate: `docusaurus-config-file` alone. Required even though it scores exactly
 * the emission floor, because `sidebars`, `docs` and `blog` content alone reach
 * the floor and the engine's fallback owner would resolve them to `.` (9 of
 * 232 anchorless repositories in the survey). Content beside the config is not
 * part of the gate: in 4.6% of repositories the Markdown sits only in a
 * repo-root `docs/` (jest, redux, babel, prettier, react-native-website).
 *
 * Owner: `resolveUnitRootOwner`, with the config as the anchor signal. The
 * config owns its own directory (`.` at the repo root), never the parent and
 * never truncated to `apps/<name>`, because Docusaurus requires the config in
 * the site folder and resolves `sidebarPath`, `i18n` and `versioned_*` from
 * there. Every support file resolves to the longest non-root anchor directory
 * that encloses it, so a nested site keeps its own files. Sibling sites are not
 * folded: each config folder is its own candidate. A support file that no
 * non-root anchor encloses belongs to a root config when there is one, and
 * otherwise (a repo-root `docs/` beside `website/`) resolves through the
 * generic fallback to a folder with no anchor, which fails the gate and is
 * dropped.
 *
 * Limitations:
 * - Path-only: the content `path`, `sidebarPath`, plugin ids and `--config`
 *   are not read, so a renamed config or a site run with `--config` is
 *   invisible, and a repo-root `docs/` stays outside the candidate (the area
 *   path `website` does not contain it, and the content is not evidence).
 * - A root-level starter repo cannot be told from a real site
 *   (`daggerok/docusaurus-examples`: `01-getting-starter/docusaurus.config.js`).
 *   Template-like repo names are at most 2.4% of emitting repositories.
 * - A repo that commits `.docusaurus/` without its real config (0.5%) emits
 *   nothing.
 * - A root config (`.`) encloses every path in `resolveUnitRootOwner`, so a
 *   root site's support files (including `docs/src/intro.md` and
 *   `packages/guide/docs/intro.md`) resolve to `.`. A support file that no
 *   anchor encloses takes the generic fallback owner. The `android`/`ios` and
 *   `metro.config` path shapes belong to
 *   `resolveNativePlatformUnitRootOwner`, which this detector does not use.
 * - About 2% of emitting repositories hold two or more sites
 *   (`website/api`, `website/docs`, `website/integrations`) and each emits its
 *   own candidate.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addDocusaurusDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<DocusaurusDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'Docusaurus',
    relatedTechs: ['React'],
    signalScores: DOCUSAURUS_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'docusaurus-config-file',
        regex: excludingDocusaurusNonDocumentationFolders(
          String.raw`(?:.*/)?docusaurus\.config\.[cm]?[jt]s`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'docusaurus-sidebars-file',
        regex: excludingDocusaurusNonDocumentationFolders(
          String.raw`(?:.*/)?sidebars?[\w.-]*\.(?:[cm]?[jt]s|json)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'docusaurus-docs-content',
        regex: excludingDocusaurusNonDocumentationFolders(
          String.raw`(?:.*/)?docs/.+\.mdx?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'docusaurus-blog-content',
        regex: excludingDocusaurusNonDocumentationFolders(
          String.raw`(?:.*/)?blog/.+\.mdx?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'docusaurus-i18n-locale',
        regex: excludingDocusaurusNonDocumentationFolders(
          String.raw`(?:.*/)?i18n/[\w-]+/docusaurus-(?:plugin-content-(?:docs|blog|pages)(?:-[\w-]+)?|theme-classic)/.+`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'docusaurus-versioning',
        regex: excludingDocusaurusNonDocumentationFolders(
          String.raw`(?:.*/)?(?:[\w-]+_)?(?:versions\.json|versioned_(?:docs|sidebars)/.+)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'docusaurus-config-file',
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
