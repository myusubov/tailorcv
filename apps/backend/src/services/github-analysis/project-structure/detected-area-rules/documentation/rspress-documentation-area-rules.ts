import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only Rspress signal contract, from a GitHub-tree survey of 605
 * repositories (436 `rspress.config` folders, 428 of them real projects after
 * the shared exclusion; 438 repositories drawn for Rspress and 167 from six
 * other documentation tools as the baseline; search-biased, tuned and checked
 * on the same sample, with no held-out set, and the Rspress pool was selected
 * by the anchor's own file name, so its precision is partly by construction).
 * A folder counts as real when its config text mentions Rspress or its nearest
 * `package.json` depends on or runs it:
 * - Anchor, scored `3` (the emission floor): `rspress-config-file`
 *   (`rspress.config.js|ts|mjs|mts|cjs|cts`, the six names Rspress loads from
 *   the working folder). The name is unique to the tool (0 of 167 repositories
 *   of other documentation tools), so its folder is both the gate and the
 *   owner anchor.
 * - Support, scored `1` each, never opens the gate: `rspress-nav-meta`
 *   (`_meta.json` and `_nav.json`, the sidebar and navbar files; 73.6%
 *   against 2.4%, and Nextra shares `_meta.json`), `rspress-docs-content`
 *   (`docs/**.md|mdx`, the default doc root; 92.5% against 61.7%, weak lift
 *   kept because it proves the default layout), `rspress-i18n` (`i18n.json`
 *   or a `docs/<locale>/_nav.json`; 20.1% against 0%) and
 *   `rspress-template-asset` (the `docs/public/rspress-*` logos that
 *   `create-rspress` writes; 30.6% against 0%). With no anchor an orphan
 *   support file never emits.
 * - Emitted scores of the 428 owners: 16 at 3 (confidence 0.50), 98 at 4, 131
 *   at 5 and 183 at 6 or more, all of them real.
 * - Deliberately not scored: landing pages (`docs/index.md`; 82% against
 *   38.9%), `theme/index.*` (30.6% against 13.8%), `docs/**.tsx` pages and
 *   `env.d.ts` (no lift), `rstack.config.*` (shared by every Rstack tool) and
 *   the generated `doc_build/`.
 */
const RSPRESS_DOCUMENTATION_SIGNAL_SCORES = {
  'rspress-config-file': 3,
  'rspress-nav-meta': 1,
  'rspress-docs-content': 1,
  'rspress-i18n': 1,
  'rspress-template-asset': 1,
} as const;

type RspressDocumentationSignal =
  keyof typeof RSPRESS_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Adds a `Documentation` candidate for Rspress documentation sites.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `Rspress` and related technology `React` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder (`excludingNonDocumentationFolders`), at any depth. A
 * support file under such a folder contributes no signal, score or evidence,
 * so a fixture site cannot feed the owner of the real one. The MkDocs,
 * Docusaurus and mdBook extra folder lists are not applied: they hit no further
 * anchor.
 *
 * Gate: `rspress-config-file` alone. Every companion gate lost real sites or
 * let look-alikes in: requiring `docs/` content loses 32 real sites whose
 * pages sit outside `docs/` (a custom `root`), requiring a nav file loses 113,
 * and nav plus docs content without the anchor passes 5 wrong owners, 3 of
 * them Nextra or Fumadocs repositories.
 *
 * Owner: `resolveUnitRootOwner`, with the config as the anchor signal. The
 * config owns its own directory (`.` at the repo root), never `docs` and never
 * truncated to `apps/<name>`, because that folder is where `rspress` runs.
 * Every support file resolves to the longest non-root config directory that
 * encloses it, so a nested site keeps its own files, and sibling sites are
 * never folded. A support file that no non-root config encloses belongs to a
 * root config when there is one, and otherwise resolves through the generic
 * fallback to a folder with no config, which fails the gate and is dropped.
 *
 * Limitations:
 * - Path-only: a site run through the Rstack CLI (`rs doc` with
 *   `rstack.config.ts`) has no `rspress.config` and is invisible; the name
 *   `rstack.config.*` is shared by every Rstack tool, so it is not an anchor.
 * - A custom `root` moves the pages out of `docs/`, which only thins the
 *   content evidence; the project is still found.
 * - 4 of 428 surveyed owners hold another documentation tool's config in the
 *   same folder (VitePress 2, VuePress 1, mdBook 1), so both detectors emit
 *   there.
 * - An Rspress site also yields `Frontend app` candidates; reconciliation only
 *   compares candidates of the same area name.
 * - The shared list hides 8 real demo and test sites and leaves 6 repositories
 *   with nothing to emit.
 * - Rspress v1 behavior was not checked.
 * - There is no cap on owners.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addRspressDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<RspressDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'Rspress',
    relatedTechs: ['React'],
    signalScores: RSPRESS_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'rspress-config-file',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?rspress\.config\.[cm]?[jt]s`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'rspress-nav-meta',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?_(?:meta|nav)\.json`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rspress-docs-content',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?docs/.+\.mdx?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rspress-i18n',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?(?:i18n\.json|docs/[a-z]{2,3}(?:-[a-z0-9]+)?/_nav\.json)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rspress-template-asset',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?docs/public/rspress-[\w-]+\.(?:png|svg|jpe?g|webp)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'rspress-config-file',
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
