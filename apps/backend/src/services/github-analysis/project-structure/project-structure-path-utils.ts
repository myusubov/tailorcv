import type { RepoTreeEntry } from './project-structure-analyzer.types';

const DATABASE_MONOREPO_OWNER_DIRECTORIES = new Set([
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
};

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

  return DATABASE_MONOREPO_OWNER_DIRECTORIES.has(ownerRoot)
    ? `${ownerRoot}/${ownerName}`
    : null;
}

/**
 * Returns the first path segment, falling back to the full path for malformed inputs.
 */
export function topLevelPath({ path }: { path: string }): string {
  return path.split('/')[0] ?? path;
}
