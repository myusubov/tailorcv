/**
 * Normalizes repository tree paths for case-insensitive matching.
 * Keeps all path-based analyzers aligned on forward-slash lowercase lookups.
 */
export function normalizePath({ path }: { path: string }): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

/**
 * Monorepo workspace-root directory names whose immediate child is treated as a
 * distinct owning unit, resolving `<root>/<name>/...` evidence to `<root>/<name>`.
 *
 * `apps`, `packages`, and `libs` are the layout conventions shared by Nx,
 * Turborepo, and pnpm/npm/yarn workspaces; `services` is the common
 * microservice-monorepo root; `modules` covers DDD- and NestJS-style splits.
 * This is a superset of the shape-detection roots in `project-shape-detector.ts`
 * (`MONOREPO_ROOT_DIRECTORIES` plus its weak `services`): owner resolution also
 * trusts `modules` and treats `services` like any other root. Exported so
 * `resolveContainerRootOwner`'s infra-folder denylist stays derived from this
 * list rather than duplicating it.
 *
 * Order is not significant; membership is an exact single-segment match.
 */
export const MONOREPO_OWNER_ROOT_DIRECTORIES: readonly string[] = [
  'apps',
  'packages',
  'libs',
  'services',
  'modules',
];

/**
 * Returns the smallest useful owning root for app/package evidence paths.
 *
 * Inputs:
 * - `path`: a normalized (forward-slash) repository path of an evidence entry.
 * - `extraRootDirectories`: additional first-segment names to treat as
 *   workspace roots for this call only, on top of
 *   `MONOREPO_OWNER_ROOT_DIRECTORIES`. Lets a specific detector opt into roots
 *   that are too context-dependent to trust for every detector.
 *
 * Output: the owner root path.
 * - Paths under a recognized monorepo workspace root
 *   (`MONOREPO_OWNER_ROOT_DIRECTORIES` or `extraRootDirectories`) resolve to
 *   `<root>/<name>`, or to `<root>/@scope/<name>` when the segment after the
 *   root is an npm scope.
 * - Other paths containing a `src` segment resolve to the path up to (not
 *   including) that segment.
 * - Everything else resolves to the repository root, `.`.
 *
 * Limitations: the workspace-root match is depth-limited (one segment, or two
 * for an `@scope`), so a nested package such as
 * `packages/group/name/...` still resolves to `packages/group`.
 */
export function ownerPathForApplicationArea({
  path,
  extraRootDirectories = [],
}: {
  path: string;
  extraRootDirectories?: readonly string[];
}): string {
  const parts = path.split('/');

  if (
    parts[1] &&
    (MONOREPO_OWNER_ROOT_DIRECTORIES.includes(parts[0]) ||
      extraRootDirectories.includes(parts[0]))
  ) {
    if (parts[1].startsWith('@') && parts[2]) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }

    return `${parts[0]}/${parts[1]}`;
  }

  const srcIndex = parts.indexOf('src');
  if (srcIndex > 0) {
    return parts.slice(0, srcIndex).join('/');
  }

  return '.';
}
