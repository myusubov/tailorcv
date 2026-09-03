# ADR 0003: Pluggable Owner Adapters with Anchor Signals

- **Status:** Accepted
- **Date:** 2026-09-03
- **Domain:** `docs/architecture/github-analysis/project-structure/`
- **Related changelog entry:** [Per-Framework Owner Adapters via Anchor Signals and a Two-Pass Engine](../changelog.md#per-framework-owner-adapters-via-anchor-signals-and-a-two-pass-engine)

---

## Context

Every detected area reports an owner path -- the root directory of one cohesive, independently deployable unit. The owner path is a grouping key: downstream stages merge evidence, deduplicate, and apply cross-detector vetoes on it, so for a given repository tree it must be deterministic.

On 2026-08-24 the analyzer removed a set of arbitrary per-technology owner-resolver functions (Podman/OCI deep-nested scans, Docker monorepo/config-folder contracts, per-database resolvers) in favour of the single generic `ownerPathForApplicationArea`, because those resolvers had accumulated bespoke, hard-to-audit path logic. That rule is recorded in the README as "no database/containerization/shared-package detector passes a custom owner resolver anymore."

The generic resolver works from monorepo container names (`apps/<name>`, `packages/<name>`) and the `src` boundary. It has no way to know that a framework's distinctive config file (`next.config.*`, `nuxt.config.*`) sits, by that framework's own contract, at the unit root. When a Next.js or Nuxt unit's evidence spreads across the config file plus nested convention files (`app/page.tsx`, `pages/_app.tsx`), each signal resolves independently and the config evidence can land on a different owner than the convention files -- fragmenting one application into two `Frontend app` candidates.

## Decision

Owner resolution is a concern separate from detection, and it is pluggable per framework shape -- but only through a bounded, reviewed mechanism, not free-form per-technology functions.

`applyDeclarativeAreaDetector` accepts an optional `ownerAdapter`. A detector that sets one also marks its root-anchoring schema with `isAnchorSignal: true`. The engine then resolves owners in two passes:

1. Anchor schemas are evaluated first. Each anchor signal's resolved owner is collected into a run-scoped `anchorOwners` set.
2. Non-anchor signals are resolved afterwards, against the now-complete `anchorOwners` set.

The first and only adapter is `resolveUnitRootOwner` (`detected-area-rules/owner-adapters/`), shared by the Next.js and Nuxt detectors:

- a path with no directory segment resolves to `.`;
- an anchor signal resolves to the directory containing the config file;
- a non-anchor signal resolves to the longest `anchorOwners` entry that encloses it (segment-boundary match; longest wins so nested units attribute to the innermost root), otherwise it falls back to `ownerPathForApplicationArea`.

The generic `ownerPathForApplicationArea` remains the default for every detector without an adapter and the fallback inside every adapter. Adapters live in one directory, one file per owner shape (not per framework); frameworks that share a shape share an adapter.

This does not reverse the 2026-08-24 consolidation. Containerization, database, and shared-package detectors still use the generic resolver only. The adapter mechanism is the deliberate, scoped exception for unit frameworks whose config file is a reliable root anchor.

## Considered Options

| Option | Tradeoff |
| --- | --- |
| Anchor signal plus two-pass adapter, generic resolver as default and fallback | Fixes fragmentation for config-anchored frameworks; keeps owner logic in one small reviewed directory; deterministic. Selected. |
| Keep the generic resolver everywhere | No new surface, but Next.js/Nuxt units with split evidence keep fragmenting into multiple candidates. |
| Walk upward from each evidence path to the nearest boundary marker (LSP-style root markers) | Matches common tooling, but an open-ended marker list is exactly the bespoke path logic 2026-08-24 removed, and upward walks are not obviously deterministic across trees. |
| Reintroduce free-form per-technology resolver functions | Maximum flexibility, but recreates the unauditable per-detector path logic the 2026-08-24 change deleted. |

## Consequences

- Next.js and Nuxt evidence for one unit groups under a single owner anchored on the config file.
- The engine has an ordering invariant: anchor schemas must be evaluated before non-anchor schemas when an adapter is set. `applyDeclarativeAreaDetector` enforces this by partitioning `entrySchemas` into anchor-first `orderedSchemas`.
- `resolveUnitRootOwner` reads `anchorOwners` but never mutates it; the engine owns the write, placed in the `resolveOwnerPath` callback next to the ordering that makes it correct.
- Adding a framework with the same shape (config file at the unit root) is a one-line change: set `isAnchorSignal` and pass `resolveUnitRootOwner`. A genuinely different shape gets a new adapter file, not new branches in an existing one.
- A future contributor must not "consolidate" `resolveUnitRootOwner` into the generic resolver citing the 2026-08-24 rule; that rule is scoped to containerization/database/shared-package detectors, and this ADR is the reason the adapter exists.
- `resolveUnitRootOwner` has unit coverage (`resolve-unit-root-owner.test.ts`) but no analyzer-output fixture exercises the two-pass end to end yet.

## References

- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/declarative-area-rule-engine.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-unit-root-owner.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-unit-root-owner.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.ts` (`ownerPathForApplicationArea`)
- [Containerization and Database Owner Resolvers Removed](../changelog.md#containerization-and-database-owner-resolvers-removed) (2026-08-24)
