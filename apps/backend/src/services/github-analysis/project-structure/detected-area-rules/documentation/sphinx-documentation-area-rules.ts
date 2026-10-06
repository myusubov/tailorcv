import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveSphinxProjectOwner } from '../owner-adapters';
import { excludingNonDocumentationFolders } from './non-documentation-folders';

/**
 * Path-only Sphinx signal contract, from a GitHub-tree survey of 330
 * repositories and 1,420 `conf.py` files (572 classified by hand, search-biased
 * and tuned on the same sample, with no held-out set):
 * - Anchor, scored `2`: `sphinx-conf-file` (`conf.py`). The name is generic
 *   (settings modules, nginx or ceph configs, test fixtures), so on its own it
 *   is wrong about 42% of the time and never opens the gate alone.
 * - Gate companion, which opens the gate next to the anchor:
 *   `sphinx-index-file` (`index.rst|md|txt`, `contents.rst|md|txt`,
 *   `index.rst.template`), scored `2`. CPython has `contents.rst` and no
 *   `index.rst`; pandas has `index.rst.template`.
 * - Deliberately not scored: `_static/` and `_templates/`. Beside an index file
 *   they add nothing (132 of 241 real projects have both), and as the only
 *   companion they rescue 2 of 241 projects.
 * - Support signals, which never open the gate: `sphinx-makefile` (`Makefile`)
 *   and `sphinx-readthedocs-config` (`.readthedocs.yml|yaml`), scored `1` each.
 *   A Makefile alone is not a gate: 11 non-Sphinx `conf.py` folders have one.
 */
const SPHINX_DOCUMENTATION_SIGNAL_SCORES = {
  'sphinx-conf-file': 2,
  'sphinx-index-file': 2,
  'sphinx-makefile': 1,
  'sphinx-readthedocs-config': 1,
} as const;

type SphinxDocumentationSignal =
  keyof typeof SPHINX_DOCUMENTATION_SIGNAL_SCORES;

/**
 * Matches a `conf.py` outside test, demo and vendored folders. Shared by the
 * `sphinx-conf-file` schema and the project-directory derivation so the two
 * cannot disagree about which config files count.
 */
const SPHINX_CONFIG_FILE_REGEX = excludingNonDocumentationFolders(
  String.raw`(?:.*/)?conf\.py`,
);

/**
 * Matches a Sphinx root document. Shared by the `sphinx-index-file` schema and
 * the project-directory derivation.
 */
const SPHINX_INDEX_FILE_REGEX = excludingNonDocumentationFolders(
  String.raw`(?:.*/)?(?:index\.(?:rst|md|txt)|contents\.(?:rst|md|txt)|index\.rst\.template)`,
);

/**
 * Derives the Sphinx project directories of a repository, for
 * `resolveSphinxProjectOwner`.
 *
 * A project directory is the folder of a non-blocked `conf.py` that also has a
 * direct-child index file. An index file deeper down does not count, so
 * `docs/api/index.rst` never promotes `docs/` and a stray `conf.py` (Django's `django/urls/conf.py`) never becomes
 * a project.
 *
 * Inputs: `index`, the repository path lookup.
 * Output: the distinct project directories, `.` for the repo root, in the
 * original case of the tree (the engine hands the owner adapter original-case
 * paths).
 * Side effects: none. Called once per repository by the detector so the owner
 * adapter stays a pure function of its inputs.
 */
const deriveSphinxProjectDirectories = (
  index: DetectedAreaRuleContext['index'],
): string[] => {
  const projectDirectories = new Set<string>();
  const companionDirectories = new Set<string>();

  for (const { parentPath } of index.findEntriesByPathMatching({
    pattern: SPHINX_INDEX_FILE_REGEX,
  })) {
    companionDirectories.add(parentPath ?? '.');
  };

  for (const { parentPath } of index.findEntriesByPathMatching({
    pattern: SPHINX_CONFIG_FILE_REGEX,
  })) {
    const directory = parentPath ?? '.';

    if (companionDirectories.has(directory)) {
      projectDirectories.add(directory);
    }
  }

  return Array.from(projectDirectories);
};

/**
 * Adds a `Documentation` candidate for Sphinx documentation projects.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Documentation` candidate with primary
 * technology `Sphinx` and related technology `Python` for every owner whose
 * counted signals clear the gate.
 *
 * Exclusion: every schema rejects a path with a whole test, demo, example,
 * fixture or vendored directory segment (`excludingNonDocumentationFolders`),
 * at any depth. This is required, not optional: 565 of the 1,420 surveyed
 * `conf.py` files sit in such folders (Sphinx's own repository has 175 of its
 * 176 under `tests/`).
 *
 * Gate: `sphinx-conf-file` and `sphinx-index-file`. In the survey this kept 232
 * of 241 real projects (96.3%) and passed none of the 176 non-Sphinx files.
 *
 * Owner: `resolveSphinxProjectOwner`, wired as a per-entry `ownerAdapter`, with
 * the project directories derived once per call by
 * `deriveSphinxProjectDirectories`. A project owns its own folder (the parent
 * for a `source/` folder of a `source/` + `build/` split), nested projects fold
 * into the enclosing one, and sibling projects stay separate.
 *
 * Limitations:
 * - Path-only: `conf.py` contents are not read.
 * - There is no cap on owners, so a repository with many `conf.py` projects
 *   (apache/airflow has 117) emits one candidate for each.
 * - The workspace-unit rule used by the infrastructure-as-code detectors is not
 *   applied.
 * - `.readthedocs.yml` at the repo root belongs to the owner `.`. It scores for
 *   a project only when that project is the root; otherwise `.` has no
 *   `conf.py` or index file, so it fails the gate and adds nothing to the
 *   documentation project. A nested one counts for the project that holds it.
 */
export function addSphinxDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const projectDirectories = deriveSphinxProjectDirectories(index);

  applyDeclarativeAreaDetector<SphinxDocumentationSignal>({
    candidates,
    index,
    detectedArea: 'Documentation',
    primaryTech: 'Sphinx',
    relatedTechs: ['Python'],
    signalScores: SPHINX_DOCUMENTATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'sphinx-conf-file',
        regex: SPHINX_CONFIG_FILE_REGEX,
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'sphinx-index-file',
        regex: SPHINX_INDEX_FILE_REGEX,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sphinx-makefile',
        regex: excludingNonDocumentationFolders(String.raw`(?:.*/)?makefile`),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sphinx-readthedocs-config',
        regex: excludingNonDocumentationFolders(
          String.raw`(?:.*/)?\.readthedocs\.ya?ml`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasAllOf: ['sphinx-conf-file', 'sphinx-index-file'],
        },
      },
    },
    ownerAdapter: ({ path }) =>
      resolveSphinxProjectOwner({ path, projectDirectories }),
  });
}
