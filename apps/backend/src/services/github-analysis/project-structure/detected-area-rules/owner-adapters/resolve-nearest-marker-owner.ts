import { ownerPathForApplicationArea } from '../../project-structure-path-utils';
import type { EntryIndex } from '../../project-structure-entry-index';

/**
 * Returns the segment count of an owner path so owners can be ranked by how
 * deeply they nest. The repository root `.` counts as 0 (not 1) so it ranks
 * below every real directory. Pure; assumes a normalized, `/`-separated path.
 */
const calculateDepth = (path: string): number => {
  if (path === '.') {
    return 0;
  }
  return path.split('/').length;
}

/**
 * Resolves the owner root for one native-mobile signal (Android, iOS) by
 * walking up from the anchor to the nearest ancestor directory that directly
 * holds a cross-platform host marker file, so a bundled `android/`/`ios/`
 * shell lands on the same owner as its Flutter, React Native, Expo,
 * Capacitor, or Ionic host instead of on its own wrapper directory. Nothing is
 * excluded: the shell still becomes a candidate, just on the host's owner.
 *
 * Inputs:
 * - `path`: normalized repository path of a matched signal entry.
 * - `isAnchorSignal`: whether this signal is the detector's owner-anchoring
 *   signal (e.g. `build.gradle`, `*.xcodeproj`).
 * - `anchorOwners`: owner roots already resolved from anchor signals in the
 *   current detector run. Read-only here; the engine populates it in pass 1.
 * - `markers`: patterns for host marker files, tested against each file
 *   entry's lowercased basename via `index.findFilesByNameMatching`, so a
 *   `^name$`-anchored pattern matches a marker at any depth.
 * - `index`: repository lookup used to find marker entries.
 *
 * Behavior:
 * - A path with no directory segment resolves to `.`, checked ahead of the
 *   anchor and fallback branches regardless of the other inputs.
 * - Anchor signal: walks from the anchor's own directory up to the repository
 *   root. The first ancestor that directly contains a marker entry (the
 *   entry's `parentPath` equals that ancestor, `null` for the root) is the
 *   owner (`.` for the root). With no marker found, the owner is the anchor's
 *   own directory (`.` at the repository root).
 * - Non-anchor signal: the owner is the deepest entry in `anchorOwners` (most
 *   path segments, `.` counting as 0) that encloses `path`; `.` encloses every
 *   path. Supportive signals therefore share their anchor's owner.
 * - When no anchor owner encloses the path, falls back to
 *   `ownerPathForApplicationArea`.
 *
 * Invariant: every anchor signal must be resolved before any non-anchor
 * signal so `anchorOwners` is complete when the non-anchor branch reads it.
 * `applyDeclarativeAreaDetector` guarantees this by running anchor schemas in
 * a first pass and collecting their owners as it goes.
 *
 * Limitations:
 * - Marker entries are gathered with one index scan per marker on every anchor
 *   call (not cached across calls), so cost grows with anchors x markers x
 *   index size.
 * - The walk does not require an `android`/`ios` segment, so any native anchor
 *   nested anywhere under a marker-holding directory resolves to that
 *   directory.
 * - Unlike `resolveUnitRootOwner`, it has no `extraRootDirectories` option and
 *   no `android`/`ios`/`metro.config` stripping fallback.
 */
export function resolveNearestMarkerOwner({
  path,
  isAnchorSignal,
  anchorOwners,
  markers,
  index,
}: {
  path: string;
  isAnchorSignal: boolean;
  anchorOwners: ReadonlySet<string>;
  markers: Array<RegExp>;
  index: EntryIndex;
}): string {
  const parts = path.split('/');

  if (parts.length <= 1) {
    return '.';
  }

  if (isAnchorSignal) {
    // Marker lookups do not depend on which ancestor is being tested, so scan
    // the index once per marker up front and keep only the directories that
    // directly hold a marker (`null` = repository root).
    const markerParentPaths = new Set<string | null>();
    for (const marker of markers) {
      for (const entry of index.findFilesByNameMatching({ pattern: marker })) {
        markerParentPaths.add(entry.parentPath);
      }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const candidateParentPath = i === 0 ? null : parts.slice(0, i).join('/');

      if (markerParentPaths.has(candidateParentPath)) {
        return candidateParentPath ?? '.';
      }
    }

    return parts.slice(0, -1).join('/') || '.';
  }

  if (anchorOwners.size > 0) {
    const filteredOwners = Array.from(anchorOwners).filter(
      (owner) =>
        owner === '.' || path === owner || path.startsWith(owner + '/'),
    );
    if (filteredOwners.length > 0) {
      const longestOwner = filteredOwners.reduce((longest, current) =>
       calculateDepth(current) > calculateDepth(longest) ? current : longest,
      );
      return longestOwner;
    }
  }

  return ownerPathForApplicationArea({ path });
}
