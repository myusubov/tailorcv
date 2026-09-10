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
 *
 * `quadlet/` and `quadlets/` are Podman Quadlet collection folders whose
 * immediate subdirectories each hold one service's unit files
 * (`quadlet/<svc>/<svc>.container`), so `<svc>` is the deployable unit. They
 * are also spread into `NON_UNIT_TOP_LEVEL_DIRECTORIES` below, so a unit file
 * sitting directly in the collection folder resolves to `.` instead.
 */
const CONTAINER_DEPLOYMENT_ROOT_DIRECTORIES: readonly string[] = [
  'products',
  'plugins',
  'providers',
  'quadlet',
  'quadlets',
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
 * Podman/OCI counterpart to `NON_UNIT_TOP_LEVEL_DIRECTORIES`, applied when the
 * two-segment file name matched `PODMAN_OCI_CONTAINER_FILE_NAME`. Extends that
 * denylist with folders that carry Quadlet or OCI unit files for deployment or
 * host administration rather than for a unit named after the folder:
 * `systemd` and `containers` (repo-committed mirrors of the Quadlet search
 * path `.../containers/systemd/`), `.quadlet`, `kube`, and `sysadmin`.
 * `quadlet` / `quadlets` are already present via
 * `CONTAINER_DEPLOYMENT_ROOT_DIRECTORIES` and are re-listed for locality: they
 * are collection roots when a service subdirectory sits between them and the
 * unit file, but non-unit holders when a unit file sits directly inside.
 */
const PODMAN_OCI_NON_UNIT_TOP_LEVEL_DIRECTORIES: ReadonlySet<string> =
  new Set<string>([
    ...NON_UNIT_TOP_LEVEL_DIRECTORIES,
    'systemd',
    'quadlet',
    'quadlets',
    '.quadlet',
    'containers', // `containers/systemd/` holder, `containers/<x>.container`
    'kube',
    'sysadmin',
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
 * Podman / OCI container file base names (case-insensitive):
 * - Quadlet unit files -- `<name>.container`, `<name>.pod`, `<name>.kube`,
 *   `<name>.build`, `<name>.image`, `<name>.network`, `<name>.volume`,
 *   `<name>.artifact` (at least one character before the extension, matching
 *   the `^.+\.<ext>$` signal regexes in
 *   `podman-oci-containerization-area-rules.ts`);
 * - the OCI build file `Containerfile` and its suffixed variants
 *   (`Containerfile.cross`), mirroring `^containerfile(?:\.[^/]+)?$`;
 * - `.containerignore`.
 *
 * Companion to `CONTAINER_FILE_NAME` for the Podman/OCI side. Extension
 * collisions (`.build`, `.network`, ... also belong to unrelated formats) are
 * the detector gate's concern, not this resolver's: only paths the detector
 * already matched reach owner resolution.
 */
const PODMAN_OCI_CONTAINER_FILE_NAME =
  /^[^/]+\.(?:container|pod|kube|build|image|network|volume|artifact)$|^containerfile(?:\.[^/]+)?$|^\.containerignore$/i;

/**
 * Resolves the owner root for one Docker or Podman/OCI containerization
 * signal: a `Dockerfile`, `compose`, `docker-bake`, or `.dockerignore` path,
 * or a Quadlet unit (`.container`, `.pod`, `.kube`, `.build`, `.image`,
 * `.network`, `.volume`, `.artifact`), `Containerfile`, or `.containerignore`
 * path.
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
 *   is a known infra/tooling folder, which resolves to `.`. Docker file names
 *   check `NON_UNIT_TOP_LEVEL_DIRECTORIES`; Quadlet unit and `Containerfile`
 *   names check the wider `PODMAN_OCI_NON_UNIT_TOP_LEVEL_DIRECTORIES`.
 * - Otherwise delegates to `ownerPathForApplicationArea`, additionally
 *   treating `CONTAINER_DEPLOYMENT_ROOT_DIRECTORIES` as workspace roots
 *   (so `quadlet/<svc>/<svc>.container` -> `quadlet/<svc>`).
 *
 * Limitation: the one-directory-deep rule cannot tell a real deployable unit
 * from a plain source folder that happens to hold a container file, so a
 * single app split into `frontend/` + `backend/` folders resolves to two
 * owners. That matches the "one image per folder" reading, which is the common
 * case, but is a heuristic, not a guarantee.
 *
 * This adapter takes a bare `path` rather than the engine's `OwnerAdapterArgs`
 * object because the Docker and Podman/OCI rules declare no anchor signals;
 * both detectors wire it as
 * `ownerAdapter: ({ path }) => resolveContainerRootOwner(path)`.
 */
export function resolveContainerRootOwner(path: string): string {
  const parts = path.split('/');

  if (parts.length <= 1) {
    return '.';
  }

  if (parts.length === 2) {
    if (CONTAINER_FILE_NAME.test(parts[1])) {
      return NON_UNIT_TOP_LEVEL_DIRECTORIES.has(parts[0].toLowerCase())
        ? '.'
        : parts[0];
    }

    if (PODMAN_OCI_CONTAINER_FILE_NAME.test(parts[1])) {
      return PODMAN_OCI_NON_UNIT_TOP_LEVEL_DIRECTORIES.has(
        parts[0].toLowerCase(),
      )
        ? '.'
        : parts[0];
    }
  }

  return ownerPathForApplicationArea({
    path,
    extraRootDirectories: CONTAINER_DEPLOYMENT_ROOT_DIRECTORIES,
  });
}
