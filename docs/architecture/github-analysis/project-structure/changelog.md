# GitHub Project Structure Analyzer Changelog

> Chronological implementation history for the GitHub Project Structure Analyzer. Add new project-structure entries at the top.

Older implementation history is preserved in [changelog-archive.md](changelog-archive.md).

---

## 2026-08-29

### Summary Gains Structure-Inferred Languages and Root Manifests

- **Decision:** Add two path-only descriptive fields to `ProjectStructureSummary` -- `detectedLanguages` (programming languages present, from file extensions) and `rootManifests` (dependency manifests at the repository root, with ecosystem) -- as their own detectors rather than folding them into `inferredStack` or `detectedAreas`.
- **Problem:** Language mix and root dependency-manifest presence are useful descriptive signals for the future evidence aggregator and dependency/config analyzer, but nothing in the analyzer produced them: `detectedAreas` detectors are per-framework and never emit a repository-wide language list or a manifest inventory, and `inferredStack` is explicitly non-authoritative and slated for later supersession.
- **Solution:**
  1. Added `language-detector.ts` with `detectLanguages(entries)`: a static lowercase extension-to-language map (14 languages) accumulated into a `Set` over file entries, returned de-duplicated and sorted by name (matching `inferredStack`). `.h` is attributed to C; unmapped extensions are ignored.
  2. Added `root-manifest-detector.ts` with `detectRootManifests(entries)`: a static lowercase manifest-filename-to-ecosystem map matched against `depth === 0` file entries only, returned as `{ file, ecosystem }[]` sorted by filename. Per-package monorepo manifests are intentionally left for the dependency/config analyzer.
  3. Added `RootManifest` and `RootManifestEcosystem` to `project-structure-analyzer.types.ts`, added `detectedLanguages: string[]` and `rootManifests: RootManifest[]` to `ProjectStructureSummary`, wired both detectors into `buildProjectStructureSummary`, and re-exported the two new types from the analyzer barrel.
  4. Changed `normalizeTreeEntries` in `apps/backend/src/utils/github-utils.ts` to lowercase `extension` at normalization so extension-keyed lookups are case-insensitive by default; `EntryIndex` already lowercased its own extension set.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/language-detector.ts` (new), `root-manifest-detector.ts` (new), `project-structure-analyzer.types.ts`, `project-structure-summary.ts`, `project-structure-analyzer.ts`, `apps/backend/src/utils/github-utils.ts`, this README and changelog.
- **Outcome:** `summary.detectedLanguages` and `summary.rootManifests` now flow through the analyzer result and the temporary analyze endpoint. No consumer reads them yet; both are additive. The stale `AnalyzeGithubRepositoriesOutput`/`AnalyzeGithubReposOutput` request/response types were left unchanged pending a real endpoint contract.

### React Migrated onto the Declarative Engine (`and` Conjunction Node Added)

- **Decision:** Add an `and` node to the engine's `ConditionShape` so a single gate node can AND together multiple independent sub-conditions, then migrate the React frontend detector -- the last frontend detector still hand-written -- onto `applyDeclarativeAreaDetector`.
- **Problem:** `ConditionShape` allowed only one `hasOneOf` array per node and its sole recursive combinator (`or`) is disjunctive, so it could not express React's Create React App shape: `public/index.html` AND (`src/index.js` OR `src/index.jsx`) AND (`src/App.js` OR `src/App.jsx`) -- two independent OR-groups ANDed in one branch. Collapsing the OR-groups would have changed detection precision, so React stayed hand-written.
- **Solution:**
  1. Added `and?: ConditionShape<Signal>[]` to `ConditionShape` and a conjunctive branch to `evaluateCondition` (`and.every(evaluateCondition)`), mirroring the existing disjunctive `or` branch (`or.some(...)`); an absent or empty `and` contributes `true`. Added a docstring to `evaluateCondition`. Removed the now-unused `logger` import.
  2. Migrated `addReactFrontendAreas` (`detected-area-rules/frontend/react-frontend-area-rules.ts`) onto `applyDeclarativeAreaDetector`: the eleven finders became `entrySchemas`, the two competing-proof helpers became inline `competingProofSchemas`, and `hasReactAppShape`'s three-branch boolean gate became a three-branch `ConditionShape` `or` -- Vite React shell (`hasAllOf`), CRA shell (`has` + `and` of two `hasOneOf` groups), and structured React layout (`has` + `hasOneOf`). Removed `hasReactAppShape`.
  3. Deleted `detected-area-rules/frontend/frontend-area-competing-proof.ts`; its Next.js and React Router proof helpers were React's only remaining consumers (the Nuxt and SvelteKit helpers were already dead after earlier waves inlined their `competingProofSchemas`).
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/declarative-area-rule-engine.ts`, `detected-area-rules/frontend/react-frontend-area-rules.ts`, `detected-area-rules/frontend/frontend-area-competing-proof.ts` (deleted), this README and changelog.
- **Outcome:** 23 of the real framework/database/containerization/test detectors are now pure declarative config; only ASP.NET Core (per-entry exclusion predicate) remains permanently hand-written. React's dispatch order, signal scores, competing-proof veto, and gated emission behavior are unchanged; the existing React analyzer fixtures were not re-run. Typecheck/lint/tests were not run as part of this change.

### Static Frontend and Express Migrated onto the Declarative Engine (Shared-Candidate-Map Veto Added)

- **Decision:** Add a `checkForExistingCandidate` flag to `applyDeclarativeAreaDetector` that vetoes an owner already claimed for the same detected area in the shared candidate map, then migrate the two detectors previously left hand-written solely for that reason (Static frontend, Express).
- **Problem:** The 2026-08-27 migration left Static frontend and Express permanently hand-written because each vetoes its own emission based on whether a stronger detector already claimed the same owner in the shared output candidate map (`hasAreaCandidate`), not on raw repository file evidence. `applyDeclarativeAreaDetector` only supported `competingProofSchemas`, which re-scans the repository file index and has no mechanism to query emitted-candidate state. Both detectors' shape gates were otherwise already expressible as nested `ConditionShape` (OR-of-AND with at most two nested OR-groups per node).
- **Solution:**
  1. Added `checkForExistingCandidate?: boolean` to `applyDeclarativeAreaDetector`. When `true`, the per-owner loop skips any owner for which `hasAreaCandidate({ candidates, name: detectedArea, path: ownerPath })` is already true, before the `competingProofSchemas` and `gateBlocker` checks; it is evaluated independently of `competingProofSchemas`. Default (unset) behavior is unchanged for the 20 already-migrated detectors.
  2. Migrated `addStaticFrontendAreas` (`detected-area-rules/frontend/static-frontend-area-rules.ts`) onto `applyDeclarativeAreaDetector` with `checkForExistingCandidate: true`; translated `hasStaticContentShape`'s four-branch boolean gate (root index+CSS, index+`css/` directory stylesheet, multi-page HTML+any CSS, index+`src/` CSS+Vite config) into a four-branch `ConditionShape` and removed the hand-written finder blocks, `countAreaRuleSignal` loops, and helper.
  3. Migrated `addExpressBackendAreas` (`detected-area-rules/backend/express-backend-area-rules.ts`) the same way; translated `hasExpressBackendShape`'s three-branch gate (generator shape, layered API shape, server-owned API shape) into a three-branch `ConditionShape` and removed `hasExpressBackendShape`. The layered-API branch uses one `hasOneOf` group plus one `or` group in a single node, within the documented two-OR-group-per-node capacity.
  4. Updated the `applyDeclarativeAreaDetector` docstring to document `checkForExistingCandidate`, and replaced the two migrated detectors' docstrings that referenced the now-removed hand-written helpers.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/declarative-area-rule-engine.ts`, `detected-area-rules/frontend/static-frontend-area-rules.ts`, `detected-area-rules/backend/express-backend-area-rules.ts`, this README and changelog.
- **Outcome:** 22 of the real framework/database/containerization/test detectors are now pure declarative config; only ASP.NET Core (per-entry exclusion predicate) and React (two independent OR-of-AND groups ANDed in one gate node) remain permanently hand-written. Dispatch order and per-owner emission behavior are unchanged; the existing Static and Express analyzer fixtures were not re-run. Typecheck/lint/tests were not run as part of this change.

## 2026-08-28

### Laravel, Rails, and Spring Boot Migrated onto the Declarative Engine (Related-Tech Primitive Added)

- **Decision:** Add a `dynamicRelatedTechMap` primitive to `applyDeclarativeAreaDetector` instead of a general per-owner related-tech callback, then migrate the three detectors previously left hand-written solely because of dynamic related technology (Spring Boot, Laravel, Rails).
- **Problem:** The 2026-08-27 migration left Spring Boot, Laravel, and Rails permanently hand-written because none could declare related technology that depends on which files were actually matched (Blade/ERB view presence, Java/Kotlin source extension) -- `applyDeclarativeAreaDetector` only supported a static `relatedTechs` array. Laravel and Rails already had a discrete, unambiguous signal for the conditional case (`laravel-blade-view`, `rails-erb-view`); Spring Boot's six source-file signals (main application, web controller, REST resource, data repository, service, configuration class) each matched both `.java` and `.kt` under one signal type, so no counted signal could distinguish the language.
- **Solution:**
  1. Added `dynamicRelatedTechMap?: Partial<Record<Signal, DetectedAreaTechnology>>` to `applyDeclarativeAreaDetector`: for every signal counted for an owner that has an entry in the map, its technology is unioned into that owner's related technologies alongside any static `relatedTechs`.
  2. Migrated `addLaravelBackendAreas` and `addRailsBackendAreas` onto `applyDeclarativeAreaDetector` with signal shape unchanged -- `dynamicRelatedTechMap: { 'laravel-blade-view': 'Blade' }` and `{ 'rails-erb-view': 'ERB' }` replace the hand-written `hasBladeView`/`hasErbView` ternaries; their gates translate directly to nested `ConditionShape` with no new engine surface.
  3. Split each of Spring Boot's six language-ambiguous signals into `-java`/`-kotlin` variants (e.g. `spring-boot-main-application` becomes `spring-boot-main-application-java`/`-kotlin`), each scored identically to the original unsplit signal, and mapped all twelve split signals to `Java`/`Kotlin` in `dynamicRelatedTechMap`. Migrated `addSpringBootBackendAreas` onto `applyDeclarativeAreaDetector`, translating `hasSpringBootBackendShape`'s three-branch boolean gate into a four-branch `ConditionShape` (one branch needed splitting into two because it ANDs three independent OR-groups together, one more than a single `ConditionShape` node's `hasOneOf`+`or` capacity absorbs). Removed `hasSpringBootBackendShape`, `addLanguageEvidence`, and the parallel `springBootLanguagesByOwner` map entirely.
  4. Corrected the `applyDeclarativeAreaDetector` docstring, which did not mention `dynamicRelatedTechMap`.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/declarative-area-rule-engine.ts`, `detected-area-rules/backend/laravel-backend-area-rules.ts`, `detected-area-rules/backend/rails-backend-area-rules.ts`, `detected-area-rules/backend/spring-boot-backend-area-rules.ts`, this README and changelog.
- **Outcome:** 20 of the real framework/database/containerization/test detectors are now pure declarative config; only ASP.NET Core, React, Static frontend, and Express remain hand-written, for reasons unrelated to related technology (a per-entry exclusion predicate, a two-independent-OR-groups condition in one gate node, and gating on the shared candidate map instead of raw file evidence). An owner with both a Java file and a Kotlin file in the same Spring Boot signal category (e.g. one Java controller and one Kotlin controller) now scores that category's points twice instead of once, since the two extensions are now distinct signal types -- a minor, accepted scoring change limited to mixed-language owners. Typecheck/lint/tests were not run as part of this change.

## 2026-08-27

### Declarative Area-Rule Engine Migration Completed (17 Detectors, Two Waves)

- **Decision:** Migrate every framework/database/containerization/test detector that fits the existing `applyDeclarativeAreaDetector` schema onto it, and leave the detectors that genuinely need capabilities the engine does not have as permanent hand-written exceptions rather than extending the engine to cover them.
- **Problem:** Following the Next.js pilot, `applyDeclarativeAreaDetector` had no emission gate and was proven on only one detector, while the rest of the ~24 real detectors each still hand-rolled their own `findX` calls, `countAreaRuleSignal` loops, and shape-gate functions. A full survey found that most detectors' gates are expressible with a small set of AND/OR primitives, but four kinds of detector needs genuinely exceed what a static, per-owner-agnostic schema can declare.
- **Solution:**
  1. Added `gateBlocker` (an arbitrarily nested `hasAllOf`/`hasOneOf`/`has`/`or` condition, evaluated per owner via `evaluateCondition`) and `competingProofSchemas` (a raw file-evidence veto against a sibling framework's proof paths) to `applyDeclarativeAreaDetector`, matching the shape checks Next.js and Vue.js already needed.
  2. Migrated 10 detectors with a flat gate and no competing proof (Prisma, Drizzle, Knex, Sequelize, SQLAlchemy, TypeORM, Nuxt, Astro, Docker, Jest).
  3. Migrated 7 detectors needing nested `gateBlocker` conditions or `competingProofSchemas` (Svelte, React Router, Angular, SvelteKit, Django, JS/TS shared package, Podman/OCI), each hand-verified against its original boolean gate before being written as a `ConditionShape`.
  4. Left 7 detectors permanently hand-written because they need a capability the engine does not support: dynamically determined related technology per owner (Spring Boot, Laravel, Rails), gating on the shared candidate map instead of raw file evidence (Static frontend, Express), a per-entry exclusion predicate (ASP.NET Core), and a two-independent-OR-groups condition shape in one gate node (React).
  5. Corrected stale docstrings on `applyDeclarativeAreaDetector` and `addJestTestAreas` that no longer matched their implemented gating behavior.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/declarative-area-rule-engine.ts` and the 17 migrated detector files under `detected-area-rules/{database,frontend,backend,containerization,shared-package,test}/`, plus this README and changelog.
- **Outcome:** 17 of the real framework/database/containerization/test detectors are now pure declarative config with no engine changes required to support them; dispatch order and per-owner emission behavior are unchanged. The 7 hand-written exceptions and 5 dispatched stub detectors are unchanged by this migration. Typecheck/lint/tests were not run as part of this change.

## 2026-08-26

### Declarative Area-Rule Engine Started (Next.js Pilot, In Progress)

- **Decision:** Introduce a generic schema-driven detector runner, `applyDeclarativeAreaDetector` in `detected-area-rules/declarative-area-rule-engine.ts`, so framework detectors can declare their signal-to-regex/index-method mapping as data instead of hand-writing a `findX` call plus `countAreaRuleSignal` loop per signal.
- **Problem:** Every per-framework detector repeats the same shape -- one `index.findXByYMatching` call, one `countAreaRuleSignal` loop, and one final loop over the owner candidate map calling `addAreaScore` -- for each signal type, which the maintainer wants to reduce to a declared list of `{ signalType, regex, indexMethod }` entries.
- **Solution:**
  1. Added `applyDeclarativeAreaDetector`, which takes `entrySchemas`, `signalScores`, `detectedArea`, `primaryTech`, and optional `relatedTechs`, runs the matching `index` method per schema entry, scores each match with the existing `countAreaRuleSignal`, and adds a candidate for every owner with at least one matched signal.
  2. Migrated `addNextFrontendAreas` (`detected-area-rules/frontend/next-frontend-area-rules.ts`) to call it as the first pilot conversion.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/declarative-area-rule-engine.ts`, `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/frontend/next-frontend-area-rules.ts`, `docs/architecture/github-analysis/project-structure/README.md`, `docs/architecture/github-analysis/project-structure/changelog.md`.
- **Outcome:** Incomplete. `applyDeclarativeAreaDetector` has no per-detector emission gate: it adds a candidate for every owner with any matched signal, so the migrated Next.js detector no longer enforces the `hasNextAppShape` rule (config, App Router core, or Pages Router special proof required) documented in this README's Detected Area Generation rules -- that gating function is now defined in `next-frontend-area-rules.ts` but never called. `next-frontend-area-rules.ts` also carries leftover unused imports (`countAreaRuleSignal`, `createAreaRuleCandidateMap`) and the new engine file has a duplicated `EntrySchema` interface declaration and a commented-out gate call from the migration draft. Only Next.js is migrated; no other framework detector has been converted, and none of the other detectors' bespoke emission gates (Nuxt, Vue, React, static, etc.) have an equivalent in the declarative schema yet. Typecheck/lint/tests were not run as part of this documentation pass.

### Submodule Entries Excluded from `maxDepth`

- **Problem:** `buildProjectStructureSummary`'s `maxDepth` calculation reduced over every normalized entry, including `submodule`-type entries, so a repository with a deeply nested Git submodule reported a `maxDepth` reflecting the submodule's mount depth rather than the depth of real tracked files and directories.
- **Solution:** Filtered out `type === 'submodule'` entries before the `maxDepth` reduce in `project-structure-summary.ts`.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/project-structure-summary.ts`, `docs/architecture/github-analysis/project-structure/changelog.md`.
- **Outcome:** `summary.maxDepth` now reflects real file/directory nesting depth and is unaffected by submodule mount points.

## 2026-08-24

### Containerization and Database Owner Resolvers Removed

- **Decision:** Resolve every detected-area owner path -- Docker, Podman/OCI, Prisma, Drizzle, Knex, SQLAlchemy, TypeORM, Sequelize, and JS/TS shared-package evidence -- through the single shared `ownerPathForApplicationArea` resolver instead of a dedicated per-technology resolver.
- **Problem:** Per explicit maintenance request, the specialized owner-path resolvers in `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.ts` (`ownerPathForBackendArea`, `ownerPathForConfigArea`, `ownerPathForDatabaseArea`, `ownerPathForDrizzleDatabaseArea`, `ownerPathForKnexDatabaseArea`, `ownerPathForSqlAlchemyDatabaseArea`, `ownerPathForTypeOrmDatabaseArea`, `ownerPathForSequelizeDatabaseArea`, `ownerPathForSharedPackageArea`, `ownerPathForDockerContainerizationArea`, `ownerPathForPodmanOciContainerizationArea`, plus the already-unused `parentPathOrSelf`/`topLevelPath` helpers and their private constant sets) were removed, leaving only `normalizePath` and `ownerPathForApplicationArea`.
- **Solution:**
  1. Removed every function above from `project-structure-path-utils.ts` except `normalizePath` and `ownerPathForApplicationArea`.
  2. Removed the `resolveOwnerPath: ownerPathForXxxArea` argument and its matching import from every `countAreaRuleSignal` call in `detected-area-rules/containerization/docker-containerization-area-rules.ts`, `detected-area-rules/containerization/podman-oci-containerization-area-rules.ts`, `detected-area-rules/database/knex-database-area-rules.ts`, `detected-area-rules/database/prisma-database-area-rules.ts`, `detected-area-rules/database/sqlalchemy-database-area-rules.ts`, `detected-area-rules/database/typeorm-database-area-rules.ts`, `detected-area-rules/database/drizzle-database-area-rules.ts`, `detected-area-rules/database/sequelize-database-area-rules.ts`, and `detected-area-rules/shared-package/js-ts-shared-package-area-rules.ts`; each call now relies on `countAreaRuleSignal`'s existing `resolveOwnerPath?.(path) ?? ownerPathForApplicationArea(path)` fallback, so no call site was deleted.
  3. Emptied `project-structure-path-utils.test.ts`, which exclusively covered the two removed containerization resolvers.
  4. Corrected the stale `@link` reference and owner-resolution description in `podman-oci-containerization-area-rules.ts`, and annotated the affected bullet in `docs/architecture/github-analysis/project-structure/adr/0002-podman-oci-containerization-gate.md` rather than rewriting its original decision record.
- **Affected files:** `project-structure-path-utils.ts`, `project-structure-path-utils.test.ts`, the nine call-site rule files listed above, `docs/architecture/github-analysis/project-structure/README.md`, `docs/architecture/github-analysis/project-structure/adr/0002-podman-oci-containerization-gate.md`, `docs/architecture/github-analysis/project-structure/changelog.md`.
- **Outcome:** Every detected-area detector now resolves owners through one shared, less precise heuristic (`apps/*`, `packages/*`, `src`-relative, or repository root `.`). The deep-nested Podman/OCI config-directory scan, the Docker monorepo/config-folder contract, and every database technology's dedicated schema-folder owner grouping described in prior changelog entries and README rules no longer apply. `project-structure-analyzer.test.ts` fixtures that asserted the old precise owner paths were not re-verified as part of this documentation-only pass and may now be stale -- typecheck/test were not run.

### Test Suite Detected-Area Category (Jest Implemented; Other Runners Scaffolded)

- **Problem:** Detected areas had no way to identify test-runner ownership, so repositories with dedicated Jest, Vitest, Playwright, Cypress, or Mocha test suites produced no `Test suite` area evidence.
- **Solution:**
  1. Added `TestDetectedAreaTechnology` (`Jest`, `Vitest`, `Mocha`, `Cypress`, `Playwright`) to the `DetectedAreaTechnology` union in `project-structure-analyzer.types.ts`.
  2. Added `detected-area-rules/test/test-area-rules.ts` dispatching to per-runner modules, wired as `addTestAreas` from `project-structure-detected-area-rules.ts` and run last, after containerization.
  3. Implemented `addJestTestAreas` in `detected-area-rules/test/jest-test-area-rules.ts`: scores `jest.config.*`, `jest[.-]setup.*`, `setupTests.*`, `__tests__`, `__mocks__`, `__snapshots__`, and `*.test.*`/`*.spec.*` evidence, gated by `hasJestAppShape` so that only a config file alone, a named setup file plus supporting test evidence, or `__mocks__` plus `__snapshots__` together can unlock emission -- every other signal is shared with other runners and cannot unlock alone.
  4. Added `addVitestTestAreas`, `addCypressTestAreas`, `addMochaTestAreas`, and `addPlaywrightTestAreas` as side-effect-free stub functions wired into dispatch but with no matching, scoring, or emission logic implemented yet.
- **Affected files:** `project-structure-analyzer.types.ts`, `project-structure-detected-area-rules.ts`, `detected-area-rules/test/test-area-rules.ts`, `detected-area-rules/test/jest-test-area-rules.ts`, `detected-area-rules/test/vitest-test-area-rules.ts`, `detected-area-rules/test/cypress-test-area-rules.ts`, `detected-area-rules/test/mocha-test-area-rules.ts`, `detected-area-rules/test/playwright-test-area-rules.ts`, `docs/architecture/github-analysis/project-structure/README.md`, `docs/architecture/github-analysis/project-structure/changelog.md`.
- **Outcome:** `Test suite` areas now emit for Jest-shaped repositories from conservative path-only evidence. Vitest, Cypress, Mocha, and Playwright detection remains unimplemented and their stub functions always contribute zero candidates.

## 2026-08-22

### Podman/OCI Owner Resolution

- **Decision:** Resolve Podman/OCI owner paths by reusing Docker's monorepo-root/member contract and then scanning the full evidence path -- not only the top-level segment -- for the first recognized Podman/OCI config directory, because real Quadlet layouts nest deeper than Docker's (`etc/containers/systemd/`, `subsystems/video/etc/containers/systemd/*.container`).
- **Problem:** Podman/OCI evidence had no dedicated owner-path resolver; every `countAreaRuleSignal` call in the detector relied on default owner attribution, so root-level `quadlet/`/`containers/`/`deploy/` folders, monorepo members and roots, and deeply nested system-path mirrors had no verified owner, and the `.kube` signal was left out of the initial wiring pass entirely.
- **Solution:**
  1. Added `PODMAN_CONTAINERIZATION_REPO_CONFIG_DIRECTORIES` (`quadlet`, `containers`, `systemd`, `deploy`, `etc`) and extended the shared `containerizationMonorepoOwnerPathFromParts` helper in `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.ts` to also collapse a monorepo member segment to its root when that segment matches this set, mirroring the existing Docker config-directory check.
  2. Implemented `ownerPathForPodmanOciContainerizationArea` in the same file: reuse the shared monorepo check, then `findIndex` the full path for the first Podman/OCI config directory at any depth and slice the owner up to that index (falling back to `.` when the match is the first segment), then fall back to `.` for single-segment root evidence and to the local parent directory otherwise.
  3. Wired `resolveOwnerPath: ownerPathForPodmanOciContainerizationArea` into all ten `countAreaRuleSignal` calls in `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts`, including the previously-unwired `.kube` loop.
  4. Added 23 unit cases to `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.test.ts` and 5 analyzer-level fixtures to `apps/backend/src/services/github-analysis/project-structure/project-structure-analyzer.test.ts` covering monorepo-member, monorepo-root, root-level config-directory, deep-nested config-directory, and owner-isolation shapes.
  5. Updated the containerization rules in `docs/architecture/github-analysis/project-structure/README.md`, corrected the stale "owner resolution... unfinished" consequence in `docs/architecture/github-analysis/project-structure/adr/0002-podman-oci-containerization-gate.md`, and updated the stale scaffold-era JSDoc above `addPodmanOciContainerizationAreas` in `podman-oci-containerization-area-rules.ts`. In doing so, resolved a documentation conflict: the ADR and rules-file docstring called fixture/example/test path exclusion "required follow-up work" for Podman specifically, while README rule 226 states the analyzer's general policy that no detector excludes evidence by generic `docs`/`test`/`tests`/`fixtures` path names, relying on signal-combination precision instead. Aligned the Podman-specific text with the general policy rather than treating it as an open TODO.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.ts`, `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.test.ts`, `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts`, `apps/backend/src/services/github-analysis/project-structure/project-structure-analyzer.test.ts`, `docs/architecture/github-analysis/project-structure/README.md`, `docs/architecture/github-analysis/project-structure/adr/0002-podman-oci-containerization-gate.md`, `docs/architecture/github-analysis/project-structure/changelog.md`.
- **Outcome:** Podman/OCI containerization areas now resolve to accurate owner paths across root-level, monorepo, and deeply nested real-world Quadlet/Containerfile layouts instead of relying on unverified default owner attribution, and every Podman/OCI signal type -- including `.kube` -- now uses the same resolver.

## 2026-07-22

### Podman/OCI Conservative Combination Gate

- **Decision:** Require corroborating owner-scoped Podman/OCI path signals instead of allowing any basename-only Quadlet extension to emit independently.
- **Problem:** Quadlet extensions such as `.container`, `.pod`, `.kube`, and especially `.build` can collide with unrelated file formats when the path-only analyzer cannot inspect their sections, so treating score-4 files as independent proof would create false-positive Podman containerization areas.
- **Solution:**
  1. Reduced core Quadlet scores from `4` to `3`, `.image` from `3` to `2`, and network, volume, artifact, and `Containerfile` support scores from `2` to `1` in `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts`.
  2. Implemented runtime-plus-companion and build-plus-compatible-companion combinations in `hasPodmanOciContainerizationAreaShape`, while keeping individual signals, support-resource-only groups, `.containerignore`-assisted singles, generic OCI-only evidence, and `.build` plus only network evidence non-emitting.
  3. Added public analyzer regression coverage for seven accepted combinations and eight rejected weak shapes in `apps/backend/src/services/github-analysis/project-structure/project-structure-analyzer.test.ts`.
  4. Documented the gate contract in `docs/architecture/github-analysis/project-structure/README.md` and recorded the durable precision-over-recall decision in `docs/architecture/github-analysis/project-structure/adr/0002-podman-oci-containerization-gate.md`.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts`, `apps/backend/src/services/github-analysis/project-structure/project-structure-analyzer.test.ts`, `docs/architecture/github-analysis/project-structure/README.md`, `docs/architecture/github-analysis/project-structure/changelog.md`, `docs/architecture/github-analysis/project-structure/adr/README.md`, `docs/architecture/github-analysis/project-structure/adr/0002-podman-oci-containerization-gate.md`.
- **Outcome:** Podman/OCI areas can now emit from coherent path-only deployment or build shapes without allowing a single ambiguous extension or accumulated weak support evidence to claim Podman usage.

### Podman/OCI Owner Signal Counting

- **Problem:** Podman/OCI evidence collections were incorrectly routed through final candidate emission inside each file loop, so individual evidence files were not assigned their signal type and score in the owner-scoped candidate map.
- **Solution:**
  1. Routed all ten Podman/OCI evidence collections through `countAreaRuleSignal` in `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts`, pairing every entry with its exact signal literal and configured score.
  2. Preserved once-per-owner signal deduplication through the shared candidate map and kept the existing final gated emission block separate from evidence collection.
  3. Updated `docs/architecture/github-analysis/project-structure/README.md` to describe the implemented provisional owner-scoped counting stage and the still-unfinished Podman-specific ownership and gate behavior.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts`, `docs/architecture/github-analysis/project-structure/README.md`, `docs/architecture/github-analysis/project-structure/changelog.md`.
- **Outcome:** Every planned Podman/OCI file signal now contributes its configured score and evidence once to its provisional owner without bypassing the detector's final emission gate.

## 2026-07-21

### Podman/OCI Basename Signal Matching

- **Problem:** The Podman/OCI detector's planned signal variables still used placeholder full-path entry queries, which neither represented the researched Quadlet/OCI filenames nor guaranteed that returned entries were files.
- **Solution:**
  1. Replaced every placeholder query in `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts` with file-only basename matching for `.container`, `.pod`, `.kube`, `.build`, `.image`, `.network`, `.volume`, `.artifact`, `Containerfile` variants, and `.containerignore`.
  2. Kept directory placement optional during collection so root-level and nested real-world Quadlet layouts remain discoverable, while leaving path exclusions and ownership resolution for their dedicated implementation stage.
  3. Updated `docs/architecture/github-analysis/project-structure/README.md` and the detector JSDoc to describe the implemented collection boundary and still-disabled output behavior.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts`, `docs/architecture/github-analysis/project-structure/README.md`, `docs/architecture/github-analysis/project-structure/changelog.md`.
- **Outcome:** The inert Podman/OCI detector now discovers its planned evidence as files across valid repository layouts without yet resolving owners, counting signals, or emitting containerization areas.

## 2026-07-20

### Podman/OCI Containerization Detector Scaffold

- **Problem:** Containerization dispatch supported Docker only, so Podman/OCI research had no isolated detector boundary in which evidence, ownership, scoring, and gate behavior could be developed without prematurely changing analyzer output.
- **Solution:**
  1. Added the inert `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts` module with an example-only signal type, example score, always-false gate, and side-effect-free detector entry point.
  2. Dispatched the scaffold after Docker from `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/containerization-area-rules.ts` while leaving matching, owner resolution, technology attribution, candidate scoring, and emission unimplemented.
  3. Documented the new detector boundary and implementation status in `docs/architecture/github-analysis/project-structure/README.md`.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts`, `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/containerization-area-rules.ts`, `docs/architecture/github-analysis/project-structure/README.md`, `docs/architecture/github-analysis/project-structure/changelog.md`.
- **Outcome:** Podman/OCI detector work now has a dedicated, dispatched module that cannot alter analyzer results until real path signals, ownership rules, and emission criteria are implemented.

## 2026-07-17

### Docker Detector JSDoc Correction

- **Problem:** The implemented Docker detector still described itself as a scaffold with future path evidence and scoring work, which contradicted its active matching, owner grouping, gate, and emission behavior.
- **Solution:**
  1. Replaced the stale scaffold text above `addDockerContainerizationAreas` in `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/docker-containerization-area-rules.ts` with JSDoc covering its purpose, input context, map mutation, decisive and support-only signal invariant, once-per-owner grouping, and path-only limitation.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/docker-containerization-area-rules.ts`, `docs/architecture/github-analysis/project-structure/changelog.md`.
- **Outcome:** The detector's source documentation now accurately describes its implemented contract and no longer suggests Docker emission remains unfinished.

## 2026-07-16

### Docker Containerization Emission Gate

- **Decision:** Allow Dockerfile, Compose, or Bake evidence to independently unlock Docker `Containerization` output while keeping `.dockerignore` and devcontainer configuration support-only.
- **Problem:** The Docker detector had collected and grouped five signal types but still lacked a final evidence gate; an unconditional gate would let `.dockerignore` plus devcontainer configuration emit an application containerization area without a Docker build or runtime definition, while requiring Dockerfile and Compose combinations would reject common valid single-anchor repositories.
- **Solution:**
  1. Implemented an anchor-based `hasDockerContainerizationAreaShape` gate in `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/docker-containerization-area-rules.ts` using Dockerfile, Compose, and Bake signals as independent proof.
  2. Added public analyzer coverage in `apps/backend/src/services/github-analysis/project-structure/project-structure-analyzer.test.ts` for single-anchor emission, support-only rejection, anchored confidence/evidence accumulation, and monorepo owner isolation.
  3. Documented the implemented detector contract in `docs/architecture/github-analysis/project-structure/README.md` and recorded the durable gate boundary in `docs/architecture/github-analysis/project-structure/adr/0001-docker-containerization-gate.md`.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/docker-containerization-area-rules.ts`, `apps/backend/src/services/github-analysis/project-structure/project-structure-analyzer.test.ts`, `docs/architecture/github-analysis/project-structure/README.md`, `docs/architecture/github-analysis/project-structure/adr/README.md`, `docs/architecture/github-analysis/project-structure/adr/0001-docker-containerization-gate.md`.
- **Outcome:** Docker containerization areas now emit from decisive path-only Docker workflow files, gain confidence from co-owned support evidence, and reject weak development/support-only shapes.

## 2026-07-15

### Docker Monorepo Root Owner Resolution

- **Decision:** Treat direct Docker evidence and generic Docker config folders under a monorepo owner root as belonging to that root instead of treating the evidence filename or config folder as a member name.
- **Problem:** Paths such as `apps/Dockerfile` resolved to `apps/Dockerfile`, while `apps/docker/Dockerfile` and `apps/.devcontainer/devcontainer.json` resolved to configuration folders rather than the containerized `apps` owner.
- **Solution:**
  1. Updated `containerizationMonorepoOwnerPathFromParts` in `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.ts` to return the recognized monorepo root for two-segment Docker evidence paths.
  2. Reused the Docker repository-config directory set to collapse second-segment configuration folders to the recognized monorepo root without duplicating Docker filename matchers.
  3. Added focused direct-evidence and config-directory regression cases in `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.test.ts`.
  4. Expanded the exported resolver and private monorepo helper JSDoc and added inline comments for their ownership branches, fallbacks, side-effect contract, and path-only ambiguity.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.ts`, `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.test.ts`, `docs/architecture/github-analysis/project-structure/README.md`.
- **Outcome:** Docker evidence now resolves to `apps`, `packages`, `services`, or `libs` when stored directly under those roots or inside their generic config folders, while named members such as `apps/frontend` retain member-level ownership regardless of deeper evidence paths.

## 2026-07-14

### Docker Containerization Signal Prep

- **Decision:** Collect basename-only Docker signals through filename matching, keep devcontainer config path-scoped, and count Docker Bake as conservative Docker-specific build evidence.
- **Problem:** The Docker detector scaffold started counting Docker path signals, but basename-only files were using full-path regexes, the matcher patterns did not align with the analyzer's lowercase normalized paths, Compose variants such as `compose.prod.yml` were missing, and Docker Bake was not counted.
- **Solution:**
  1. Updated Dockerfile matching to use filename evidence such as `dockerfile`, `api.dockerfile`, and environment-suffixed variants.
  2. Updated `.dockerignore` matching to use filename evidence aligned with lowercase normalized Dockerfile names.
  3. Updated Compose matching to use filename evidence for both `compose.*` and `docker-compose.*` YAML variants.
  4. Added Docker Bake filename evidence for `docker-bake.hcl`, `docker-bake.json`, and their `.override` variants with score `3`.
  5. Kept `.devcontainer/devcontainer.json` as path-scoped evidence because the directory is part of that signal.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/docker-containerization-area-rules.ts`, `docs/architecture/github-analysis/project-structure/README.md`.
- **Outcome:** Docker signal collection is broader and uses filename matching where directory context is unnecessary, while the detector gate still controls whether any `Containerization` area is emitted.

### Docker Containerization Owner Resolution

- **Decision:** Resolve Docker containerization evidence to the repo area being containerized rather than the Docker config folder by default.
- **Problem:** Docker evidence can live at repo root, inside app/service/package owners, under generic config folders such as `docker/` or `deploy/`, or in simple local owners such as `backend/`; the detector needed stable owner paths before enabling Docker area emission.
- **Solution:**
  1. Added `ownerPathForDockerContainerizationArea` in `project-structure-path-utils.ts`.
  2. Resolved monorepo evidence to `apps/*`, `services/*`, `packages/*`, or `libs/*`.
  3. Collapsed root-level and generic config-folder evidence such as `docker/Dockerfile`, `deploy/docker/Dockerfile`, and `.devcontainer/devcontainer.json` to `.`.
  4. Used parent-folder fallback for simple local owners such as `backend/Dockerfile`, `api/docker-compose.yml`, and `worker/docker-bake.override.hcl`.
  5. Routed every Docker signal count through the Docker owner resolver and added focused path utility coverage.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.ts`, `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.test.ts`, `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/docker-containerization-area-rules.ts`, `docs/architecture/github-analysis/project-structure/README.md`.
- **Outcome:** Docker signal evidence now groups under the intended containerized repo area, while the detector gate still controls whether `Containerization` areas emit.

### Containerization Technology Type Cleanup

- **Decision:** Keep Docker in a dedicated containerization technology category while preserving the public `DetectedAreaTechnology` union shape.
- **Problem:** The initial Docker technology type used inconsistent union formatting and the project-structure README still described the composed technology union without the new containerization category.
- **Solution:**
  1. Normalized `ContainerizationDetectedAreaTechnology` to the single literal alias `Docker`.
  2. Updated the JSDoc to describe containerization-area technology labels.
  3. Updated the project-structure README rule that lists the composed technology categories.
- **Affected files:** `apps/backend/src/services/github-analysis/project-structure/project-structure-analyzer.types.ts`, `docs/architecture/github-analysis/project-structure/README.md`.
- **Outcome:** Docker remains available to detected-area candidates through a clearly named containerization technology category.

## 2026-07-09

### Containerization Detector Module Scaffold

- **Decision:** Establish the containerization detected-area module structure before adding Docker path rules.
- **Problem:** `Containerization` is a planned detected-area name, but the project-structure analyzer did not yet have an isolated rule group or Docker-specific detector boundary for incremental implementation.
- **Solution:** Added `detected-area-rules/containerization/containerization-area-rules.ts`, added the scaffolded Docker module at `detected-area-rules/containerization/docker-containerization-area-rules.ts`, wired `addContainerizationAreas` into `project-structure-detected-area-rules.ts`, and documented the new module boundary in `docs/architecture/github-analysis/project-structure/README.md`.
- **Outcome:** Containerization detection now has a stable dispatcher and Docker detector file ready for conservative path-only scoring rules without changing analyzer output behavior yet.

## 2026-07-08

### JavaScript/TypeScript Shared Package Area Detection

- **Decision:** Detect JavaScript/TypeScript shared-package areas at the repo-level reusable package container instead of the individual package leaf.
- **Problem:** Shared-package evidence such as `packages/ui/package.json`, `libs/types/index.ts`, or `modules/schemas/src/index.mts` describes reusable package containers, while app-internal paths such as `apps/web/src/shared/index.ts` should not emit a repo-level `Shared package` area.
- **Solution:** Added `detected-area-rules/shared-package/js-ts-shared-package-area-rules.ts`, kept `detected-area-rules/shared-package/shared-package-area-rules.ts` as the group dispatcher, wired shared-package rules into `project-structure-detected-area-rules.ts`, added `ownerPathForSharedPackageArea` in `project-structure-path-utils.ts`, emitted `Shared package` with `Node.js` technology metadata, and covered `packages`, scoped packages, `libs`, `modules`, root `shared`, root `common`, repeated-signal, and weak-signal fixtures in public analyzer tests.
- **Outcome:** JavaScript/TypeScript reusable package evidence now emits stable shared-package owners such as `packages`, `libs`, `modules`, `shared`, or `common`, while package-name-only, manifest-only, entrypoint-only, app-internal shared modules, and top-level `utils` remain non-emitting.

## 2026-07-04

### Knex Database Schema Area Detection

- **Decision:** Detect Knex database areas from conservative path combinations across canonical/custom Knex config files plus migration or seed artifacts.
- **Problem:** Knex is a query builder and migration tool rather than a model/entity ORM, and migration or seed folders alone are too generic to prove Knex usage by path.
- **Solution:** Added `knex-database-area-rules.ts`, added the `Knex` technology label, introduced a Drizzle-like Knex owner resolver in `project-structure-path-utils.ts`, registered the detector in the database dispatcher, and covered root, nested `src/db`, `database/`, custom config, monorepo isolation, repeated-signal, and weak-signal fixtures in public analyzer tests.
- **Outcome:** Knex database schema areas now emit at repository or monorepo owner paths such as `.` or `apps/api` only when Knex config is paired with migration or seed evidence, while config-only, migration-only, seed-only, migration-plus-seed, and generic connection files remain non-emitting.

### Sequelize Database Schema Area Detection

- **Decision:** Detect Sequelize database areas from conservative path combinations across CLI config, database config, model files, migrations, and seeders.
- **Problem:** Sequelize does not have a Prisma-style single schema folder; official CLI projects split `config/`, `models/`, `migrations/`, and `seeders/`, while real repositories also use `.sequelizerc` to route artifacts into folders such as `sequelize/`, `src/infra/sequelize/`, `db/`, or `database/`.
- **Solution:** Added `sequelize-database-area-rules.ts`, added the `Sequelize` technology label, introduced a Sequelize-specific owner resolver in `project-structure-path-utils.ts`, registered the detector in the database dispatcher, and covered default CLI, dedicated `sequelize/`, `src/infra/sequelize`, split DDD, monorepo isolation, repeated-signal, and weak-signal fixtures in public analyzer tests.
- **Outcome:** Sequelize database schema areas now emit at stable owners such as `.`, `apps/api`, `sequelize`, or `src/infra/sequelize`, while CLI-config-only, config-only, model-only, migration-only, seeder-only, generic model-plus-seeder, and non-migration timestamp files remain non-emitting.

### TypeORM Database Schema Area Detection

- **Decision:** Detect TypeORM database areas from conservative path combinations across legacy config, data-source files, entities, and generated migration files.
- **Problem:** TypeORM does not have a Prisma-style schema folder; real projects use shapes such as `ormconfig.*` plus `*.entity.ts`, `src/data-source.ts` plus `src/migrations`, package-level `entities` plus `migrations`, or explicit `db`/`database` folders.
- **Solution:** Added `typeorm-database-area-rules.ts`, added the `TypeORM` technology label, introduced a TypeORM-specific owner resolver in `project-structure-path-utils.ts`, and covered legacy config, data-source-backed migrations, entity-plus-migration detection, example config support, package ownership, explicit database-folder ownership, monorepo isolation, repeated signals, and weak-signal rejection in public analyzer tests.
- **Outcome:** TypeORM database schema areas now emit at stable owners such as `.`, `apps/api`, `packages/db`, or `backend/app/db`, while config-only, data-source-only, entity-only, migration-only, generic timestamp files, and broad schema files remain non-emitting.

### SQLAlchemy Database Schema Area Detection

- **Decision:** Detect SQLAlchemy database areas through combined ORM/model and Alembic migration structure, with Alembic exposed as related technology rather than the primary detected area.
- **Problem:** SQLAlchemy does not have a canonical Prisma-style schema folder; real projects place models in files such as `models.py`, `models/`, or `orm_models.py`, while Alembic migration environments may live under `alembic/`, `migrations/`, or `_migrations/versions/{dialect}`.
- **Solution:** Added `sqlalchemy-database-area-rules.ts`, added `SQLAlchemy` and `Alembic` technology labels, introduced a SQLAlchemy-specific owner resolver in `project-structure-path-utils.ts`, and covered root Alembic, FastAPI-style `backend/app`, Superset/Airflow-style package migrations, Prefect-style database modules, monorepo isolation, repeated signal counting, and weak-signal rejection in public analyzer tests.
- **Outcome:** SQLAlchemy database schema areas now emit with primary technology `SQLAlchemy` and related `Alembic`/`Python` context at the nearest shared schema/migration code owner, while generic models, database files, Alembic config/env files, version folders, and SQL migrations remain non-emitting on their own.

## 2026-07-02

### Drizzle Database Schema Area Detection

- **Decision:** Detect Drizzle database evidence at the owning repository, app, package, service, or library path instead of pretending there is one canonical Drizzle schema folder.
- **Problem:** Drizzle projects can split `drizzle.config.*`, schema files, SQL migrations, journal files, and snapshots across folders such as `src/db`, `src/lib/db`, `drizzle`, and `migrations`, so artifact-folder ownership produced false splits like config at `.` and schema at `src/db`.
- **Solution:** Added a Drizzle-specific owner resolver in `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.ts`, routed Drizzle signal counting through it in `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/database/drizzle-database-area-rules.ts`, expanded schema matching for `src/lib/db/schema.*`, and aligned public analyzer fixtures around root/app/package/service/library owner output plus weak-signal rejection.
- **Outcome:** Drizzle evidence now combines under stable owners such as `.`, `apps/api`, `packages/db`, `services/api`, or `libs/db`, while config-only, schema-only, SQL-only, metadata-only, and generic SQL shapes remain non-emitting.

## 2026-07-01

### Detected Area Technology Type Composition

- **Decision:** Split the detected-area technology labels into composed category unions while keeping the public `DetectedAreaTechnology` type stable.
- **Problem:** `project-structure-analyzer.types.ts` kept frontend, backend, runtime, template, and database labels in one long flat union, which made detector ownership harder to scan as new database technologies such as Drizzle were added.
- **Solution:** Added `FrontendDetectedAreaTechnology`, `BackendDetectedAreaTechnology`, `RuntimeDetectedAreaTechnology`, `TemplateDetectedAreaTechnology`, and `DatabaseDetectedAreaTechnology` in `apps/backend/src/services/github-analysis/project-structure/project-structure-analyzer.types.ts`, then rebuilt `DetectedAreaTechnology` from those narrower unions without changing `addAreaScore` or analyzer output contracts.
- **Outcome:** Future detector labels can be added to the category that owns them while existing detected-area candidate APIs continue to accept the same public technology union.

### Prisma Database Schema Area Detection

- **Decision:** Detect Prisma-owned database schema areas separately from frontend and backend application owners.
- **Problem:** Project-structure detection could infer Prisma in the summary, but `detectedAreas` did not have a framework-specific database schema rule, so Prisma schema and migration evidence could not reliably point later analyzers to the exact persistent data-model folder.
- **Solution:** Added `detected-area-rules/database/database-area-rules.ts` and `prisma-database-area-rules.ts`, allowed area-rule signal counting to use a database owner resolver, emitted `Database schema` with `Prisma` technology metadata from schema/migration/config-backed evidence, and added public-analyzer fixtures for conventional schema, root schema, migration history, config-backed fragments, monorepo isolation, repeated signals, and weak-signal rejection.
- **Outcome:** Prisma schema and migration folders now emit precise database areas such as `apps/backend/prisma`, while config-only, fragment-only, lock-only, directory-only, and generic SQL migration shapes remain non-emitting for Prisma.
