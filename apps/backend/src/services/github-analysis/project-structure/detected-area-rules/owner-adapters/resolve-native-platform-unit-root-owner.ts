import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

/**
 * Resolves the owner root for one native-platform signal (React Native,
 * Flutter, Expo). Mirrors `resolveUnitRootOwner` with two differences: it
 * additionally resolves un-enclosed `android`/`ios` and `metro.config.*` paths
 * to the folder above them, which only these frameworks' evidence follows, and
 * it never lets a repository-root (`.`) anchor claim a path that no deeper
 * anchor encloses.
 *
 * Inputs:
 * - `path`: normalized repository path of a matched signal entry.
 * - `isAnchorSignal`: whether this signal is the framework's root-anchoring
 *   signal (e.g. `react-native.config.js`).
 * - `anchorOwners`: owner roots already resolved from anchor signals in the
 *   current detector run. Read-only here; the engine populates it in pass 1.
 * - `extraRootDirectories`: additional first-segment directory names to treat
 *   as workspace roots when the final fallback delegates to
 *   `ownerPathForApplicationArea` (e.g. `example`, for a library repo's demo
 *   app).
 *
 * Behavior:
 * - A path with no directory segment resolves to `.`, checked ahead of every
 *   other branch.
 * - Anchor signal: the owner is the directory containing the anchor file
 *   (`.` at the repository root), except a path ending in
 *   `app/_layout.(tsx|jsx|ts|js)` (Expo Router's root layout convention),
 *   which strips that `app/_layout.*` suffix -- and any `src` segment
 *   immediately enclosing it -- instead of taking the plain dirname.
 * - Non-anchor signal: the owner is the longest entry in `anchorOwners` that
 *   encloses `path`. A repository-root (`.`) anchor owner never encloses a
 *   path, so evidence under an un-anchored sub-app (`FabricExample/`) is not
 *   swallowed by the library root and reaches the path shapes below.
 * - When no anchor owner encloses the path, a path containing an
 *   `android`/`ios` path segment, or ending in a
 *   `metro.config.(js|cjs|mjs|ts)` file, resolves to everything before that
 *   segment/file -- both are React Native conventions whose containing
 *   directory is the actual project root regardless of what that directory
 *   is named, which a directory-name allowlist like
 *   `ownerPathForApplicationArea`'s cannot express (e.g. a bare
 *   `FabricExample/` example app nested under none of its recognized
 *   workspace roots).
 * - Anything else falls back to `ownerPathForApplicationArea`, forwarding
 *   `extraRootDirectories` when given.
 *
 * Invariant: every anchor signal must be resolved before any non-anchor
 * signal so `anchorOwners` is complete when the non-anchor branch reads it.
 * `applyDeclarativeAreaDetector` guarantees this by running anchor schemas in
 * a first pass and collecting their owners as it goes.
 */
export function resolveNativePlatformUnitRootOwner({
  path,
  isAnchorSignal,
  anchorOwners,
  extraRootDirectories,
}: {
  path: string;
  isAnchorSignal: boolean;
  anchorOwners: ReadonlySet<string>;
  extraRootDirectories?: readonly string[];
}): string {
  const parts = path.split('/');

  if (parts.length <= 1) {
    return '.';
  }

  if (isAnchorSignal) {
    if (/(^|\/)app\/_layout\.(tsx|jsx|ts|js)$/.test(path)) {
      const srcIndex = parts.lastIndexOf('src');
      let owner = '';
      if (srcIndex !== -1) {
        owner = parts.slice(0, srcIndex).join('/');
      } else {
        owner = parts.slice(0, -2).join('/');
      }
      if (owner.length === 0) {
        owner = '.';
      }
      return owner;
    }
    return parts.slice(0, -1).join('/');
  }

  const filteredOwners = Array.from(anchorOwners).filter(
    (owner) => path === owner || path.startsWith(owner + '/'),
  );
  if (filteredOwners.length > 0) {
    const longestOwner = filteredOwners.reduce((longest, current) =>
      current.length > longest.length ? current : longest,
    );
    return longestOwner;
  }

  if (/(^|\/)(android|ios)(\/|$)/.test(path)) {
    const bottomIndex =
      parts.lastIndexOf('android') !== -1
        ? parts.lastIndexOf('android')
        : parts.lastIndexOf('ios');

    // An empty prefix (the platform folder is the first segment) is the root.
    return parts.slice(0, bottomIndex).join('/') || '.';
  }

  if (/(^|\/)metro\.config\.(js|cjs|mjs|ts)$/.test(path)) {
    const bottomIndex = parts.findLastIndex((val) =>
      /^metro\.config\.(js|cjs|mjs|ts)$/.test(val),
    );

    // An empty prefix (the file is at the repository root) is the root.
    return parts.slice(0, bottomIndex).join('/') || '.';
  }

  return ownerPathForApplicationArea({ path, extraRootDirectories });
}
