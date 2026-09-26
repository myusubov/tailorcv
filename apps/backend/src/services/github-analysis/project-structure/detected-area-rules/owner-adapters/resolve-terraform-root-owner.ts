import {
  MONOREPO_OWNER_ROOT_DIRECTORIES,
  ownerPathForApplicationArea,
} from '../../project-structure-path-utils';

const TERRAFORM_HOME_FOLDERS = new Set([
  'terraform',
  'opentofu',
  'terragrunt',
  'infra',
  'infrastructure',
  'iac',
  'deploy',
  'deployment',
  'tf',
  'tofu',
]);

const ENVIRONMENT_FOLDERS = new Set(['envs', 'environments']);

const REUSABLE_LIBRARY_FOLDERS = new Set(['modules', 'wrappers']);

/**
 * Maps a Terraform / OpenTofu / Terragrunt evidence path to its area owner
 * root.
 *
 * Inputs: one object:
 * - `path`, the repo-relative, forward-slash path of the matched file (for
 *   example `terraform/prod/main.tf`).
 * - `rootHasTerraform`, whether the repository root directly holds a
 *   Terraform, OpenTofu or Terragrunt config file. Computed once per repo by
 *   the caller, so this function stays a pure function of its inputs and does
 *   not rescan the tree for every evidence path.
 * Output: the owner root path, `.` for the repository root.
 * Side effects: none.
 *
 * Rules, applied in this order (first match wins):
 * 1. A single-segment path (a file at the repo root) resolves to `.`.
 * 2. When `rootHasTerraform` is true, every path resolves to `.`: the root
 *    module owns everything nested below it, whatever those folders are
 *    called, including workspace units and home folders.
 * 3. A two-segment path directly inside a workspace container
 *    (`MONOREPO_OWNER_ROOT_DIRECTORIES`, for example `apps/main.tf`) names no
 *    unit and resolves to `.`.
 * 4. A path containing a Terraform home folder (`terraform`, `infra`,
 *    `infrastructure`, ...) resolves to the path up to and including the first
 *    such segment. Skipped when the first segment is a workspace container, so
 *    a workspace unit (`apps/web/infra/main.tf`) keeps ownership via rule 7.
 * 5. A path containing an environment folder (`envs`, `environments`)
 *    resolves to the path up to and including the first such segment. Skipped
 *    when the first segment is a workspace container, like rule 4, so
 *    `services/api/infra/environments/prod/main.tf` keeps ownership via rule 7.
 * 6. A path whose first segment is a reusable-library folder (`modules`,
 *    `wrappers`) resolves to `.`.
 * 7. Anything else delegates to `ownerPathForApplicationArea`, which
 *    recognizes workspace units (`apps/<name>`, `packages/@scope/<name>`) and
 *    `src` segments.
 *
 * Demo and test folders (`examples`, `tests`, `testdata`, ...) are not handled
 * here: the Terraform detector's entry schemas drop those paths before this
 * function is called, so it never sees them.
 *
 * Limitations:
 * - Sees one path at a time plus the single `rootHasTerraform` fact, so it
 *   cannot tell that a folder with an unrecognized name (`aws/`,
 *   `cluster-setup/`) is mostly Terraform; those fall back to rule 7 and
 *   usually resolve to `.`.
 * - Folder-name sets hold lowercase names only and each segment is lowercased
 *   before lookup, so matching is case-insensitive. The returned owner keeps
 *   the path's original casing (`Terraform/main.tf` -> `Terraform`).
 * - Home and environment folders are searched across every segment, including
 *   the file name.
 *
 * Takes its own input object rather than the engine's `OwnerAdapterArgs`
 * because the Terraform detector declares no anchor signals; the detector
 * wires it as
 * `ownerAdapter: ({ path }) => resolveTerraformRootOwner({ path, rootHasTerraform })`.
 */
export function resolveTerraformRootOwner({
  path,
  rootHasTerraform,
}: {
  path: string;
  rootHasTerraform: boolean;
}): string {
  const parts = path.split('/');

  if (parts.length <= 1) {
    return '.';
  }

  if (rootHasTerraform) {
    return '.';
  }

  if (
    parts.length === 2 &&
    MONOREPO_OWNER_ROOT_DIRECTORIES.includes(parts[0])
  ) {
    return '.';
  }

  const homeFolderIndex = parts.findIndex((part) =>
    TERRAFORM_HOME_FOLDERS.has(part.toLowerCase()),
  );
  const envFolderIndex = parts.findIndex((part) =>
    ENVIRONMENT_FOLDERS.has(part.toLowerCase()),
  );

  if (
    homeFolderIndex >= 0 &&
    !MONOREPO_OWNER_ROOT_DIRECTORIES.includes(parts[0])
  ) {
    return parts.slice(0, homeFolderIndex + 1).join('/');
  }

  if (
    envFolderIndex >= 0 &&
    !MONOREPO_OWNER_ROOT_DIRECTORIES.includes(parts[0])
  ) {
    return parts.slice(0, envFolderIndex + 1).join('/');
  }

  if (REUSABLE_LIBRARY_FOLDERS.has(parts[0].toLowerCase())) {
    return '.';
  }

  return ownerPathForApplicationArea({ path });
}
