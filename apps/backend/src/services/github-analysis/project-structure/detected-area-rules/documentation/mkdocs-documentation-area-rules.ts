import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveManifestDirectoryOwner } from '../owner-adapters';
import { excludingMkDocsNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only MkDocs signal contract, from a GitHub-tree survey of 1,227
 * repositories that hold a `mkdocs.yml` or `mkdocs.yaml` (topic search, code
 * search and named projects; search-biased, tuned and checked on the same
 * sample, with no held-out set):
 * - Anchor, scored `3` (the emission floor): `mkdocs-config-file`
 *   (`mkdocs.yml`, `mkdocs.yaml`). The filename is exclusive to MkDocs and its
 *   forks, and it opens the gate alone, because requiring a companion would
 *   drop 15.7% of real repositories (every `docs_dir`-elsewhere layout). The
 *   13.7% of repositories whose only copies are workflows, templates, demos,
 *   test fixtures or vendored trees are removed by the folder exclusions
 *   instead (see `addMkDocsDocumentationAreas`).
 * - Support, which never opens the gate: `mkdocs-theme-overrides`
 *   (`overrides/*.html`, the Material `custom_dir`), scored `2`, found beside
 *   22.4% of anchors and 0.1% of non-MkDocs documentation repositories;
 *   `mkdocs-docs-assets` (`docs/stylesheets/` or `docs/javascripts/`),
 *   `mkdocs-docs-index` (`docs/index.md`, beside 78.6% of anchors but also 8.4%
 *   of the others) and `mkdocs-pages-file` (`.pages`, the awesome-pages
 *   plugin), scored `1` each. With no anchor an orphan support file never
 *   emits.
 * - Deliberately not scored: other markdown under `docs/`, `.readthedocs.yaml`
 *   (no signal, 6.4% against 7.5%), a docs requirements file, `docs/assets/`,
 *   `docs/CNAME` and a committed `search/search_index.json`.
 */
const MKDOCS_DOCUMENTATION_SIGNAL_SCORES = {
  'mkdocs-config-file': 3,
  'mkdocs-theme-overrides': 2,
  'mkdocs-docs-assets': 1,
  'mkdocs-docs-index': 1,
  'mkdocs-pages-file': 1,
} as const;

type MkDocsDocumentationSignal =
  keyof typeof MKDOCS_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Matches a counted `mkdocs.yml` or `mkdocs.yaml`. Shared by the
 * `mkdocs-config-file` schema and the project-directory lookup so both always
 * agree on which configs count.
 */
const MKDOCS_CONFIG_FILE_REGEX = excludingMkDocsNonDocumentationFolders(
  String.raw`(?:.*/)?mkdocs\.ya?ml`,
);

/**
 * Adds a `Documentation` candidate for MkDocs documentation projects.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `MkDocs` and related technology `Python` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path under a test, demo, example, fixture
 * or vendored folder, under the MkDocs-only template, sample and `.github`
 * folders, and any path with a `{{` placeholder
 * (`excludingMkDocsNonDocumentationFolders`), at any depth. A support file
 * under such a folder contributes no signal, score or evidence, so a fixture
 * cannot feed the owner of the real project.
 *
 * Gate: `mkdocs-config-file` alone.
 *
 * Owner: `resolveManifestDirectoryOwner` (shared with Helm, Pulumi, AWS CDK and
 * Ansible), wired as a plain per-entry `ownerAdapter`. The directory of every
 * counted config is computed once per call and passed in, so the config and its
 * support files resolve to the same owner, which the gate depends on. A config
 * owns its own folder (the folder `docs_dir` resolves from), a root config owns
 * the whole repo, nested configs fold into the enclosing one, sibling configs
 * collapse into their shared parent (fastapi's `docs/en` and `docs/hi` become
 * `docs`; google-apis-rs's 328 generated `gen/*-cli` folders become `gen`),
 * and a workspace unit (`apps/<name>`, `packages/<name>`, ...) owns every
 * config below it.
 *
 * Limitations:
 * - Path-only: `docs_dir`, `theme`, `INHERIT` and the plugins are not read, so
 *   a config far from its content (fmtlib/fmt: `support/mkdocs.yml`, pages in
 *   `doc/`) resolves to the config's folder.
 * - Zensical and other forks that read `mkdocs.yml` are labelled `MkDocs`;
 *   Material for MkDocs cannot be told apart from paths, so it is not claimed.
 * - Split configs with no `mkdocs.yml` (`mkdocs-common.yml`, `mkdocs-nav.yml`)
 *   emit nothing; about 12 of 2,900 scanned repositories.
 * - A workspace unit or a sibling fold can hide the real docs folder
 *   (`packages/x/docs/mkdocs.yml` resolves to `packages/x`), inherited from the
 *   shared resolver.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 */
export function addMkDocsDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const mkdocsDirectories = index
    .findEntriesByPathMatching({ pattern: MKDOCS_CONFIG_FILE_REGEX })
    .map((entry) => entry.parentPath ?? '.');

  applyDeclarativeAreaDetector<MkDocsDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'MkDocs',
    relatedTechs: ['Python'],
    signalScores: MKDOCS_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'mkdocs-config-file',
        regex: MKDOCS_CONFIG_FILE_REGEX,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'mkdocs-theme-overrides',
        regex: excludingMkDocsNonDocumentationFolders(
          String.raw`(?:.*/)?overrides/.+\.html`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'mkdocs-docs-assets',
        regex: excludingMkDocsNonDocumentationFolders(
          String.raw`(?:.*/)?docs/(?:stylesheets|javascripts)/.+`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'mkdocs-docs-index',
        regex: excludingMkDocsNonDocumentationFolders(
          String.raw`(?:.*/)?docs/index\.md`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'mkdocs-pages-file',
        regex: excludingMkDocsNonDocumentationFolders(String.raw`(?:.*/)?\.pages`),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'mkdocs-config-file',
        },
      },
    },
    ownerAdapter: ({ path }) =>
      resolveManifestDirectoryOwner({
        path,
        manifestDirectories: mkdocsDirectories,
      }),
  });
}
