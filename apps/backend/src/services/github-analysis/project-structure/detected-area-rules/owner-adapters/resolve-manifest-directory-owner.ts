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
 * Maps an evidence path to its area owner root for tools whose unit is a
 * folder marked by one manifest file: Helm's `Chart.yaml`, Pulumi's
 * `Pulumi.yaml` and AWS CDK's `cdk.json` (Ansible passes a derived list; see
 * the detector).
 *
 * Inputs: one object:
 * - `path`, the repo-relative, forward-slash path of the matched file (for
 *   example `charts/api/templates/deployment.yaml` or `infra/Pulumi.dev.yaml`).
 * - `manifestDirectories`, the directory of every counted manifest file in the
 *   repository (`.` for a root manifest), computed once per repo by the
 *   detector so this function stays a pure function of its inputs.
 * Output: the owner root path, `.` for the repository root.
 * Side effects: none.
 *
 * Rules, applied in this order (first match wins):
 * 1. A single-segment path resolves to `.`.
 * 2. A path whose first segment is a workspace container (`apps`, `services`,
 *    ...; compared case-insensitively) resolves through
 *    `ownerPathForApplicationArea`, so a workspace unit owns its manifests.
 *    This runs before the root-manifest rule, so a unit beats a root manifest.
 * 3. When a root manifest exists (`manifestDirectories` includes `.`), every
 *    other path resolves to `.`.
 * 4. The nearest owner is the shortest manifest directory that encloses the
 *    path, so a manifest nested inside another folds into its enclosing unit
 *    (a Helm subchart, a Pulumi project inside another project). When another
 *    manifest directory shares the nearest owner's parent, the owner is that
 *    parent (`.` for a root-level parent), so sibling units collapse into one
 *    area; otherwise it is the nearest owner itself.
 * 5. A path enclosed by no manifest directory (an orphan companion) resolves to
 *    its own directory.
 *
 * Invariants: companions (Helm's `values.yaml`, `templates/`, `.helmignore`,
 * `Chart.lock`; Pulumi's `Pulumi.<stack>.yaml`; CDK's `cdk.context.json` and
 * `cdk.out/manifest.json`) resolve to the same owner as their unit's manifest,
 * or the detector's gate can never pass.
 * Limitations: enclosing and sibling checks are case-sensitive, which is
 * consistent because the entry index lowercases every path; only the
 * workspace-container lookup is explicitly case-insensitive. Sibling folding is
 * by shared parent only, so unrelated units that happen to sit side by side
 * fold together.
 *
 * Takes its own input object rather than the engine's `OwnerAdapterArgs`
 * because none of its detectors declares an anchor signal; each wires it as
 * `ownerAdapter: ({ path }) => resolveManifestDirectoryOwner({ path,
 * manifestDirectories })`.
 */
export function resolveManifestDirectoryOwner({
  path,
  manifestDirectories,
}: {
  path: string;
  manifestDirectories: string[];
}): string {
  const parts = path.split('/');

  if (parts.length <= 1) {
    return '.';
  }

  if (MONOREPO_OWNER_ROOT_DIRECTORIES.includes(parts[0].toLowerCase())) {
    return ownerPathForApplicationArea({ path });
  }

  if (manifestDirectories.includes('.')) {
    return '.';
  }

  const nearestOwner = manifestDirectories
    .filter((dir) => path.startsWith(dir + '/'))
    .reduce<
      string | undefined
    >((shortest, dir) => (shortest === undefined || dir.length < shortest.length ? dir : shortest), undefined);

  if (!nearestOwner) {
    return parentOf(path) || '.';
  }

  const parentOfNearestOwner = parentOf(nearestOwner);
  const hasSibling = manifestDirectories.some(
    (dir) => dir !== nearestOwner && parentOf(dir) === parentOfNearestOwner,
  );

  return hasSibling ? parentOfNearestOwner || '.' : nearestOwner;
}
