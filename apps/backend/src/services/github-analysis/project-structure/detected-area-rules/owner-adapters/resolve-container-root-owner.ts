import {
  MONOREPO_OWNER_ROOT_DIRECTORIES,
  ownerPathForApplicationArea,
} from '../../project-structure-path-utils';

/**
 * First-segment directory names that hold independently deployable units in
 * real monorepos but are too context-dependent to add to the shared
 * `MONOREPO_OWNER_ROOT_DIRECTORIES`: `products/` (posthog), `plugins/`
 * (backstage), `providers/` (airflow). `plugins/` in particular also appears
 * inside single applications, so it is only trusted for container evidence,
 * where a Dockerfile under `plugins/<name>/` reliably marks `<name>` as the
 * deployable unit.
 */
const CONTAINER_DEPLOYMENT_ROOT_DIRECTORIES: readonly string[] = [
  'products',
  'plugins',
  'providers',
];

/**
 * Top-level directory names that carry container files for infra, tooling, or
 * dev-environment purposes rather than for a deployable unit. A container file
 * directly inside one of these belongs to the repository root, not to a unit
 * named after the folder (`docker/Dockerfile` -> `.`, not `docker`).
 *
 * Composed from the monorepo workspace-container names
 * (`MONOREPO_OWNER_ROOT_DIRECTORIES`) and the containerization-only roots
 * (`CONTAINER_DEPLOYMENT_ROOT_DIRECTORIES`) -- a container file sitting straight
 * in one of those (e.g. `apps/Dockerfile`) names no unit -- plus the infra,
 * tooling, and dev-environment folder names below.
 */
const NON_UNIT_TOP_LEVEL_DIRECTORIES: ReadonlySet<string> = new Set<string>([
  ...MONOREPO_OWNER_ROOT_DIRECTORIES,
  ...CONTAINER_DEPLOYMENT_ROOT_DIRECTORIES,
  'docker',
  '.devcontainer',
  'deploy',
  'deployments',
  'packaging',
  'hosting',
  'infra',
  'infrastructure',
  'ci',
  '.github',
  '.circleci',
  'scripts',
  'build',
  'contrib',
  'devenv',
  'test',
  'tests',
  'e2e',
  'example',
  'examples',
  'docs',
  'tools',
]);

/**
 * Container file base names (case-insensitive): `Dockerfile` and its
 * `*.dockerfile` / suffixed variants, `.dockerignore`, Compose files, and
 * Bake files. Covers the same files as the signal regexes in
 * `docker-containerization-area-rules.ts`, except a Dockerfile-scoped
 * `<name>.dockerfile.dockerignore`; `devcontainer.json` is excluded because it
 * never sits two segments deep.
 */
const CONTAINER_FILE_NAME =
  /^(?:dockerfile|[^/]+\.dockerfile)(?:\.[^/]+)?$|^\.dockerignore$|^(?:docker-)?compose(?:\.[^/]+)?\.ya?ml$|^docker-bake(?:\.override)?\.(?:hcl|json)$/i;

/**
 * Resolves the owner root for one Docker containerization signal
 * (`Dockerfile`, `compose`, `docker-bake`, `.dockerignore`, `devcontainer`).
 *
 * Inputs:
 * - `path`: repo-tree path of a matched signal entry (forward slashes,
 *   original case; the directory and file-name checks here are
 *   case-insensitive).
 *
 * Output: the deployable unit the container files belong to.
 * - A path with no directory segment (a bare root-level file) resolves to `.`.
 * - A container file exactly one directory deep resolves to that directory
 *   (`server/Dockerfile` -> `server`; immich, langfuse), unless the directory
 *   is a known infra/tooling folder (`NON_UNIT_TOP_LEVEL_DIRECTORIES`), which
 *   resolves to `.`.
 * - Otherwise delegates to `ownerPathForApplicationArea`, additionally
 *   treating `CONTAINER_DEPLOYMENT_ROOT_DIRECTORIES` as workspace roots.
 *
 * Limitation: the one-directory-deep rule cannot tell a real deployable unit
 * from a plain source folder that happens to hold a container file, so a
 * single app split into `frontend/` + `backend/` folders resolves to two
 * owners. That matches the "one image per folder" reading, which is the common
 * case, but is a heuristic, not a guarantee.
 *
 * This adapter takes a bare `path` rather than the engine's `OwnerAdapterArgs`
 * object because Docker rules declare no anchor signals; callers wire it as
 * `ownerAdapter: ({ path }) => resolveContainerRootOwner(path)`.
 */
export function resolveContainerRootOwner(path: string): string {
  const parts = path.split('/');

  if (parts.length <= 1) {
    return '.';
  }

  if (parts.length === 2 && CONTAINER_FILE_NAME.test(parts[1])) {
    return NON_UNIT_TOP_LEVEL_DIRECTORIES.has(parts[0].toLowerCase())
      ? '.'
      : parts[0];
  }

  return ownerPathForApplicationArea({
    path,
    extraRootDirectories: CONTAINER_DEPLOYMENT_ROOT_DIRECTORIES,
  });
}
