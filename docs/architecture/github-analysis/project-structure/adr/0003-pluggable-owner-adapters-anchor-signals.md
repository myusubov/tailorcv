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

| Option                                                                                      | Tradeoff                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor signal plus two-pass adapter, generic resolver as default and fallback               | Fixes fragmentation for config-anchored frameworks; keeps owner logic in one small reviewed directory; deterministic. Selected.                                            |
| Keep the generic resolver everywhere                                                        | No new surface, but Next.js/Nuxt units with split evidence keep fragmenting into multiple candidates.                                                                      |
| Walk upward from each evidence path to the nearest boundary marker (LSP-style root markers) | Matches common tooling, but an open-ended marker list is exactly the bespoke path logic 2026-08-24 removed, and upward walks are not obviously deterministic across trees. |
| Reintroduce free-form per-technology resolver functions                                     | Maximum flexibility, but recreates the unauditable per-detector path logic the 2026-08-24 change deleted.                                                                  |

## Consequences

- Next.js and Nuxt evidence for one unit groups under a single owner anchored on the config file.
- The engine has an ordering invariant: anchor schemas must be evaluated before non-anchor schemas when an adapter is set. `applyDeclarativeAreaDetector` enforces this by partitioning `entrySchemas` into anchor-first `orderedSchemas`.
- `resolveUnitRootOwner` reads `anchorOwners` but never mutates it; the engine owns the write, placed in the `resolveOwnerPath` callback next to the ordering that makes it correct.
- Adding a framework with the same shape (config file at the unit root) is a one-line change: set `isAnchorSignal` and pass `resolveUnitRootOwner`. A genuinely different shape gets a new adapter file, not new branches in an existing one.
- A future contributor must not "consolidate" `resolveUnitRootOwner` into the generic resolver citing the 2026-08-24 rule; that rule is scoped to containerization/database/shared-package detectors, and this ADR is the reason the adapter exists.
- `resolveUnitRootOwner` has unit coverage (`resolve-unit-root-owner.test.ts`) but no analyzer-output fixture exercises the two-pass end to end yet.

## Update 2026-09-04: Adapter extended to backend frameworks and schema tools

The mechanism above is unchanged, but its scope has widened. `resolveUnitRootOwner` is now also passed by:

- **Backend frameworks** with a root-level project or CLI file: Django (`manage.py`), ASP.NET Core (`*.csproj`), Laravel (`artisan`).
- **Config-anchored frontend meta-frameworks:** Angular (`angular.json`), Astro (`astro.config.*`), React Router (`react-router.config.*`), SvelteKit (`svelte.config.*`).
- **Schema tools** with a root-level config file: Prisma (`prisma.config.*` only -- the `.config/prisma.*` variant stays a non-anchor match), Drizzle (`drizzle.config.*`), SQLAlchemy (`alembic.ini`), Sequelize (`.sequelizerc`), Knex (`knexfile.*`).

All fourteen detectors share the one adapter because their anchor file sits at the unit root -- the shape `resolveUnitRootOwner` already handles. No new adapter file was added.

(See the 2026-09-11 update below: a fifteenth detector, Jenkins, was added with a variant of this shape.)

This **narrows the Decision section's final paragraph**: database detectors no longer use the generic resolver only. Containerization and shared-package detectors still do. Detectors deliberately left on the generic resolver, with reasons:

- **TypeORM** -- `ormconfig.*` is deprecated and being removed; `data-source.ts` has no contract location (the CLI requires an explicit `-d` path) and its common `src/data-source.ts` placement sits below the unit root.
- **Spring Boot** -- `pom.xml` / `build.gradle` is a build-tool file, not Spring-specific, and Spring's `src/main/**` layout is already grouped correctly by the generic `src` boundary.
- **Rails** -- `config/application.rb` and `bin/rails` sit one directory below the unit root, which `resolveUnitRootOwner`'s one-segment anchor branch cannot resolve; Rails engine dummy apps (`spec/dummy`, `test/dummy`) would also false-positive.
- **Vue, standalone Svelte, plain React** -- delegate layout to the build tool; no framework-owned root config exists.

The "a future contributor must not consolidate `resolveUnitRootOwner` into the generic resolver" consequence now covers these detectors too.

See [Owner Adapters Extended to Backend Frameworks and Schema Tools](../changelog.md#owner-adapters-extended-to-backend-frameworks-and-schema-tools) (2026-09-04).

## Update 2026-09-08: Containerization carved out into its own adapter

The Docker containerization detector no longer uses the generic resolver only. It now passes a **non-anchor** `ownerAdapter`, `resolveContainerRootOwner`, with a fixed infra/tooling-folder denylist and a one-directory-deep rule; the shared `ownerPathForApplicationArea` was widened (workspace-root array, `@scope` depth, an optional `extraRootDirectories` argument) in the same change. Docker has no contract-located config file, so this is deliberately not the anchor-signal mechanism above -- it is a separate decision recorded in [ADR 0004](0004-containerization-owner-resolution.md).

This narrows this ADR's Decision paragraph and its 2026-09-04 update once more: **only Podman/OCI and the (now removed) shared-package detector** were left on the generic resolver by that update; containerization is covered by ADR 0004. The "a future contributor must not consolidate an adapter into the generic resolver" consequence extends to `resolveContainerRootOwner`.

See [Containerization Owner Resolution via `resolveContainerRootOwner`](../changelog.md#containerization-owner-resolution-via-resolvecontainerrootowner) (2026-09-08).

## Update 2026-09-10: Podman/OCI also carved out

The Podman/OCI containerization detector now passes `resolveContainerRootOwner` as well (see [ADR 0004](0004-containerization-owner-resolution.md)'s 2026-09-10 update), so the 2026-09-08 update's "only Podman/OCI and the (now removed) shared-package detector were left on the generic resolver" no longer holds -- among the detectors this ADR governs, only TypeORM, Spring Boot, Rails, Vue, standalone Svelte, and plain React still resolve owners through the generic resolver only, each for the reasons in the 2026-09-04 update.

See [Podman/OCI Containerization Owner Resolution via `resolveContainerRootOwner`](../changelog.md#podmanoci-containerization-owner-resolution-via-resolvecontainerrootowner) (2026-09-10).

## Update 2026-09-11: Jenkins added, with a variant anchor shape

`resolveUnitRootOwner` is now also passed by the Jenkins CI/CD detector, with `isAnchorSignal: true` on its `jenkins-pipeline-file` schema -- bringing the shared-adapter count from fourteen to fifteen.

Jenkins does not fit the "config file sits at the unit root" shape the other fourteen detectors share: a `Jenkinsfile` can live at any depth (a root single-pipeline repo, or one per service in a multibranch monorepo), so there is no single fixed root to anchor on. Instead, every matched `Jenkinsfile` is treated as its own anchor -- `resolveUnitRootOwner`'s anchor branch already resolves an anchor signal to the directory containing it, with no assumption that anchors are unique per repository. This makes Jenkins the only CI/CD provider (and, among all detectors on this adapter, the only one at all) that can emit more than one `CI/CD workflows` candidate for a single repository.

This does not change the adapter's mechanism or its non-anchor resolution branch; it is a new way of *using* an existing branch, not new adapter logic. The other ten CI/CD providers (GitHub Actions, GitLab CI/CD, CircleCI, Azure Pipelines, Buildkite, Travis CI, Bitbucket Pipelines, Drone CI/Woodpecker CI, AppVeyor, TeamCity) resolve to the repository root through the generic resolver and pass no `ownerAdapter`, consistent with the "generic resolver is the default and fallback" Decision above.

See [CI/CD Workflows Detected-Area Category](../changelog.md#cicd-workflows-detected-area-category) (2026-09-11).

## Update 2026-09-12: Expo added, with a below-the-root anchor shape and per-call `extraRootDirectories`

`resolveUnitRootOwner` is now also passed by the Expo mobile detector, with `isAnchorSignal: true` on three signals -- bringing the shared-adapter count from fifteen to sixteen. Two of Expo's three anchors (`expo-router-typed-env` / `expo-env.d.ts`, `expo-dynamic-config` / `app.config.(ts|js)`) sit at the unit root exactly like every other detector on this adapter. The third does not, which this ADR's Decision section did not previously anticipate.

- **Below-the-root anchor shape.** `expo-router-root-layout` matches `app/_layout.(tsx|jsx|ts|js)`. Expo Router requires a directory literally named `app` to hold it, and since Expo SDK 55 the default template nests that directory one level deeper still, at `src/app` -- so the file is never itself at the project root the way `next.config.ts` or `Jenkinsfile` is. The anchor branch now special-cases this exact path shape: instead of "the directory containing the anchor file" (the Decision section's original rule, no longer universally true), it strips the matched `app/_layout.*` suffix and any `src` segment immediately enclosing it, so `app/_layout.tsx` -> `.`, `src/app/_layout.tsx` -> `.`, `apps/mobile/app/_layout.tsx` -> `apps/mobile`, and `apps/mobile/src/app/_layout.tsx` -> `apps/mobile`. The branch identifies this shape by testing `path` against the same regex the entry schema already uses, not by threading a signal-type identifier through the engine -- the path shape alone is unique to this one signal among Expo's own six and every other detector on this adapter, mirroring how `resolveContainerRootOwner` ([ADR 0004](0004-containerization-owner-resolution.md)) already distinguishes Docker from Podman/OCI shapes by regex rather than by signal name.
- **Per-call `extraRootDirectories`.** `resolveUnitRootOwner` gained an optional `extraRootDirectories?: readonly string[]` parameter, forwarded to the non-anchor fallback's `ownerPathForApplicationArea` call. Expo passes `['example']`, so a library repo's demo app (`example/eas.json`, or a nested `example/basic/eas.json` -- the `create-expo-module` convention) resolves to `example`/`example/basic` rather than the repository root when no anchor nearby already claims it. The name is not added to the shared `MONOREPO_OWNER_ROOT_DIRECTORIES` constant, since `example` is not a general monorepo convention every caller of this shared resolver should inherit -- only Expo passes it.

Both changes are additive: neither the new path-shape branch nor an unset `extraRootDirectories` changes the resolved owner for any of the fifteen existing callers.

See [Mobile App Detected-Area Category](../changelog.md#mobile-app-detected-area-category-expo-implemented) (2026-09-12).

## Update 2026-09-14: React Native added, no new mechanism

`resolveUnitRootOwner` is now also passed by the React Native (bare CLI, no meta-framework) mobile detector, with `isAnchorSignal: true` on its single `react-native-cli-config` (`react-native.config.js`) signal -- bringing the shared-adapter count from sixteen to seventeen.

Unlike Expo, React Native introduces no new adapter logic. Its one anchor sits directly at the unit root by the React Native CLI's own contract -- the plain "directory containing the anchor file" shape the Decision section already describes, with no below-the-root stripping needed. It also passes the same `extraRootDirectories: ['example']` the 2026-09-12 update added, for the identical library-demo-app convention observed in RN native-module libraries (react-native-webview and peers), reusing the parameter unchanged rather than widening it. This is a new *caller* of both existing branches, not new adapter logic, mirroring how the 2026-09-11 Jenkins update was a new way of using an existing branch.

This is additive: React Native's addition changes the resolved owner for none of the sixteen existing callers.

See [React Native (Bare CLI) Detected-Area Detector](../changelog.md#react-native-bare-cli-detected-area-detector) (2026-09-14).

## Update 2026-09-16: general path-shape fallback for React Native's non-anchor signals, and a restored anchor-dirname regression

The 2026-09-14 update's "no new adapter logic" claim held only for React Native's one anchor signal; it did not anticipate the non-anchor signals (`android-native-shell`, `ios-native-shell`, `metro-bundler-config`). Real evidence surfaced a gap the Decision section's mechanism could not close: `software-mansion/react-native-screens`' `FabricExample/` and `TVOSExample/`, and `react-native-picker/picker`'s `FabricExample/`, are complete, independently-native example apps with no `react-native.config.js` of their own and no enclosing `anchorOwners` entry, so their evidence fell through to `ownerPathForApplicationArea`'s directory-name allowlist -- which does not, and structurally cannot, recognize an arbitrary example-app directory name it has never been told about, and returned the repository root instead.

`resolveUnitRootOwner` gained two new, signal-agnostic fallback branches, tried after the `anchorOwners` lookup finds no enclosing owner and before the generic `ownerPathForApplicationArea` call:

- A path containing an `android` or `ios` path segment (`/(^|\/)(android|ios)(\/|$)/`) resolves to everything before that segment, since a committed native platform folder is always the immediate child of its owning app root regardless of what that root directory is named.
- A path ending in `metro.config.(js|cjs|mjs|ts)` resolves to its own immediate parent directory, for the same reason: Metro requires its config at the actual project root, so wherever the file is found, its dirname is the owner -- at any nesting depth, not merely a fixed number of segments.

Both branches are evaluated for every caller of this shared resolver, not gated to React Native's signals, since the underlying conventions (a native platform folder, a Metro config file) are not React-Native-exclusive path shapes -- any current or future detector whose evidence takes one of these two shapes benefits the same way. Anchor-verified ownership still wins when available: both branches sit strictly after the `anchorOwners` lookup, so a real anchor's more specific owner is never overridden by this path-shape heuristic.

Separately, this pass also restored `return parts.slice(0, -1).join('/');` as the anchor branch's fallthrough for any anchor signal that is not the `app/_layout` special case -- the plain "directory containing the anchor file" rule the Decision section has always described. It had been dropped from the anchor branch during the same edit that introduced the two fallback branches above, which (before the restoration) caused every non-`app/_layout` anchor signal with an unrecognized parent directory name (e.g. `mobile/react-native.config.js`) to fall through to the same generic-resolver gap this update otherwise fixes for non-anchor signals. This is a regression fix, not a new decision -- the rule itself is unchanged from the original Decision section.

Covered by 3 new cases in `resolve-unit-root-owner.react-native.test.ts` (`FabricExample`/`TVOSExample`/picker's `FabricExample`, each asserting `android-native-shell`, `ios-native-shell`, and `metro-bundler-config` evidence). Not yet re-verified against the full backend test suite as part of this pass -- see the changelog entry for outstanding verification.

See [React Native Owner Resolution: Path-Shape Fallback for Unanchored Example Apps](../changelog.md#react-native-owner-resolution-path-shape-fallback-for-unanchored-example-apps) (2026-09-16).

## References

- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/declarative-area-rule-engine.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-unit-root-owner.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-unit-root-owner.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-unit-root-owner.expo.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-unit-root-owner.react-native.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.ts` (`ownerPathForApplicationArea`)
- [Containerization and Database Owner Resolvers Removed](../changelog.md#containerization-and-database-owner-resolvers-removed) (2026-08-24)
