import {
  MONOREPO_OWNER_ROOT_DIRECTORIES,
  ownerPathForApplicationArea,
} from '../../project-structure-path-utils';

const BICEP_HOME_FOLDERS = new Set([
  'bicep',
  'terraform',
  'bicep-devcenter',
  'infra',
  'infrastructure',
  'iac',
  'deploy',
  'deployment',
]);

const ENVIRONMENT_FOLDERS = new Set(['envs', 'environments']);

const REUSABLE_LIBRARY_FOLDERS = new Set(['modules', 'wrappers']);

/**
 * Maps an Azure Bicep evidence path to its area owner root.
 *
 * Inputs: one object:
 * - `path`, the repo-relative, forward-slash path of the matched file (for
 *   example `infra/main.bicep`).
 * - `rootHasBicep`, whether the repository root directly holds a Bicep
 *   file. Computed once per repo by the caller, so this function stays a pure
 *   function of its inputs and does not rescan the tree for every evidence
 *   path.
 * Output: the owner root path, `.` for the repository root.
 * Side effects: none.
 *
 * Rules, applied in this order (first match wins):
 * 1. A single-segment path (a file at the repo root) resolves to `.`.
 * 2. When `rootHasBicep` is true, every path resolves to `.`: the root
 *    template owns everything nested below it, whatever those folders are
 *    called, including workspace units and home folders.
 * 3. A path whose first segment is a workspace container
 *    (`MONOREPO_OWNER_ROOT_DIRECTORIES`, compared case-insensitively) is
 *    decided here, before the home and environment folder rules, so a
 *    workspace unit (`apps/web/infra/main.bicep`,
 *    `services/api/infra/environments/prod/main.bicep`) keeps ownership:
 *    - a two-segment path (for example `apps/main.bicep`) names no unit and
 *      resolves to `.`;
 *    - `modules/...` resolves to `.`, since `modules` is also a
 *      reusable-library folder (rule 6);
 *    - anything else delegates to `ownerPathForApplicationArea`, which
 *      resolves the unit (`apps/<name>`, `packages/@scope/<name>`).
 * 4. A path containing a home folder (`bicep`, `infra`, `infrastructure`,
 *    ...) resolves to the path up to and including the first such segment.
 * 5. A path containing an environment folder (`envs`, `environments`)
 *    resolves to the path up to and including the first such segment.
 * 6. A path whose first segment is a reusable-library folder (`modules`,
 *    `wrappers`) resolves to `.`.
 * 7. Anything else delegates to `ownerPathForApplicationArea`, which
 *    recognizes `src` segments.
 *
 * Demo and test folders (`examples`, `tests`, `testdata`, ...) are not handled
 * here: the Bicep detector's entry schemas drop those paths before this
 * function is called, so it never sees them.
 *
 * Limitations:
 * - Sees one path at a time plus the single `rootHasBicep` fact, so it
 *   cannot tell that a folder with an unrecognized name is mostly Bicep; those
 *   fall back to rule 7 and usually resolve to `.`.
 * - Folder-name sets hold lowercase names only and each segment is lowercased
 *   before lookup, so matching is case-insensitive, including the workspace
 *   container check in rule 3 (`Apps/web/infra/main.bicep` -> `Apps/web`, same
 *   as `apps/web/infra/main.bicep`). The returned owner keeps the path's
 *   original casing (`Infra/main.bicep` -> `Infra`).
 * - Home and environment folders are searched across every segment, including
 *   the file name.
 *
 * Takes its own input object rather than the engine's `OwnerAdapterArgs`
 * because the Bicep detector declares no anchor signals; the detector wires it
 * as
 * `ownerAdapter: ({ path }) => resolveBicepRootOwner({ path, rootHasBicep })`.
 */
export function resolveBicepRootOwner({
  path,
  rootHasBicep,
}: {
  path: string;
  rootHasBicep: boolean;
}): string {
  const parts = path.split('/');

  if (parts.length <= 1) {
    return '.';
  }

  if (rootHasBicep) {
    return '.';
  }

  const root = parts[0].toLowerCase();

  if (MONOREPO_OWNER_ROOT_DIRECTORIES.includes(root)) {
    if (parts.length === 2 || REUSABLE_LIBRARY_FOLDERS.has(root)) {
      return '.';
    }

    return ownerPathForApplicationArea({ path });
  }

  const homeFolderIndex = parts.findIndex((part) =>
    BICEP_HOME_FOLDERS.has(part.toLowerCase()),
  );
  const envFolderIndex = parts.findIndex((part) =>
    ENVIRONMENT_FOLDERS.has(part.toLowerCase()),
  );

  if (homeFolderIndex >= 0) {
    return parts.slice(0, homeFolderIndex + 1).join('/');
  }

  if (envFolderIndex >= 0) {
    return parts.slice(0, envFolderIndex + 1).join('/');
  }

  if (REUSABLE_LIBRARY_FOLDERS.has(root)) {
    return '.';
  }

  return ownerPathForApplicationArea({ path });
}
