import type { RepoTreeEntry } from './project-structure-analyzer.types';

const MONOREPO_OWNER_DIRECTORIES = new Set([
  'apps',
  'packages',
  'services',
  'libs',
]);

/**
 * Normalizes repository tree paths for case-insensitive matching.
 * Keeps all path-based analyzers aligned on forward-slash lowercase lookups.
 */
export function normalizePath({ path }: { path: string }): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

/**
 * Returns the smallest useful owning root for app/package evidence paths.
 * Monorepo paths resolve to `apps/name` or `packages/name`; root app evidence resolves to the repository root.
 */
export function ownerPathForApplicationArea(path: string): string {
  const parts = path.split('/');

  if (parts[0] === 'apps' && parts[1]) {
    return `${parts[0]}/${parts[1]}`;
  }

  if (parts[0] === 'packages' && parts[1]) {
    return `${parts[0]}/${parts[1]}`;
  }

  const srcIndex = parts.indexOf('src');
  if (srcIndex > 0) {
    return parts.slice(0, srcIndex).join('/');
  }

  return '.';
}

/**
 * Returns the smallest useful owning root for backend API evidence paths.
 * Monorepo paths resolve to `apps/name`; root `src` evidence resolves to `src`.
 */
export function ownerPathForBackendArea({ path }: { path: string }): string {
  const parts = path.split('/');

  if (parts[0] === 'apps' && parts[1]) {
    return `${parts[0]}/${parts[1]}`;
  }

  if (parts[0] === 'src') {
    return 'src';
  }

  const srcIndex = parts.indexOf('src');
  if (srcIndex > 0) {
    return parts.slice(0, srcIndex).join('/');
  }

  return parts[0] ?? path;
}

/**
 * Returns the owner root for repository-level config evidence.
 * Root config files belong to `.`, while nested config belongs to its top-level folder.
 */
export function ownerPathForConfigArea({ path }: { path: string }): string {
  return path.includes('/') ? topLevelPath({ path }) : '.';
}

/**
 * Returns the owner root for known database schema evidence.
 */
export function ownerPathForDatabaseArea(path: string): string {
  const parts = path.split('/');
  const prismaPathIndex = parts.indexOf('prisma');
  if (prismaPathIndex >= 0) {
    return parts.slice(0, prismaPathIndex + 1).join('/');
  }

  if (parts.length <= 1) {
    return '.';
  }

  return parts.slice(0, -1).join('/');
}

/**
 * Returns the application/package owner for Drizzle evidence.
 * Drizzle schema, config, and generated migration files may live in different
 * folders, so path-only detection groups them under the containing repo owner.
 */
export function ownerPathForDrizzleDatabaseArea(path: string): string {
  const parts = path.split('/');

  const databaseMonorepoOwnerPath = databaseMonorepoOwnerPathFromParts(parts);
  if (databaseMonorepoOwnerPath) {
    return databaseMonorepoOwnerPath;
  }

  return '.';
}

/**
 * Returns the repository or app/package owner for Knex evidence.
 * Knex config, migrations, and seeds are configurable and commonly split
 * across folders, so root repos emit at `.` while monorepos emit at owner root.
 */
export function ownerPathForKnexDatabaseArea(path: string): string {
  const parts = path.split('/');

  const databaseMonorepoOwnerPath = databaseMonorepoOwnerPathFromParts(parts);
  if (databaseMonorepoOwnerPath) {
    return databaseMonorepoOwnerPath;
  }

  return '.';
}

const SQLALCHEMY_DATABASE_ARTIFACT_DIRECTORIES = new Set([
  'alembic',
  'migrations',
  '_migrations',
  'versions',
  'models',
]);

const SQLALCHEMY_DATABASE_OWNER_FILES = new Set([
  'alembic.ini',
  'models.py',
  'orm_models.py',
  'db.py',
  'database.py',
  'session.py',
  'base.py',
  'base_class.py',
]);

const TYPEORM_DATABASE_OWNER_DIRECTORIES = new Set(['db', 'database']);

const TYPEORM_DATABASE_OWNER_FILES = new Set([
  'ormconfig.json',
  'ormconfig.js',
  'ormconfig.cjs',
  'ormconfig.mjs',
  'ormconfig.ts',
  'ormconfig.cts',
  'ormconfig.mts',
  'ormconfig.json.example',
  'ormconfig.js.example',
  'ormconfig.cjs.example',
  'ormconfig.mjs.example',
  'ormconfig.ts.example',
  'ormconfig.cts.example',
  'ormconfig.mts.example',
  'ormconfig.example.json',
  'ormconfig.example.js',
  'ormconfig.example.cjs',
  'ormconfig.example.mjs',
  'ormconfig.example.ts',
  'ormconfig.example.cts',
  'ormconfig.example.mts',
]);

const SEQUELIZE_DATABASE_OWNER_DIRECTORIES = new Set([
  'sequelize',
  'db',
  'database',
]);

const SEQUELIZE_DATABASE_ARTIFACT_DIRECTORIES = new Set([
  'config',
  'models',
  'model',
  'migrations',
  'migration',
  'seeders',
  'seeder',
]);

const SEQUELIZE_DATABASE_OWNER_FILES = new Set([
  '.sequelizerc',
  '.sequelizerc.js',
  'config.json',
  'config.js',
  'config.cjs',
  'config.mjs',
  'config.ts',
  'config.cts',
  'config.mts',
  'database.json',
  'database.js',
  'database.cjs',
  'database.mjs',
  'database.ts',
  'database.cts',
  'database.mts',
]);

const SHARED_PACKAGE_AREA_DIRECTORY_NAMES = new Set([
  'packages',
  'libs',
  'shared',
  'common',
  'modules',
]);

const DOCKER_CONTAINERIZATION_REPO_CONFIG_DIRECTORIES = new Set([
  '.devcontainer',
  '.docker',
  'deploy',
  'deployment',
  'deployments',
  'devops',
  'docker',
  'ops',
]);

const PODMAN_CONTAINERIZATION_REPO_CONFIG_DIRECTORIES = new Set([
  'quadlet',
  'containers',
  'systemd',
  'deploy',
  'etc',
]);

/**
 * Returns the shared SQLAlchemy/Alembic database owner path.
 * Alembic environments and SQLAlchemy model/session files can be split across
 * sibling artifact folders, so the owner is the nearest non-artifact parent.
 */
export function ownerPathForSqlAlchemyDatabaseArea(path: string): string {
  const parts = path.split('/');

  const databaseMonorepoOwnerPath = databaseMonorepoOwnerPathFromParts(parts);
  if (databaseMonorepoOwnerPath) {
    return databaseMonorepoOwnerPath;
  }

  const artifactDirectoryIndex = parts.findIndex((part) =>
    SQLALCHEMY_DATABASE_ARTIFACT_DIRECTORIES.has(part),
  );
  if (artifactDirectoryIndex >= 0) {
    const ownerParts = parts.slice(0, artifactDirectoryIndex);
    return ownerParts.length > 0 ? ownerParts.join('/') : '.';
  }

  const fileName = parts[parts.length - 1];
  if (fileName && SQLALCHEMY_DATABASE_OWNER_FILES.has(fileName)) {
    if (parts.length <= 1) {
      return '.';
    }

    return parts.slice(0, -1).join('/');
  }

  return '.';
}

/**
 * Returns the shared TypeORM database owner path.
 * TypeORM config, data-source, entity, and migration files are often split
 * across source folders, so root source evidence collapses to its app/package
 * owner while explicit `db` and `database` folders stay precise.
 */
export function ownerPathForTypeOrmDatabaseArea(path: string): string {
  const parts = path.split('/');

  const databaseMonorepoOwnerPath = databaseMonorepoOwnerPathFromParts(parts);
  if (databaseMonorepoOwnerPath) {
    return databaseMonorepoOwnerPath;
  }

  const ownerDirectoryIndex = parts.findIndex((part) =>
    TYPEORM_DATABASE_OWNER_DIRECTORIES.has(part),
  );
  if (ownerDirectoryIndex >= 0) {
    return parts.slice(0, ownerDirectoryIndex + 1).join('/');
  }

  const fileName = parts[parts.length - 1];
  if (fileName && TYPEORM_DATABASE_OWNER_FILES.has(fileName)) {
    if (parts.length <= 1) {
      return '.';
    }

    return parts.slice(0, -1).join('/');
  }

  return '.';
}

/**
 * Returns the shared Sequelize database owner path.
 * Sequelize CLI config, model, migration, and seeder artifacts can live in
 * split root folders or under explicit `sequelize`, `db`, or `database`
 * folders, so artifact folders collapse to their nearest non-artifact owner.
 */
export function ownerPathForSequelizeDatabaseArea(path: string): string {
  const parts = path.split('/');

  const databaseMonorepoOwnerPath = databaseMonorepoOwnerPathFromParts(parts);
  if (databaseMonorepoOwnerPath) {
    return databaseMonorepoOwnerPath;
  }

  const ownerDirectoryIndex = parts.findIndex((part) =>
    SEQUELIZE_DATABASE_OWNER_DIRECTORIES.has(part),
  );
  if (ownerDirectoryIndex >= 0) {
    return parts.slice(0, ownerDirectoryIndex + 1).join('/');
  }

  const artifactDirectoryIndex = parts.findIndex((part) =>
    SEQUELIZE_DATABASE_ARTIFACT_DIRECTORIES.has(part),
  );
  if (artifactDirectoryIndex >= 0) {
    const ownerParts = parts.slice(0, artifactDirectoryIndex);
    return ownerParts.length > 0 ? ownerParts.join('/') : '.';
  }

  const fileName = parts[parts.length - 1];
  if (fileName && SEQUELIZE_DATABASE_OWNER_FILES.has(fileName)) {
    if (parts.length <= 1) {
      return '.';
    }

    return parts.slice(0, -1).join('/');
  }

  return '.';
}

/**
 * Returns the nearest shared-package container owner for reusable package evidence.
 * Evidence under containers such as `packages`, `libs`, `shared`, `common`, or
 * `modules` is grouped at that container so sibling reusable packages form one area.
 */
export function ownerPathForSharedPackageArea(path: string): string {
  const parts = path.split('/');

  const sharedPackageDirectoryIndex = parts.findIndex((part) =>
    SHARED_PACKAGE_AREA_DIRECTORY_NAMES.has(part),
  );

  if (sharedPackageDirectoryIndex >= 0) {
    return parts.slice(0, sharedPackageDirectoryIndex + 1).join('/');
  }

  return '.';
}

/**
 * Resolves a matched Docker evidence path to the repository area that owns the
 * inferred containerization configuration.
 *
 * @param path - Repository-relative path already classified as Docker evidence.
 * @returns The monorepo member, monorepo root, repository root, or local parent
 * directory that most conservatively owns the evidence.
 *
 * @remarks This pure path-only resolver does not inspect Docker configuration
 * contents. Exact artifact locations remain available as candidate evidence;
 * this function returns their logical area owner and has no side effects.
 */
export function ownerPathForDockerContainerizationArea(path: string): string {
  const parts = path.split('/');

  // Known monorepo roots use a stricter member-or-root ownership contract.
  const containerizationMonorepoOwnerPath =
    containerizationMonorepoOwnerPathFromParts({
      parts,
      configDirectories: DOCKER_CONTAINERIZATION_REPO_CONFIG_DIRECTORIES,
    });
  if (containerizationMonorepoOwnerPath) {
    return containerizationMonorepoOwnerPath;
  }

  const topLevelDirectory = parts[0];
  // Root evidence and repository-level config folders describe the whole repo.
  if (
    parts.length <= 1 ||
    (topLevelDirectory &&
      DOCKER_CONTAINERIZATION_REPO_CONFIG_DIRECTORIES.has(topLevelDirectory))
  ) {
    return '.';
  }

  // Non-monorepo evidence falls back to the directory containing the artifact.
  return parentPathFromPath({ path });
}

/**
 * Resolves a matched Podman/OCI evidence path to the repository area that owns
 * the inferred containerization configuration.
 *
 * @param path - Repository-relative path already classified as Podman/OCI
 * evidence.
 * @returns The monorepo member, monorepo root, repository root, or local
 * parent directory that most conservatively owns the evidence.
 *
 * @remarks Unlike Docker's resolver, this scans every path segment (not only
 * the top-level one) for the first recognized Podman/OCI config directory
 * (`quadlet`, `containers`, `systemd`, `deploy`, `etc`) and collapses the
 * owner to everything before it, so deeply nested layouts such as
 * `subsystems/video/etc/containers/systemd/*.container` resolve to
 * `subsystems/video` rather than the config mirror folder itself. Matching is
 * case-sensitive against lowercase directory names only, so a differently
 * cased real-world folder (for example `Quadlet/`) falls through to the local
 * parent-directory fallback instead of being recognized. This pure path-only
 * resolver does not inspect Quadlet or Containerfile contents and cannot
 * distinguish an application literally named `quadlet`, `containers`,
 * `systemd`, `deploy`, or `etc` from one of these config directories.
 */
export function ownerPathForPodmanOciContainerizationArea(
  path: string,
): string {
  const parts = path.split('/');
  const containerizationMonorepoOwnerPath =
    containerizationMonorepoOwnerPathFromParts({
      parts,
      configDirectories: PODMAN_CONTAINERIZATION_REPO_CONFIG_DIRECTORIES,
    });
  if (containerizationMonorepoOwnerPath) {
    return containerizationMonorepoOwnerPath;
  }

  const podmanRepoConfigDirectoryIndex = parts.findIndex((part) =>
    PODMAN_CONTAINERIZATION_REPO_CONFIG_DIRECTORIES.has(part),
  );

  if (podmanRepoConfigDirectoryIndex >= 0) {
    const ownerParts = parts.slice(0, podmanRepoConfigDirectoryIndex);

    if (ownerParts.length > 0) {
      return ownerParts.join('/');
    } else {
      return '.';
    }
  }

  if (parts.length <= 1) {
    return '.';
  }

  return parentPathFromPath({ path });
}

/**
 * Returns an entry's parent path when it exists, otherwise the entry path itself.
 * Useful for file-backed areas whose owner is normally their containing folder.
 */
export function parentPathOrSelf({ entry }: { entry: RepoTreeEntry }): string {
  return entry.parentPath ?? entry.path;
}

function parentPathFromPath({ path }: { path: string }): string {
  const parts = path.split('/');
  if (parts.length <= 1) return path;
  return parts.slice(0, -1).join('/');
}

function databaseMonorepoOwnerPathFromParts(parts: string[]): string | null {
  const [ownerRoot, ownerName] = parts;
  if (!ownerRoot || !ownerName) {
    return null;
  }

  return MONOREPO_OWNER_DIRECTORIES.has(ownerRoot)
    ? `${ownerRoot}/${ownerName}`
    : null;
}

/**
 * Resolves containerization evidence under a recognized monorepo container to
 * either the container root or its named member. Shared by the Docker and
 * Podman/OCI owner resolvers.
 *
 * @param parts - Ordered path segments from a matched containerization
 * evidence path.
 * @param configDirectories - The calling resolver's own runtime-specific
 * config directory names (for example Docker's or Podman/OCI's set). Callers
 * must pass only their own set; passing a shared or combined set would let
 * one runtime's config directory names collapse the other runtime's evidence
 * to the monorepo root.
 * @returns The recognized monorepo root/member owner, or `null` when the path
 * does not begin with a supported monorepo container.
 *
 * @remarks Two-segment paths are known matched files directly under the
 * monorepo root. A second segment found in the caller's `configDirectories`
 * also belongs to that root. Other second segments are treated as arbitrary
 * member names. This path-only heuristic has no side effects and cannot
 * distinguish an application literally named after one of the caller's config
 * directory names (for example `docker` or `quadlet`) from that config
 * directory itself.
 */
function containerizationMonorepoOwnerPathFromParts({
  parts,
  configDirectories,
}: {
  parts: string[];
  configDirectories: Set<string>;
}): string | null {
  const [ownerRoot, ownerName] = parts;
  // Reject ordinary nested paths so they retain local parent-path ownership.
  if (!ownerRoot || !ownerName || !MONOREPO_OWNER_DIRECTORIES.has(ownerRoot)) {
    return null;
  }

  // Direct evidence and generic config folders belong to the monorepo root.
  if (parts.length === 2 || configDirectories.has(ownerName)) {
    return ownerRoot;
  }

  // Any other second segment is accepted as the arbitrary monorepo member name.
  return `${ownerRoot}/${ownerName}`;
}

/**
 * Returns the first path segment, falling back to the full path for malformed inputs.
 */
export function topLevelPath({ path }: { path: string }): string {
  return path.split('/')[0] ?? path;
}
