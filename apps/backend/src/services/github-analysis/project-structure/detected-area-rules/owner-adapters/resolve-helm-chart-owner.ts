import {
  MONOREPO_OWNER_ROOT_DIRECTORIES,
  ownerPathForApplicationArea,
} from '../../project-structure-path-utils';

/**
 * Returns the parent directory of `dir`: everything before its last `/`, or an
 * empty string for a single-segment directory such as `elasticsearch`.
 */
function parentOf(dir: string): string {
  return dir.split('/').slice(0, -1).join('/');
}

/**
 * Maps a Helm evidence path to its area owner root.
 *
 * Inputs: one object:
 * - `path`, the repo-relative, forward-slash path of the matched file (for
 *   example `charts/api/templates/deployment.yaml`).
 * - `chartDirectories`, the directory of every counted `Chart.yaml` in the
 *   repository (`.` for a root chart), computed once per repo by the detector.
 * Output: the owner root path, `.` for the repository root.
 * Side effects: none.
 *
 * Rules, applied in this order (first match wins):
 * 1. A single-segment path resolves to `.`.
 * 2. A path whose first segment is a workspace container (`apps`, `services`,
 *    ...; compared case-insensitively) resolves through
 *    `ownerPathForApplicationArea`, so a workspace unit owns its charts. This
 *    runs before the root-chart rule, so a unit beats a root chart.
 * 3. When a root chart exists (`chartDirectories` includes `.`), every other
 *    path resolves to `.`.
 * 4. The nearest owner is the shortest chart directory that encloses the path,
 *    so a subchart folds into its enclosing chart. When another chart
 *    directory shares the nearest owner's parent, the owner is that parent
 *    (`.` for a root-level parent); otherwise it is the nearest owner itself.
 * 5. A path enclosed by no chart directory (an orphan companion) resolves to
 *    its own directory.
 *
 * Invariants: companions (`values.yaml`, `templates/`, `.helmignore`,
 * `Chart.lock`) resolve to the same owner as their chart's `Chart.yaml`, or
 * the detector's gate can never pass.
 * Limitations: enclosing and sibling checks are case-sensitive; only the
 * workspace-container lookup ignores case.
 */
export function resolveHelmChartOwner({
  path,
  chartDirectories,
}: {
  path: string;
  chartDirectories: string[];
}): string {
  const parts = path.split('/');

  if (parts.length <= 1) {
    return '.';
  }

  if (MONOREPO_OWNER_ROOT_DIRECTORIES.includes(parts[0].toLowerCase())) {
    return ownerPathForApplicationArea({ path });
  }

  if (chartDirectories.includes('.')) {
    return '.';
  }

  const nearestOwner = chartDirectories
    .filter((dir) => path.startsWith(dir + '/'))
    .reduce<
      string | undefined
    >((shortest, dir) => (shortest === undefined || dir.length < shortest.length ? dir : shortest), undefined);

  if (!nearestOwner) {
    return parentOf(path) || '.';
  }

  const parentOfNearestOwner = parentOf(nearestOwner);
  const hasSibling = chartDirectories.some(
    (dir) => dir !== nearestOwner && parentOf(dir) === parentOfNearestOwner,
  );

  return hasSibling ? parentOfNearestOwner || '.' : nearestOwner;
}
