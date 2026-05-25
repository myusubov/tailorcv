# GitHub Analysis Changelog

> Historical implementation log for the GitHub analysis domain. New high-level doc changes go in the hub; implementation changes should add entries here when they affect pipeline or analyzer behavior.

---

## 2026-05-25

### React Frontend Area Rule

- **Decision:** Add React as a non-framework frontend detected-area rule separate from React Router framework mode.
- **Problem:** Frontend detection covered React meta-frameworks and other framework families, but common React SPA layouts such as Vite React and CRA-style apps still lacked a dedicated owner-scoped rule.
- **Solution:** Added `detected-area-rules/frontend/react-frontend-area-rules.ts` with fixed per-owner signal scoring for Vite config, root/public index HTML, JSX/TSX entry files, `src/App.*`, starter CSS files, components, and page/view hints, then wired it after React Router.
- **Outcome:** React app regions can now emit role-based `Frontend app` candidates from common path-only React structure while leaving future React-specific output gates for a later refinement.

### React Router Frontend Area Rule

- **Decision:** Add React Router framework-mode frontend area detection as a separate framework-specific rule.
- **Problem:** Frontend detected-area rules covered multiple frameworks, but React Router framework apps with `app/root.*`, `app/routes.*`, optional entry files, and `react-router.config.*` still lacked owner-scoped path evidence.
- **Solution:** Added `detected-area-rules/frontend/react-router-frontend-area-rules.ts` with owner-scoped signal scoring for framework config, root route, routes config, optional client/server entry files, file routes, and weak Vite/routes directory support, then wired it from `frontend-area-rules.ts`.
- **Outcome:** React Router framework project regions can now emit role-based `Frontend app` candidates without scoring repeated route files individually.

## 2026-05-23

### Vue Frontend Area Rule

- **Decision:** Add Vue as a framework-specific frontend detected-area rule while keeping it separate from Nuxt.
- **Problem:** Nuxt and Vue share `.vue` files and common route/layout folder names, so Vue detection needed owner-scoped proof gates that avoid stealing Nuxt owners or emitting from weak component-library evidence.
- **Solution:** Added `detected-area-rules/frontend/vue-frontend-area-rules.ts` with owner-scoped signal scoring for `src/App.vue`, `src/main.*`, Vue Router files, views/pages, Vue CLI config, Vite config support, and weak components, then wired it after Nuxt; Vue emission skips owners with Nuxt proof and requires root-app combinations.
- **Outcome:** Vue SPA project regions can emit role-based `Frontend app` candidates without misclassifying Nuxt apps or Vue component libraries.

### Nuxt Frontend Area Rule

- **Decision:** Add Nuxt as the next framework-specific frontend detected-area rule.
- **Problem:** Frontend area detection covered Next.js, Angular, SvelteKit, and Astro, but Nuxt apps with distinctive config, app entry, page, layout, and server route conventions still lacked framework-specific path evidence.
- **Solution:** Added `detected-area-rules/frontend/nuxt-frontend-area-rules.ts` with owner-scoped signal scoring for `nuxt.config.*`, `app.vue`/`app/app.vue`, Vue pages, layouts, weaker script pages/server routes, and weak `pages` directory evidence, then wired it from `frontend-area-rules.ts`; Nuxt emission now requires config or Nuxt app-entry proof.
- **Outcome:** Nuxt project regions can now emit role-based `Frontend app` candidates without scoring repeated pages, layouts, or server route files individually.

---

## 2026-05-22

### Astro Frontend Area Rule

- **Decision:** Add Astro as the next framework-specific frontend detected-area rule.
- **Problem:** Frontend area detection covered Next.js, Angular, and SvelteKit, but Astro sites with distinctive config and `src/pages` routing conventions still lacked framework-specific path evidence.
- **Solution:** Added `detected-area-rules/frontend/astro-frontend-area-rules.ts` with owner-scoped signal scoring for `astro.config.*`, strong `.astro` page files, weak Markdown/HTML content page hints, endpoint files, layouts, components, and weak `src/pages` support evidence, then wired it from `frontend-area-rules.ts`; weak-only Astro hints are gated from emission.
- **Outcome:** Astro project regions can now emit role-based `Frontend app` candidates without scoring repeated page files individually.

### SvelteKit Frontend Area Rule

- **Decision:** Add SvelteKit as the next framework-specific frontend detected-area rule.
- **Problem:** Frontend area detection covered Next.js and Angular, but SvelteKit apps with distinctive `+page`/`+layout` route conventions still lacked framework-specific path evidence.
- **Solution:** Added `detected-area-rules/frontend/sveltekit-frontend-area-rules.ts` with owner-scoped signal scoring for `svelte.config.*`, SvelteKit route files, `src/app.html`, and weak `src/routes` support evidence, then wired it from `frontend-area-rules.ts`.
- **Outcome:** SvelteKit project regions can now emit role-based `Frontend app` candidates without scoring repeated route files individually.

### Angular Frontend Area Rule

- **Decision:** Add Angular as the next framework-specific frontend detected-area rule.
- **Problem:** Frontend area detection only had Next.js framework-specific evidence, leaving Angular repository areas unrecognized by the modular rule dispatcher.
- **Solution:** Added `detected-area-rules/frontend/angular-frontend-area-rules.ts` with owner-scoped signal scoring for `angular.json`, Angular root component/module files, `src/main.ts`, weak `project.json`, and `src/app` support evidence, then wired it from `frontend-area-rules.ts`.
- **Outcome:** Angular project regions can now emit role-based `Frontend app` candidates while using the same one-score-per-signal pattern as Next.js.

### Next.js Signal Bucket Completion

- **Decision:** Finish the first explicit Next.js signal-bucket implementation for frontend area detection.
- **Problem:** The Next.js detector had only started counting config and App Router core evidence, leaving support files, Pages Router evidence, route directories, and final candidate emission incomplete.
- **Solution:** Completed `detected-area-rules/frontend/next-frontend-area-rules.ts` with one-score-per-signal loops for App Router support files, Pages Router special files, Pages Router route files, and route directories before emitting one `Frontend app` candidate per owner.
- **Outcome:** Next.js frontend area detection now follows the agreed owner-scoped signal scoring model without scoring repeated route files individually.

---

## 2026-05-21

### Next.js Area Signal Scoring

- **Decision:** Score Next.js detected-area evidence once per owner-level signal instead of once per matched route file.
- **Problem:** Broad App Router and Pages Router path patterns could inflate scores and evidence arrays when an app contained many `page.tsx`, `loading.tsx`, or `error.tsx` files.
- **Solution:** Updated `detected-area-rules/frontend/next-frontend-area-rules.ts` to group evidence by owner path, track Next.js signal types in a set, and keep representative evidence per signal.
- **Outcome:** Next.js app areas still emit `Frontend app`, but repeated route files no longer multiply confidence or flood evidence output.

### Vite Frontend Area Evidence

- **Decision:** Add generic frontend detected-area coverage through a Vite-style rule module before broader React or static-site detection.
- **Problem:** After splitting detected-area rules, Vite repositories could still infer `summary.inferredStack` but no longer emitted a `Frontend app` area.
- **Solution:** Added `generic-frontend-area-rules.ts`, wired it from `frontend-area-rules.ts`, and scored `vite.config.*`, `index.html`, `src/main.*`, `src/App.*`, and React SPA `src/index.*` as role-based frontend evidence.
- **Outcome:** Vite-style and React SPA repositories can again produce `Frontend app` candidates without adding framework-specific output fields.

---

## 2026-05-20

### Next.js Frontend Area Evidence

- **Decision:** Rebuild frontend detected-area behavior through the new Next.js-specific rule module first.
- **Problem:** The modular detected-area shell no longer emitted frontend areas, and Next.js needed path-only evidence restored before adding other frontend frameworks.
- **Solution:** Added `next.config.*`, App Router file, Pages Router file, and weaker route-directory evidence in `detected-area-rules/frontend/next-frontend-area-rules.ts`.
- **Outcome:** Next.js repository regions can again contribute `Frontend app` candidates while keeping framework-specific logic isolated.

---

## 2026-05-19

### Detected Area Rule Module Skeleton

- **Decision:** Split detected-area rule orchestration from frontend and framework-specific rule modules before rebuilding detection logic.
- **Problem:** The previous single rules file mixed rule dispatch, area grouping, and framework-specific evidence, which made step-by-step reconstruction harder to follow.
- **Solution:** Kept `project-structure-detected-area-rules.ts` as the public rule entry point, added `detected-area-rules/frontend/frontend-area-rules.ts` for frontend dispatch, and added `detected-area-rules/frontend/next-frontend-area-rules.ts` as the first framework-specific placeholder.
- **Outcome:** Detected-area rules now have a modular shell where Next.js, Angular, Vue, backend, database, and support detectors can be rebuilt one small module at a time.

---

## 2026-05-18

### Detected Area Backend Rule Readability

- **Decision:** Keep backend detected-area behavior the same while extracting the owner-evidence grouping logic into named helpers.
- **Problem:** `addBackendAreas` mixed regex matching, owner grouping, evidence bucket creation, and completion checks inline, making the false-positive prevention logic hard to reason about.
- **Solution:** Added explicit required backend folder constants and helper functions for structure-folder extraction, owner evidence creation, and complete backend-structure checks in `project-structure-detected-area-rules.ts`.
- **Outcome:** Backend area detection still requires `routes`, `controllers`, and `services` under the same owner, but the main rule now reads closer to the intended mental model.

---

## 2026-05-15

### Primary Stack Signal Expansion

- **Decision:** Keep primary stack inference path-only and conservative while adding distinctive stack/tool signals.
- **Problem:** The stack detector previously inferred `Express` from generic backend folders, but those folders are not Express-specific; it also missed common monorepo and mobile stack signals.
- **Solution:** Removed path-only `Express`, added NestJS/Nx/mobile/Docker Compose signals, and updated analyzer tests.
- **Outcome:** `summary.inferredStack` avoids overclaiming Express while capturing more distinctive path-only stack evidence.

### Project Shape Rule Comments

- **Decision:** Add concise JSDoc-style comments around the main project-shape scoring groups.
- **Problem:** Weak versus strong evidence was not obvious while scanning `project-shape-detector.ts`.
- **Solution:** Added comments for monorepo, frontend, backend, specialized, and derived full-stack score groups.
- **Outcome:** Future project-shape scoring edits have clearer local context without changing analyzer behavior.

---

## 2026-05-14

### Conservative Backend Area Evidence

- **Decision:** Require complete backend structure before emitting a `Backend API` detected area from folder evidence.
- **Problem:** Frontend projects can have `src/routes` for client routing and `src/services` for API clients, causing false backend areas.
- **Solution:** Aggregate backend structure by owner and emit `Backend API` only when `routes`, `controllers`, and `services` are all present.
- **Outcome:** Frontend routing/service folders no longer produce backend API areas without stronger backend proof.

### Project Shape Rule Readability Cleanup

- **Decision:** Keep project-shape signal groups as constants, but call `EntryIndex` helpers directly inside `detectProjectShape`.
- **Problem:** Thin helper wrappers around simple `.some()` and `.filter()` calls made the detector harder to read.
- **Solution:** Removed helper wrappers and used constants directly with `index`.
- **Outcome:** Project-shape rules are shorter and closer to the scoring logic.

### Generalized Monorepo Shape Signals

- **Decision:** Detect common Nx/Turborepo-style monorepos through reusable rule groups instead of hardcoded frontend/backend folder names.
- **Problem:** Layouts such as `apps/web`, `services/api`, and `libs/shared` were common but under-scored.
- **Solution:** Added grouped monorepo config/root signals, generalized `apps/*/app|pages`, added `libs/*` shared package evidence, and regression coverage.
- **Outcome:** Project structure analysis handles more common monorepo layouts without AI or file-content parsing.

### Detected Area Owner Path Grouping

- **Decision:** Treat `detectedAreas[].path` as the owner root for an area while keeping exact proof paths in `evidence`.
- **Problem:** Root-level repositories could emit duplicate areas for the same category.
- **Solution:** Added owner-path helpers and updated detected-area rules so root app/config evidence groups under `.` while monorepos group under app/package owners.
- **Outcome:** Detected areas now distinguish where an area lives from which paths proved it.

### Prisma Database Area Grouping

- **Decision:** Group Prisma schema and migration evidence under the same database owner path.
- **Problem:** `prisma/schema.prisma` and `prisma/migrations` emitted two database areas.
- **Solution:** Added `ownerPathForDatabaseArea` and updated Prisma rules/tests.
- **Outcome:** Prisma repositories emit one `Database schema` area with schema and migration evidence.

### Conservative Drizzle Database Detection

- **Decision:** Add Drizzle support only for strong path conventions.
- **Problem:** Broad `schema.ts` matching would create noisy false positives.
- **Solution:** Detect `drizzle.config.*`, `drizzle/`, and explicit `db/schema.ts` / `src/db/schema.ts`; ignore ambiguous `src/schema.ts`.
- **Outcome:** Common Drizzle projects produce database-area evidence without overclaiming.

---

## 2026-05-13

### Shared Project Structure Score Helpers

- **Decision:** Reuse a generic score-candidate helper across project shape and inferred stack detectors.
- **Problem:** Detectors duplicated fixed-candidate map creation and score increment logic.
- **Solution:** Added `project-structure-score-candidates.ts` and updated shape/stack detectors to use it.
- **Outcome:** Score bookkeeping is shared without changing analyzer output.

### Detected Area Module Cleanup

- **Decision:** Split detected-area normalization, candidate scoring, internal types, and rule groups into focused modules.
- **Problem:** `project-structure-detected-areas.ts` mixed orchestration, paths, mutable candidates, rules, and sorting.
- **Solution:** Added path helpers, internal detected-area types/candidates, and rule grouping modules.
- **Outcome:** Detected-area rules are easier to scan and extend.

### Project Structure Detected Areas

- **Decision:** Implement detected areas as deterministic `(name, path)` candidates scored from repository tree paths.
- **Problem:** Later analyzers had no structured map of important repo regions.
- **Solution:** Added the detected-area builder, analyzer wiring, and behavior coverage.
- **Outcome:** Project structure analysis produces an internal evidence-backed repo area map.

### GitHub Response DTO Cleanup

- **Decision:** Standardize GitHub client-safe responses around explicit response DTO mapping.
- **Problem:** Response serialization mixed with GitHub service logic and previously risked exposing token-bearing fields.
- **Solution:** Added `GitHubConnectionResponse` and `mapGitHubConnectionToResponse`.
- **Outcome:** GitHub response shaping now uses explicit allowlist mapping.

---

## 2026-05-12

### GitHub Connection Middleware Boundary

- **Decision:** Add dedicated middleware for routes that require a saved GitHub access token.
- **Problem:** GitHub-token routes duplicated DB reads and mixed authorization with controller/service logic.
- **Solution:** Added `requireGithubConnection`, protected `/repos` and `/analyze`, and passed the loaded token downstream.
- **Outcome:** GitHub-protected endpoints enforce connection state once at the route boundary.

---

## 2026-05-11

### GitHub Utility and Service Modularization

- **Decision:** Move pure GitHub helpers into backend `utils` and split service orchestration helpers.
- **Problem:** The temporary service mixed parsing, tree fetching, normalization, analyzer invocation, and logging.
- **Solution:** Consolidated pure helpers in `github-utils.ts`, kept `github-tree-fetcher.ts` for GitHub I/O, and thinned `github-analysis.service.ts`.
- **Outcome:** GitHub analysis has clearer boundaries between pure helpers, API fetching, and analyzer orchestration.

### Analyze Request Body Validation Cleanup

- **Decision:** Use the GitHub Zod schema as the source of truth for temporary analyze request typing.
- **Problem:** Controller typing and route validation were separate, and repo ID validation was too loose.
- **Solution:** Tightened `repoIds` schema and used inferred request body typing in the controller.
- **Outcome:** The temporary analyze endpoint has one validation/type source.

---

## 2026-05-09

### Temporary GitHub Analyze Endpoint

- **Decision:** Wire the GitHub repo picker Analyze button to a minimal backend endpoint that logs project-structure summaries.
- **Problem:** The analyzer could not be exercised against selected real repositories from onboarding.
- **Solution:** Added `POST /api/v1/auth/github/analyze`, controller validation, analysis orchestration, and frontend action wiring.
- **Outcome:** Selecting repositories in onboarding can exercise the project-structure analyzer against live GitHub tree data.

### Project Structure Analyzer Folder Boundary

- **Decision:** Move implemented project-structure analyzer files under `services/github-analysis/project-structure/`.
- **Problem:** The GitHub analysis root was becoming noisy beside future analyzer placeholders.
- **Solution:** Moved project structure orchestration, types, summary, index, detectors, and tests into a feature-local folder.
- **Outcome:** The implemented analyzer has a clear local module boundary.

### GitHub Analysis Architecture Doc

- **Decision:** Document the GitHub analysis domain and add it to the architecture index.
- **Problem:** GitHub analysis files existed without a first-read domain doc.
- **Solution:** Added the original GitHub analysis architecture doc and index entry.
- **Outcome:** Future GitHub analysis work had an architecture entry point and progress history.

### Structure-Inferred Stack Naming

- **Decision:** Rename `summary.primaryStack` to `summary.inferredStack`.
- **Problem:** `primaryStack` sounded final, but project structure only infers stack from paths and config-like filenames.
- **Solution:** Renamed the public summary contract, output, and tests.
- **Outcome:** The output communicates that stack values remain inferred until dependency/config analysis confirms them.

---

## 2026-05-08

### Project Shape and Inferred Stack Prototype

- **Decision:** Implement project shape and structure-inferred stack detection using deterministic score-based rules, not AI.
- **Problem:** Exact path matching was too brittle, while AI was too uncontrolled for first-stage classification.
- **Solution:** Added path indexing, shape scoring, stack scoring, summary building, and behavior tests.
- **Outcome:** Project structure analysis returns useful early classification without reading contents or calling AI.

### Project Structure Analyzer Modularization

- **Decision:** Split the large project structure analyzer into feature-local modules.
- **Problem:** Types, path indexing, scoring, summary building, and orchestration were mixed in one file.
- **Solution:** Moved contracts, detectors, and summary logic into focused modules with a thin entry point.
- **Outcome:** Future analyzer sections can grow independently.

---

## 2026-05-07

### GitHub Analysis Analyzer Scaffold

- **Decision:** Create one feature-local analyzer file per planned GitHub repo signal.
- **Problem:** The new GitHub analysis direction needed clear backend entry points without committing to queueing, AI prompts, or final orchestration yet.
- **Solution:** Added analyzer placeholders for project structure, dependency/config, source code, tests, README/docs, CI/CD, commits, and pull requests.
- **Outcome:** The backend has a clear place to build the GitHub analyzer pipeline incrementally.
