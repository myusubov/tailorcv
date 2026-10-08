import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only Fumadocs signal contract, from a GitHub-tree survey of 530
 * repositories (432 candidate folders after the shared exclusion, 321 of them
 * real Fumadocs sites; code search for `fumadocs-core` in `package.json` plus
 * 280 baseline repositories; search-biased, tuned and checked on the same
 * sample, with no held-out set). A folder counts as real when a `package.json`
 * within two ancestor hops declares a `fumadocs-*` dependency and a host
 * framework, so precision is a lower bound:
 * - Anchor, scored `3` (the emission floor): `fumadocs-config-file`
 *   (`source.config.ts` or `.mts`). `fumadocs-mdx` resolves the file and its
 *   `.source/` output from the working directory, so its folder is both the
 *   gate and the owner anchor. Beside 87.5% of real candidate folders against
 *   5.4% elsewhere; 97.9% of the folders it matches are real. `js` and `mjs`
 *   are left out: 1 real hit against 2 elsewhere, mostly a compiled
 *   `.source/source.config.mjs` copy.
 * - Support, scored `1` each, never opens the gate: `fumadocs-docs-meta`
 *   (`content/docs/**\/meta.json`, locale variants included; 72.3% against
 *   4.5%), `fumadocs-source-loader` (`lib/source.ts` or `app/source.ts`;
 *   86.3% against 4.5%) and `fumadocs-docs-route` (the Next.js catch-all
 *   `app/docs/[[...slug]]/page.tsx`, with an optional locale segment; 59.8%
 *   against 9.0%). With no anchor an orphan support file never emits. The
 *   maximum score is 6, so confidence runs from 0.50 to 1.00.
 * - Deliberately not scored: `content/docs/**.md(x)` pages (81.9% against
 *   89.2%, no lift; shared with Starlight, Contentlayer, Mintlify and Nextra),
 *   `content/docs/index.md(x)` (63.9% against 76.6%), `mdx-components.tsx`
 *   (67.6% against 11.7%), `layout.shared.tsx` (62.0% against 0.9%) and
 *   `app/api/search/route.ts` (65.1% against 0.9%; strong but redundant once
 *   three supports reach the cap), `app/llms*` and `app/og/docs/**`, the
 *   generated `.source/*` and `cli.json`. `src/content/docs` is an inverse
 *   signal (2.2% against 62.2%, mostly Starlight sites).
 */
const FUMADOCS_DOCUMENTATION_SIGNAL_SCORES = {
  'fumadocs-config-file': 3,
  'fumadocs-docs-meta': 1,
  'fumadocs-source-loader': 1,
  'fumadocs-docs-route': 1,
} as const;

type FumadocsDocumentationSignal =
  keyof typeof FUMADOCS_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Adds a `Documentation` candidate for Fumadocs documentation sites.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `Fumadocs` and related technology `React` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder (`excludingNonDocumentationFolders`), at any depth. A
 * support file under such a folder contributes no signal, score or evidence,
 * so an example site cannot feed the owner of the real one. The MkDocs,
 * Docusaurus and mdBook extra folder lists are not applied: they would drop
 * 3 to 4 config folders each, all real sites (generated-project `templates/`
 * copies and a `playground/`), and no non-Fumadocs folder.
 *
 * Gate: `fumadocs-config-file` alone. Content folders carry names that other
 * tools share and a companion alone has no owner anchor (`content/docs` pages
 * alone are only 72.7% precise, because 67 of the 99 elsewhere hits are
 * Starlight sites). The anchor kept 87.5% of real candidate folders and let in
 * 6 Next.js sites with a leftover config.
 *
 * Owner: `resolveUnitRootOwner`, with the config as the anchor signal. The
 * config owns its own directory (`.` at the repo root), never `src` and never
 * truncated to `apps/<name>`, because that folder is where the host framework
 * runs. Every support file resolves to the longest non-root config directory
 * that encloses it, so a nested site keeps its own files, and sibling sites
 * are never folded. A support file that no non-root config encloses belongs
 * to a root config when there is one, and otherwise resolves through the
 * generic fallback to a folder with no config, which fails the gate and is
 * dropped.
 *
 * Limitations:
 * - Path-only: `source.config.ts` is the only distinctive name, so a site
 *   built on the config-less macro API (fumadocs-mdx 15.2.0 and later; 40 real
 *   candidate folders in the survey) is invisible.
 * - A Next.js project with a leftover `source.config.ts` and no Fumadocs
 *   dependency emits at confidence 0.50.
 * - A Fumadocs site also yields a `Frontend app` candidate for its host
 *   framework at the same owner (259 of 281 real config folders hold a
 *   `next.config.*`); reconciliation only compares candidates of the same area
 *   name.
 * - The shared list hides 38 real candidate folders in 2 repositories, all
 *   under `examples/`.
 * - There is no cap on owners.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addFumadocsDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<FumadocsDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'Fumadocs',
    relatedTechs: ['React'],
    signalScores: FUMADOCS_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'fumadocs-config-file',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?source\.config\.m?ts`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'fumadocs-docs-meta',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?content/docs/(?:.+/)?meta(?:\.[a-z-]+)?\.(?:json|ya?ml)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'fumadocs-source-loader',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?(?:lib|app)/source\.tsx?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'fumadocs-docs-route',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?app/(?:\[lang\]/|\[locale\]/)?docs/(?:\[\[\.\.\.\w+\]\]|\[\.\.\.\w+\])/page\.tsx`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'fumadocs-config-file',
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
