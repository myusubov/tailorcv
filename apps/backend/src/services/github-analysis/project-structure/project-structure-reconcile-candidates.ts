import type { DetectedAreaTechnology } from './project-structure-analyzer.types';
import type {
  AreaCandidate,
  DetectedAreaName,
} from './project-structure-detected-areas.types';

interface MetaParentPair {
  areaName: DetectedAreaName;
  parentName: DetectedAreaTechnology;
  metaNames: DetectedAreaTechnology[];
}

/**
 * Meta-framework / parent-framework pairs that reconciliation resolves when
 * they claim the same area name and owner path. `parentName` and each entry of
 * `metaNames` match the `primaryTech` segment of a candidate key; the parent is
 * dropped when any listed meta is present. A parent appears in exactly one row,
 * however many metas sit over it (React under both Next.js and React Router).
 *
 * Native Android and iOS are parents of every cross-platform host whose
 * bundled `android/`/`ios/` shell resolves to the host's owner (see
 * `resolveNearestMarkerOwner`). Only frameworks that have a detector belong in
 * `metaNames`: one without a detector never yields a candidate to match.
 */
const META_PARENT_PAIRS: MetaParentPair[] = [
  {
    areaName: 'Frontend app',
    parentName: 'React',
    metaNames: ['Next.js', 'React Router'],
  },
  { areaName: 'Frontend app', parentName: 'Vue', metaNames: ['Nuxt'] },
  { areaName: 'Frontend app', parentName: 'Svelte', metaNames: ['SvelteKit'] },
  { areaName: 'Mobile app', parentName: 'React Native', metaNames: ['Expo'] },
  { areaName: 'Backend API', parentName: 'Express.js', metaNames: ['NestJS'] },
  {
    areaName: 'Mobile app',
    parentName: 'Android',
    metaNames: ['Flutter', 'React Native', 'Expo'],
  },
  {
    areaName: 'Mobile app',
    parentName: 'iOS',
    metaNames: ['Flutter', 'React Native', 'Expo'],
  },
];

/**
 * Reconciles competing detected-area candidates that share one owner path, so a
 * meta-framework claim is kept and its parent-framework claim is dropped
 * (e.g. Next.js over React at the same path).
 *
 * Inputs: `candidates`, the shared map keyed
 * `${name}::${normalizePath(path)}::${primaryTech}` after
 * `applyDetectedAreaRules` has filled it.
 * Output: none.
 * Side effects: mutates `candidates` in place, deleting the key of every
 * parent listed in `META_PARENT_PAIRS` for a meta whose key is present.
 * Invariants: only candidates with the same area name and owner path compete
 * (an exact match, so a parent on a nested path is left alone); a parent
 * framework with no meta-framework claim on its path is left alone.
 * Ordering: iterates the live key iterator, so a key deleted before it is
 * reached is not visited as a meta. The table is written so this cannot change
 * the outcome: Expo is listed directly over Android and iOS, not only over
 * React Native.
 */
export function reconcileCandidates(candidates: Map<string, AreaCandidate>) {
  const keys = candidates.keys();

  for (const key of keys) {
    const [area, owner, primary] = key.split('::') as [
      DetectedAreaName,
      string,
      DetectedAreaTechnology,
    ];

    const allParents = META_PARENT_PAIRS.filter((pair) =>
      pair.metaNames.includes(primary),
    ).map((pair) => pair.parentName);

    for (const parent of allParents) {
      candidates.delete(`${area}::${owner}::${parent}`);
    }
  }
}
