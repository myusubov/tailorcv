import { parentOf } from '../../project-structure-path-utils';

/**
 * Maps an evidence path to the owner root of the Sphinx documentation project
 * that holds it.
 *
 * Inputs: one object:
 * - `path`, the repo-relative, forward-slash path of the matched file, in its
 *   original case (for example `docs/source/conf.py` or `Doc/Makefile`).
 * - `projectDirectories`, the folder of every Sphinx project in the repository
 *   (`.` for a root project), derived once per repo by the detector: each
 *   non-blocked `conf.py` folder that also has a direct-child index file.
 * Output: the owner root path, `.` for the repository root.
 * Side effects: none.
 *
 * Rules:
 * 1. A project folder owns itself, whatever it is called. A folder whose last
 *    segment is `source` (the `source/` + `build/` split) is owned by its
 *    parent instead (`docs/source` -> `docs`, a root `source` -> `.`).
 * 2. A root owner `.` owns every path.
 * 3. Otherwise a path belongs to the shortest owner folder that holds it, so a
 *    nested project folds into the enclosing one (`docs/cpp` into `docs`).
 *    Sibling owners stay separate.
 * 4. A path no owner holds resolves to its own folder, or `.` for a
 *    single-segment path.
 *
 * Invariants: path case is kept, and an owner holds a path only when the path
 * starts with the owner folder followed by `/`, so `docs-old/conf.py` is not
 * held by `docs`.
 * Limitations: the workspace-unit rule used by the infrastructure-as-code
 * adapters is not applied, and only a last segment named exactly `source` is
 * special. The expected behavior is specified in
 * `resolve-sphinx-project-owner.test.ts`.
 */
export function resolveSphinxProjectOwner({
  path,
  projectDirectories,
}: {
  path: string;
  projectDirectories: string[];
}): string {
  const mappedProjectDirectories = projectDirectories.map((dir) =>
    dir.split('/').pop() === 'source' ? parentOf(dir) || '.' : dir,
  );

  if (mappedProjectDirectories.includes('.')) return '.';

  const shortestProjectDirectoryForItem: string | undefined =
    mappedProjectDirectories
      .filter((dir) => path.startsWith(dir + '/'))
      .sort((a, b) => a.length - b.length)[0];

  return shortestProjectDirectoryForItem ?? (parentOf(path) || '.');
}
