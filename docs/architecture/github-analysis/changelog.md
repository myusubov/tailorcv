# GitHub Analysis Changelog

> Historical implementation log for the GitHub analysis domain. New high-level doc changes go in the hub; implementation changes should add entries here when they affect pipeline or analyzer behavior.

---

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

## 2026-06-25

### Express.js Backend Area Detection

- **Decision:** Add conservative path-only Express.js backend detection after stronger backend framework detectors.
- **Problem:** Express is common in JavaScript/TypeScript backend repositories, but its path conventions are weak and generic Node folders such as `routes`, `controllers`, `middleware`, and `services` can appear outside Express applications.
- **Solution:** Added owner-scoped Express.js signal scoring and a guarded generator/layered-API shape gate in `detected-area-rules/backend/express-backend-area-rules.ts`, skipped owners already claimed by stronger backend detectors, exposed `Express.js` with `Node.js` runtime metadata, and added public-analyzer fixtures for generator, layered, server-owned, monorepo, repeated-signal, framework-interference, frontend-like, and weak Node shapes.
- **Outcome:** Conventional Express.js JavaScript and TypeScript applications now emit `Backend API`, while generic Node packages, weak folder clusters, and same-owner stronger backend framework claims remain non-emitting for Express.js.

## 2026-06-24

### Ruby on Rails Backend Area Detection

- **Decision:** Detect Ruby on Rails application owners through root-scoped, three-part application boot and routing shapes.
- **Problem:** The Rails detector scaffold had no behavior, while Ruby projects, Rails engines, and embedded test applications can contain Gemfiles, Rakefiles, controllers, routes, migrations, and even `bin/rails` without representing a deployable Rails application owner.
- **Solution:** Added owner-scoped Rails signal scoring and an application-config-anchored gate in `detected-area-rules/backend/rails-backend-area-rules.ts`, restricted evidence to repository-root and recognized monorepo-owner paths, exposed `Ruby on Rails`, `Ruby`, and conditional `ERB` metadata, and added public-analyzer fixtures for full, API-only, legacy, monorepo, engine, dummy-app, generator-template, repeated-signal, and weak Ruby structures.
- **Outcome:** Full and API-only Rails applications now emit `Backend API` with Ruby context and conditional ERB metadata, while Rails engines, generic Rack/Ruby projects, nested test applications, and weak-only file clusters remain non-emitting.

## 2026-06-22

### Laravel Backend Area Detection

- **Decision:** Detect Laravel backend owners through multi-version application bootstrap and ownership anchors instead of broad PHP conventions.
- **Problem:** The Laravel backend detector scaffold had no behavior, while Composer manifests, controllers, models, migrations, views, and package service providers are too broad to prove a runnable Laravel application by path alone.
- **Solution:** Added owner-scoped Laravel signal scoring and an explicit application-shape gate in `detected-area-rules/backend/laravel-backend-area-rules.ts`, exposed `Laravel`, `PHP`, and conditional `Blade` technology metadata, and added public-analyzer fixtures for current, canonical, modern, legacy, API, Blade, monorepo, package, repeated-signal, and weak PHP structures.
- **Outcome:** Recognized Laravel application owners now emit `Backend API` with Laravel as the primary technology, PHP as related context, and Blade when directly evidenced, while generic PHP projects and reusable Laravel packages remain non-emitting.

## 2026-06-20

### Backend Detector Evidence Folder Policy

- **Decision:** Let backend framework gates evaluate matching repository paths without a generic `docs`, `test`, `tests`, or `fixtures` exclusion policy.
- **Problem:** Django, Spring Boot, and ASP.NET Core had backend-only folder exclusions that were not shared by frontend detectors and were not based on observed user-repository false positives.
- **Solution:** Removed the generic ignored-prefix helpers from the three backend detectors and removed their documentation-sample negative fixtures, while preserving ASP.NET Core's signal-specific rejection of `wwwroot/appsettings*.json` as server configuration evidence.
- **Outcome:** Backend detector precision now comes from owner-scoped signal combinations consistently, and folder exclusions can be reintroduced later only when real repository evidence demonstrates a concrete false-positive pattern.

### ASP.NET Core Backend Area Detection

- **Decision:** Detect ASP.NET Core backend owners through path-only web host and project shape anchors.
- **Problem:** `.NET`/C# project files, `Program.cs`, and appsettings files are too generic to prove ASP.NET Core backend usage without same-owner web structure.
- **Solution:** Added owner-scoped ASP.NET Core signal scoring and an explicit shape gate in `detected-area-rules/backend/asp-net-core-backend-area-rules.ts`, exposed `ASP.NET Core`, `.NET`, and `C#` technology metadata, and added public-analyzer fixtures for controller Web API, minimal endpoint, legacy Startup, launch-settings, Razor Pages, MVC Views, monorepo, repeated-signal, weak-signal, and client-config structures.
- **Outcome:** Recognized ASP.NET Core Web API, minimal API, MVC, and Razor Pages shapes now emit `Backend API` with ASP.NET Core as the primary technology and `.NET`/`C#` as related context, while generic C# project structures remain non-emitting.

## 2026-06-17

### Spring Boot Backend Area Detection

- **Decision:** Detect Spring Boot backend owners through path-only application shape anchors instead of generic Java file conventions.
- **Problem:** The Spring Boot backend detector scaffold had no behavior, and most high-confidence Spring Boot proof lives inside build files or source annotations that the project-structure analyzer does not read.
- **Solution:** Added owner-scoped Spring Boot signal scoring and an explicit shape gate in `detected-area-rules/backend/spring-boot-backend-area-rules.ts`, exposed `Spring Boot`, `Java`, and `Kotlin` technology metadata, and added public-analyzer fixtures for simple, Gradle-backed, JHipster-style, config-backed, Kotlin, mixed-language, monorepo, repeated-signal, weak-signal, and documentation-sample structures.
- **Outcome:** Recognized Spring Boot repository shapes now emit `Backend API` with `Spring Boot` as the primary technology and Java/Kotlin as related context, while build-only, config-only, generic Java, and docs/test sample structures remain non-emitting.

## 2026-06-16

### Django Backend Area Detection

- **Decision:** Detect Django backend owners through project-level path anchors before accepting broader Django app conventions.
- **Problem:** The Django backend detector scaffold had no behavior, and Python app files such as `models.py`, `views.py`, `admin.py`, and `apps.py` are too broad to prove Django without `manage.py`, settings, URL, WSGI, or ASGI evidence.
- **Solution:** Added owner-scoped Django signal scoring and an explicit shape gate in `detected-area-rules/backend/django-backend-area-rules.ts`, exposed `Django` and `Python` technology metadata, and added public-analyzer fixtures for official startproject, manage-backed, split-settings, app-supported, settings-backed, monorepo, repeated-signal, weak-signal, reusable-package, documentation-sample, and Flask/FastAPI-like structures.
- **Outcome:** Deployable Django project shapes now emit `Backend API` with `Django` as the primary technology and `Python` as related context, while weak app-only and generic Python structures remain non-emitting.

## 2026-06-15

### NestJS Runtime Metadata

- **Decision:** Expose `Node.js` as related runtime context for path-detected NestJS backend areas.
- **Problem:** NestJS detection identified the framework but omitted the broader backend runtime context useful to downstream resume analysis.
- **Solution:** Added `Node.js` to the detected-area technology union and emitted it as a related technology from `detected-area-rules/backend/nest-backend-area-rules.ts`.
- **Outcome:** NestJS backend areas now communicate both the specific framework and its inherent Node.js runtime without incorrectly inferring an HTTP adapter such as Express.

## 2026-06-13

### NestJS Backend Area Detection

- **Decision:** Detect NestJS backend owners through anchored path combinations while keeping generic service conventions score-only.
- **Problem:** The backend detector scaffold had no NestJS behavior, and broad TypeScript conventions such as `main.ts`, `*.module.ts`, and `*.service.ts` could not safely prove NestJS without stronger same-owner structure.
- **Solution:** Added owner-scoped NestJS signal scoring and an explicit shape gate in `detected-area-rules/backend/nest-backend-area-rules.ts`, exposed `NestJS` technology metadata, and added public-analyzer fixtures for official starter, REST/microservice, WebSocket, GraphQL, backend-package, Nx-style, monorepo, interference, weak-signal, and repeated-signal structures.
- **Outcome:** Recognized NestJS repository shapes now emit `Backend API` with `NestJS` as the primary technology, while CLI-only, Angular-like, service-only, and unanchored generic clusters remain non-emitting.

## 2026-06-12

### Backend Detector Module Scaffold

- **Decision:** Establish the backend detected-area module structure before implementing framework-specific path rules.
- **Problem:** The modular detected-area dispatcher only had frontend rule modules, so backend detector work lacked isolated entry points and an explicit framework-before-fallback execution order.
- **Solution:** Added `detected-area-rules/backend/backend-area-rules.ts`, empty exported detector modules for NestJS, Django, Spring Boot, ASP.NET Core, Laravel, and Rails, an empty generic backend fallback module, and wired the backend dispatcher after frontend rules in `project-structure-detected-area-rules.ts`.
- **Outcome:** Backend detectors now have stable file and function boundaries ready for incremental signal, scoring, gate, competing-proof, and fallback implementation without changing analyzer output.

## 2026-06-10

### Standalone Svelte Frontend Detection

- **Decision:** Add standalone Svelte detection and treat `svelte.config.*` as shared Svelte ecosystem support rather than sufficient SvelteKit proof.
- **Problem:** Official Vite Svelte applications contain `svelte.config.js`, so the previous SvelteKit config-only gate classified standalone Svelte projects as SvelteKit and left no path for emitting `Svelte` as the primary technology.
- **Solution:** Added `svelte-frontend-area-rules.ts` with owner-scoped Vite and legacy Rollup signals gated by `src/App.svelte + src/main.*`, lowered SvelteKit config evidence to support-only, added a same-owner SvelteKit proof blocker, retired the unused generic frontend detector, and expanded realistic public-analyzer fixtures.
- **Outcome:** Standalone Svelte applications now emit `Frontend app` with primary technology `Svelte`, while SvelteKit remains primary with related technology `Svelte` and keeps precedence for the same owner.

## 2026-06-09

### Detected Area Inferred Technologies

- **Decision:** Include path-inferred primary and related technology metadata on every emitted detected area.
- **Problem:** Role labels such as `Frontend app` identified an area's purpose but discarded the framework-specific knowledge already established by the detector that created it.
- **Solution:** Added required technology metadata to `addAreaScore`, assigned explicit primary/related values in every frontend detector, accumulated related technologies with an internal `Set`, exposed stable arrays in `DetectedProjectArea`, and added detector-matrix plus candidate-merge regression tests.
- **Outcome:** Consumers can distinguish Next.js, React Router, Nuxt, Vue, React, Angular, SvelteKit, Astro, and static frontend areas while preserving the existing owner, score, and evidence model.

## 2026-06-08

### Static Frontend Competing-Owner Gate

- **Decision:** Treat static frontend detection as the broad fallback and block it only when the same owner satisfies an existing non-static frontend detector gate.
- **Problem:** Framework repositories with root `index.html`, CSS, or JavaScript files could merge static evidence into the same `Frontend app` candidate even after a stronger framework detector had identified the owner.
- **Solution:** Added a normalized candidate-presence helper in `project-structure-detected-area-candidates.ts`, moved static detection after every stronger frontend detector in `frontend-area-rules.ts`, and updated `static-frontend-area-rules.ts` to skip owners already claimed as `Frontend app`.
- **Outcome:** Framework-owned frontend areas no longer receive static fallback evidence, while sibling static sites and sites containing incomplete framework-like hints remain detectable.

## 2026-06-05

### React and Static Frontend Confidence Fixtures

- **Decision:** Add realistic React fallback and static frontend repository-shape fixtures around the public project-structure analyzer output.
- **Problem:** Existing tests covered focused React and static gates, but the broad fallback detectors lacked grouped confidence coverage for realistic app shapes, framework interference, monorepo isolation, and weak-hint structures.
- **Solution:** Added dedicated React and static fixture sections in `project-structure-analyzer.test.ts` that run full analyzer inputs and assert emitted `Frontend app` owners and evidence.
- **Outcome:** The full frontend detector confidence pass now covers framework-specific, broad React fallback, and plain static frontend layouts through public analyzer output.

### SvelteKit and Astro Frontend Confidence Fixtures

- **Decision:** Add realistic SvelteKit and Astro repository-shape fixtures around the public project-structure analyzer output.
- **Problem:** Existing tests covered focused SvelteKit and Astro gates, but the detectors lacked grouped confidence coverage for realistic full-app, config-only, monorepo, support-evidence, and weak-hint structures.
- **Solution:** Added dedicated SvelteKit and Astro fixture sections in `project-structure-analyzer.test.ts` that run full analyzer inputs and assert emitted `Frontend app` owners and evidence.
- **Outcome:** SvelteKit and Astro detector behavior is now protected against regressions across common layouts, weak hints, owner isolation, and support-evidence gates.

### Angular Frontend Confidence Fixtures

- **Decision:** Add realistic Angular repository-shape fixtures around the public project-structure analyzer output.
- **Problem:** Existing tests covered focused Angular gates, but the detector lacked grouped confidence coverage for CLI workspace, standalone, classic NgModule, config-only, monorepo, and weak-hint structures.
- **Solution:** Added a dedicated Angular fixture section in `project-structure-analyzer.test.ts` that runs full analyzer inputs and asserts emitted `Frontend app` owners and evidence.
- **Outcome:** Angular detector behavior is now protected against regressions across common Angular layouts, weak hints, and owner isolation.

### Vue Frontend Confidence Fixtures

- **Decision:** Add realistic Vue repository-shape fixtures around the public project-structure analyzer output.
- **Problem:** Existing tests covered focused Vue gates, but the detector lacked grouped confidence coverage for Vite Vue, Vue Router, file-based Vue Router, Vue CLI, monorepo, and Nuxt fallback-interference structures.
- **Solution:** Added a dedicated Vue fixture section in `project-structure-analyzer.test.ts` that runs full analyzer inputs and asserts emitted `Frontend app` owners and evidence.
- **Outcome:** Vue detector behavior is now protected against regressions across common Vue layouts, weak hints, owner isolation, and same-owner Nuxt fallback interference.

## 2026-06-04

### Nuxt Frontend Confidence Fixtures

- **Decision:** Add realistic Nuxt repository-shape fixtures around the public project-structure analyzer output.
- **Problem:** Existing tests covered focused Nuxt gates, but the detector lacked grouped confidence coverage for realistic Nuxt 3, Nuxt 4, config-only, monorepo, and Vue fallback-interference structures.
- **Solution:** Added a dedicated Nuxt fixture section in `project-structure-analyzer.test.ts` that runs full analyzer inputs and asserts emitted `Frontend app` owners and evidence.
- **Outcome:** Nuxt detector behavior is now protected against regressions across common Nuxt layouts, weak hints, owner isolation, and same-owner Vue fallback interference.

## 2026-06-03

### React Router Frontend Confidence Fixtures

- **Decision:** Add realistic React Router Framework Mode repository-shape fixtures around the public project-structure analyzer output.
- **Problem:** Existing tests covered React Router gate behavior, but the detector lacked grouped confidence coverage for route-config, file-route, custom-entry, monorepo, and fallback-interference structures.
- **Solution:** Added a dedicated React Router fixture section in `project-structure-analyzer.test.ts` that runs full analyzer inputs and asserts emitted `Frontend app` owners and evidence.
- **Outcome:** React Router detector behavior is now protected against regressions across common Framework Mode layouts, weak hints, owner isolation, and same-owner React fallback interference.

### Next.js Frontend Confidence Fixtures

- **Decision:** Add realistic Next.js repository-shape fixtures around the public project-structure analyzer output.
- **Problem:** Existing tests covered individual Next.js behaviors, but the detector lacked a grouped confidence suite for common App Router, Pages Router, config-only, monorepo, and fallback-interference structures.
- **Solution:** Added a dedicated Next.js fixture section in `project-structure-analyzer.test.ts` that runs full analyzer inputs and asserts emitted `Frontend app` owners and evidence.
- **Outcome:** Next.js detector behavior is now protected against regressions across common valid layouts, weak-only hints, owner isolation, and same-owner React/static fallback interference.

## 2026-06-01

### SvelteKit and Astro Frontend Shape Gates

- **Decision:** Make SvelteKit and Astro output gates explicit so weak/support signals cannot emit frontend areas by score threshold alone.
- **Problem:** SvelteKit app templates or load files and Astro layout/component files could independently cross the global frontend area threshold without enough framework app proof.
- **Solution:** Split SvelteKit route components from load files, gated SvelteKit output on config, route components, or load/server evidence paired with `src/app.html`, and replaced Astro's score-threshold gate with explicit config or `.astro` page proof.
- **Outcome:** SvelteKit and Astro detection now preserve strong framework conventions while support-only evidence remains non-emitting.

### Angular Frontend Shape Gate

- **Decision:** Require Angular frontend output to have Angular CLI workspace proof or a complete root app shape before emitting a `Frontend app` area.
- **Problem:** The previous `angular-app-component` signal treated root component templates and styles as strong proof, so weak Angular-looking files could emit an area without TypeScript root component or bootstrap evidence.
- **Solution:** Split Angular root component evidence into TypeScript and view signals, added standalone `app.config.ts` support, and gated output on workspace config or root component/module/standalone combinations.
- **Outcome:** Angular detection now covers CLI, classic module-based, and standalone app layouts while support-only files remain evidence boosters instead of emit triggers.

## 2026-05-27

### React Router Frontend Shape Gate

- **Decision:** Require React Router framework output to have explicit config or root-route-based framework structure before emitting a `Frontend app` area.
- **Problem:** Optional entry files or `app/routes` file routes could reach the global score threshold without proving a React Router framework app by themselves.
- **Solution:** Added a final React Router app-shape gate that allows `react-router.config.*` alone or `app/root.*` combined with routes config, file routes, or custom entry files.
- **Outcome:** React Router detection still covers common framework layouts while weak support-only evidence no longer emits frontend areas.

### Next.js Frontend Shape Gate

- **Decision:** Require Next.js frontend output to have strong Next-specific proof before adding a `Frontend app` area.
- **Problem:** Weak Next-like hints such as support files, route directories, or generic `src/pages/*.tsx` files could reach the global score threshold without proving a Next.js app.
- **Solution:** Added a final Next.js app-shape gate that allows config, App Router core files, or Pages Router special files while leaving support and generic route evidence as score/evidence boosters only.
- **Outcome:** Next.js detection still emits for common App Router and Pages Router applications, but weak-only route hints no longer produce frontend areas.

### Vue Frontend Competing-Proof Gate

- **Decision:** Move Vue's Nuxt blocker onto the shared competing-proof helper pattern used by broad frontend detectors.
- **Problem:** Vue locally duplicated Nuxt proof lookup and owner tracking instead of using the shared same-owner competing-proof flow.
- **Solution:** Added blocker-grade Nuxt proof lookup and updated Vue output gating to skip only owners with matching Nuxt config or app-entry proof.
- **Outcome:** Vue keeps its existing app-shape gate while using the same competing-proof model as React for meta-framework suppression.

### React Frontend Competing-Proof Gate

- **Decision:** Add the first owner-scoped competing-proof gate to the broad React frontend detector.
- **Problem:** Generic React evidence such as `index.html` and `src/App.tsx` could merge into the same `Frontend app` candidate as stronger Next.js or React Router framework proof for the same owner.
- **Solution:** Added blocker-grade frontend proof helpers for Next.js and React Router, finalized same-owner competing proof checks, and gated React output so those stronger framework proofs suppress only the matching owner.
- **Outcome:** React fallback detection remains available for standalone React apps while avoiding mixed React evidence on same-owner Next.js and React Router areas.

### React Frontend Shape Gate

- **Decision:** Require broad React fallback evidence to form a recognized app shape before emitting a frontend area.
- **Problem:** Single broad signals such as `src/App.tsx` could pass the global area threshold without enough surrounding React app structure.
- **Solution:** Added final React shape checks for Vite React, CRA-style React, and structured React component/page layouts.
- **Outcome:** React detection now stays available for common React app layouts while weak isolated React-like files no longer emit `Frontend app`.

### Frontend Area Rule Modularization

- **Decision:** Migrate the remaining active frontend owner-scoped detectors to the shared area-rule candidate infrastructure after proving the pattern on Next.js.
- **Problem:** Nuxt, Vue, React Router, React, Static, Angular, SvelteKit, and Astro still repeated the same owner lookup, candidate creation, counted-signal mutation, and score/evidence update logic in every signal loop.
- **Solution:** Updated those rule modules to use shared owner candidate map creation, typed signal-score maps, and once-per-owner signal counting while preserving each detector's finder variables, signal scores, gates, and output behavior.
- **Outcome:** Active frontend detectors now share the same candidate mutation path, reducing boilerplate before future gate-blocker work without changing detected-area semantics.

## 2026-05-25

### Detected Area Rule Candidate Infrastructure

- **Decision:** Start modularizing repeated detected-area rule candidate types before changing existing framework rule behavior.
- **Problem:** Frontend rule modules repeatedly define the same owner-scoped candidate shape and map typing, which makes future gate-blocker refactors noisier than necessary.
- **Solution:** Added `detected-area-rules/project-structure-area-rule-candidates.ts` with shared generic candidate, score-map, owner-map factory, once-per-owner signal counting, and area-candidate adding exports, then migrated the Next.js frontend rule to use them while keeping its finder loops explicit.
- **Outcome:** Future detector cleanup can migrate one rule at a time to shared infrastructure without mixing framework-specific signal meanings or changing analyzer output.

### Static Frontend Area Rule

- **Decision:** Add a plain static frontend detected-area rule for repositories that do not use a framework-specific frontend convention.
- **Problem:** Frontend detection covered framework and library app shapes, but simple HTML/CSS/JavaScript sites with root `index.html`, stylesheet evidence, static asset folders, or Vite static structure still lacked a conservative owner-scoped rule.
- **Solution:** Added `detected-area-rules/frontend/static-frontend-area-rules.ts` with fixed per-owner signal scoring for root HTML/CSS/JS files, `css`/`js` directory files, Vite config, and `src` static support files, then gated output on supported static page combinations.
- **Outcome:** Plain static site regions can now emit role-based `Frontend app` candidates without treating isolated HTML files or nested generated docs as frontend apps.

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
