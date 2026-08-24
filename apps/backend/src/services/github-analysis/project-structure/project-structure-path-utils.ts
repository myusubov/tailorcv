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
