import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

/**
 * Resolves the owner root for one unit-framework signal (Next.js, Nuxt.js, and
 * peers whose distinctive config file sits at the deployable unit root).
 *
 * Inputs:
 * - `path`: normalized repository path of a matched signal entry.
 * - `isAnchorSignal`: whether this signal is the framework's root-anchoring
 *   signal (e.g. `next.config.*`).
 * - `anchorOwners`: owner roots already resolved from anchor signals in the
 *   current detector run. Read-only here; the engine populates it in pass 1.
 *
 * Behavior:
 * - A path with no directory segment resolves to `.`, checked ahead of the
 *   anchor and fallback branches regardless of the other inputs.
 * - Anchor signal: the owner is the directory containing the anchor file
 *   (`.` at the repository root).
 * - Non-anchor signal: the owner is the longest entry in `anchorOwners` that
 *   encloses `path` (its nearest unit root). When no anchor encloses it,
 *   resolution falls back to `ownerPathForApplicationArea`.
 *
 * Invariant: every anchor signal must be resolved before any non-anchor
 * signal so `anchorOwners` is complete when the non-anchor branch reads it.
 * `applyDeclarativeAreaDetector` guarantees this by running anchor schemas in
 * a first pass and collecting their owners as it goes.
 */
export function resolveUnitRootOwner({
  path,
  isAnchorSignal,
  anchorOwners,
}: {
  path: string;
  isAnchorSignal: boolean;
  anchorOwners: ReadonlySet<string>;
}): string {
  const parts = path.split('/');

  if (parts.length <= 1) {
    return '.';
  }

  if (isAnchorSignal) {
    return parts.slice(0, -1).join('/');
  }

  if (anchorOwners.size > 0) {
    const filteredOwners = Array.from(anchorOwners).filter(
      (owner) => path === owner || path.startsWith(owner + '/'),
    );
    if (filteredOwners.length > 0) {
      const longestOwner = filteredOwners.reduce((longest, current) =>
        current.length > longest.length ? current : longest,
      );
      return longestOwner;
    }
  }

  return ownerPathForApplicationArea(path);
}
