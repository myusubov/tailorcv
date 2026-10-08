import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only DocFX signal contract, from a GitHub-tree survey of 600
 * repositories (501 `docfx.json` folders after the shared exclusion, 485 of
 * them real DocFX projects; code search for the file name, `topic:docfx` and
 * baseline topic searches; search-biased, tuned and checked on the same
 * sample, with no held-out set). A folder counts as real when its
 * `docfx.json` parses with a `build` or `metadata` section:
 * - Anchor, scored `3` (the emission floor): `docfx-config-file`
 *   (`docfx.json`). DocFX loads it from the folder it runs in, never searches
 *   above that folder, and resolves every path inside it relative to the file,
 *   so its folder is both the gate and the owner anchor. 96.8% of anchor
 *   folders are real projects.
 * - Support, scored `1` each, never opens the gate: `docfx-toc`
 *   (`toc.yml|yaml|md`; 64.9% of real folders against 2.7% of repositories
 *   with no config), `docfx-articles` (`articles/**.md`; 16.1% against 1.1%)
 *   and `docfx-api-dir` (the `docfx init` and `metadata` output names under
 *   `api/`: `index.md`, `toc.yml|yaml`, `.gitignore`, `.manifest`; 21.6%
 *   against 1.1%). They lift confidence from 0.50 to 0.67 and up: at score 3
 *   92.4% of folders are real, at 4 98.6%, at 5 and 6 all of them. With no
 *   anchor an orphan support file never emits.
 * - Deliberately not scored: `index.md|yml` (62.9% against 10.8%, matches any
 *   docs folder), `images/**` (20.4% against 21%), `docs/**.md` (32.4% against
 *   29.6%), custom `*.tmpl.partial` templates, `.config/dotnet-tools.json`,
 *   `filterConfig.yml`, `xrefmap` files and committed `_site/` output.
 */
const DOCFX_DOCUMENTATION_SIGNAL_SCORES = {
  'docfx-config-file': 3,
  'docfx-toc': 1,
  'docfx-articles': 1,
  'docfx-api-dir': 1,
} as const;

type DocFxDocumentationSignal = keyof typeof DOCFX_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Adds a `Documentation` candidate for DocFX documentation projects.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `DocFX` and related technology `.NET` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder (`excludingNonDocumentationFolders`), at any depth. A
 * support file under such a folder contributes no signal, score or evidence,
 * so a fixture project cannot feed the owner of the real one. The MkDocs,
 * Docusaurus and mdBook extra folder lists are not applied: beyond the shared
 * list they removed at most one non-DocFX folder each and hid 2 to 10 real
 * projects.
 *
 * Gate: `docfx-config-file` alone. Every companion gate lost 28% to 35% of
 * real projects (metadata-only configs, projects with no `toc.yml`) to remove
 * only 12 to 13 of the 16 look-alikes, and a companion alone has no owner
 * anchor.
 *
 * Owner: `resolveUnitRootOwner`, with the config as the anchor signal. The
 * config owns its own directory (`.` at the repo root), never `docs`, never
 * `src` and never truncated to `apps/<name>`, because that folder is where
 * `docfx` runs. Every support file resolves to the longest non-root config
 * directory that encloses it, so a nested project keeps its own files, and
 * sibling projects are never folded. A support file that no non-root config
 * encloses belongs to a root config when there is one, and otherwise resolves
 * through the generic fallback to a folder with no config, which fails the
 * gate and is dropped.
 *
 * Limitations:
 * - Path-only: `docfx.json` is not read, so a renamed config
 *   (`docfx-build.json`, passed to `docfx` by path) and a config that is not
 *   committed leave the project invisible.
 * - Package-manager and data files that happen to be called `docfx.json`
 *   (Scoop buckets, conda, Homebrew, Wappalyzer rules; 16 of 501 survey
 *   folders) emit at confidence 0.50, the same as a bare real config.
 * - A metadata-only `docfx.json` beside a Docusaurus or Sphinx site emits both
 *   candidates on one folder; candidates are keyed by technology, so both are
 *   kept.
 * - `samples/` is not excluded, so sample projects emit.
 * - There is no cap on owners.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addDocFxDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<DocFxDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'DocFX',
    relatedTechs: ['.NET'],
    signalScores: DOCFX_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'docfx-config-file',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?docfx\.json`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'docfx-toc',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?toc\.(?:ya?ml|md)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'docfx-articles',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?articles/.+\.md`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'docfx-api-dir',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?api/(?:index\.md|toc\.ya?ml|\.gitignore|\.manifest)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'docfx-config-file',
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
