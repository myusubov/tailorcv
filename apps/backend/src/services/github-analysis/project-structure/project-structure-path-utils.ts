import type { RepoTreeEntry } from './project-structure-analyzer.types';

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

/**
 * Returns the first path segment, falling back to the full path for malformed inputs.
 */
export function topLevelPath({ path }: { path: string }): string {
  return path.split('/')[0] ?? path;
}
