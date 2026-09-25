# ADR 0005: Same-Owner Candidate Reconciliation Replaces Competing-Proof Vetoes

- **Status:** Accepted
- **Date:** 2026-09-24
- **Domain:** `docs/architecture/github-analysis/project-structure/`
- **Related changelog entry:** [Candidates Keyed per Primary Technology, `reconcileCandidates` Added, Competing-Proof Vetoes Removed](../changelog.md#candidates-keyed-per-primary-technology-reconcilecandidates-added-competing-proof-vetoes-removed)

---

## Context

Several detectors can claim one owner path with related technologies: a meta-framework and the framework it is built on (Next.js and React, Nuxt and Vue, Expo and React Native), and a cross-platform host and its bundled native shells (Flutter and native Android/iOS). Until now each broad or parent detector guarded itself with the engine's `competingProofSchemas` veto: it matched another framework's distinctive files and skipped any owner carrying them. That had three costs:

- Every detector had to know other detectors' signals, so the relationships were scattered across five detector files rather than stated once.
- The veto compared owners by exact equality, using an owner resolved from the proof file. It could not see an owner anchored inside the competing project's root, so the native Android and iOS detectors also needed anchor-regex exclusions for `android/`/`ios/`-wrapped projects (2026-09-19), which dropped genuinely native repositories that keep their project under `android/`.
- Merging was order-dependent. The candidate key was `${name}::${path}`, so the first detector to claim an owner fixed its `primary` technology and later claims only accumulated onto it.

## Decision

1. **Claims never merge.** The candidate key is `${name}::${normalizePath(path)}::${primaryTech}`. Two detectors claiming the same area name and owner path with different primary technologies leave two separate candidates.
2. **`reconcileCandidates` resolves them once, afterward.** `buildDetectedAreas` calls it right after `applyDetectedAreaRules`. It deletes a parent framework's candidate when a meta-framework candidate exists with the same area name and owner path, driven by one table (`META_PARENT_PAIRS`: area name, parent, list of metas). Only an exact owner-path match competes.
3. **Native shells are redirected, not excluded.** Android and iOS resolve a bundled shell's owner to its host's root through `resolveNearestMarkerOwner` (see [ADR 0003](0003-pluggable-owner-adapters-anchor-signals.md), 2026-09-24 update), so the shell shares the host's owner and step 2 removes it. Android and iOS are listed as parents of Flutter, React Native, and Expo.
4. **The veto machinery is removed.** `competingProofSchemas`, `CompetingProofSchema`, and `hasCompetingAreaProof` are deleted from the engine, and the React, Vue, Svelte, and React Native detectors no longer declare vetoes. Detectors stay ignorant of each other.

Future contributors should add a new meta/parent relationship as a row in `META_PARENT_PAIRS` and must not reintroduce per-detector proof lists.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| Keep per-detector `competingProofSchemas` vetoes | Already built, but relationships stay scattered, matching is by exact owner equality, and native hosts need path exclusions that create false negatives. |
| Keep `${name}::${path}` keys and merge, first writer keeps `primary` | Simple, but which technology is primary depends on dispatch order, and the losing claim is folded into `related` with no way to drop it deliberately. |
| Path-exclusion regexes for bundled native hosts (2026-09-19 design) | Cheap, but recognizes only a fixed wrapper depth and drops real native repositories under `android/`/`ios/`. |
| Key per primary technology plus one post-detection reconciliation table (chosen) | Detectors are independent and order no longer matters; costs a central table to maintain and a second pass. |

## Consequences

- Detector dispatch order no longer decides which claim survives on a shared owner.
- Relationships live in one table and are covered by key-level tests (`project-structure-reconcile-candidates.test.ts`), which the author ran and passed.
- Reconciliation depends on exact owner equality, so a parent on a nested path is kept.
- Hosts without a detector (Capacitor, Ionic, Cordova) are redirected at best but their native shells are not dropped; Cordova has no marker, so its shells stay standalone candidates.
- The engine's `checkForExistingCandidate` guard (Static frontend, Express.js) stopped matching on 2026-09-24 because `hasAreaCandidate` built its key without the primary technology. Fixed 2026-09-25: it now matches the `${name}::${normalizePath(path)}::` prefix across primary technologies.
- `resolveNearestMarkerOwner` initially found only a root-level marker, because markers were matched against the full path and nested hosts were not redirected. Fixed 2026-09-25: markers are matched by basename, so a nested host is recognized.
- Not verified: the nested-host cases in `project-structure-detected-area-rules.test.ts`, the 2026-09-25 fixes above, lint, typecheck, and the full backend suite.

## References

- `apps/backend/src/services/github-analysis/project-structure/project-structure-reconcile-candidates.ts`
- `apps/backend/src/services/github-analysis/project-structure/project-structure-reconcile-candidates.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/project-structure-detected-area-rules.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/project-structure-detected-area-candidates.ts` (`areaKey`, `addAreaScore`, `hasAreaCandidate`)
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-nearest-marker-owner.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/declarative-area-rule-engine.ts`
- [ADR 0003](0003-pluggable-owner-adapters-anchor-signals.md)
