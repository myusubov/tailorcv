# GitHub Analysis Changelog

> Hub-level implementation log for the GitHub analysis domain. Project-structure analyzer implementation history lives in [project-structure/changelog.md](project-structure/changelog.md).

---

## 2026-05-15

### GitHub Analysis Doc Split

- **Decision:** Split the oversized GitHub analysis doc into a hub plus focused sub-docs for pipeline orchestration, project-structure analysis, and history.
- **Problem:** `docs/architecture/github-analysis.md` reached 521 lines and mixed endpoint orchestration, analyzer internals, and a long dev log, which crossed the project documentation split threshold.
- **Solution:**
  1. **Hub doc:** Created `docs/architecture/github-analysis/README.md` as the first-read overview and navigation point.
  2. **Focused docs:** Moved orchestration guidance to `pipeline/README.md`, analyzer rules/status to `project-structure/README.md`, and historical entries to `changelog.md`.
  3. **Index update:** Updated `docs/architecture/README.md` so GitHub analysis points to the new hub and supporting docs.
- **Outcome:** GitHub analysis documentation is below the effective retrieval threshold per file and easier to update without mixing unrelated concerns.

## 2026-05-13

### GitHub Response DTO Cleanup

- **Decision:** Standardize GitHub client-safe responses around explicit response DTO mapping.
- **Problem:** Response serialization mixed with GitHub service logic and previously risked exposing token-bearing fields.
- **Solution:** Added `GitHubConnectionResponse` and `mapGitHubConnectionToResponse`.
- **Outcome:** GitHub response shaping now uses explicit allowlist mapping.

## 2026-05-12

### GitHub Connection Middleware Boundary

- **Decision:** Add dedicated middleware for routes that require a saved GitHub access token.
- **Problem:** GitHub-token routes duplicated DB reads and mixed authorization with controller/service logic.
- **Solution:** Added `requireGithubConnection`, protected `/repos` and `/analyze`, and passed the loaded token downstream.
- **Outcome:** GitHub-protected endpoints enforce connection state once at the route boundary.

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

## 2026-05-09

### Temporary GitHub Analyze Endpoint

- **Decision:** Wire the GitHub repo picker Analyze button to a minimal backend endpoint that logs project-structure summaries.
- **Problem:** The analyzer could not be exercised against selected real repositories from onboarding.
- **Solution:** Added `POST /api/v1/auth/github/analyze`, controller validation, analysis orchestration, and frontend action wiring.
- **Outcome:** Selecting repositories in onboarding can exercise the project-structure analyzer against live GitHub tree data.

### GitHub Analysis Architecture Doc

- **Decision:** Document the GitHub analysis domain and add it to the architecture index.
- **Problem:** GitHub analysis files existed without a first-read domain README.
- **Solution:** Added the original GitHub analysis architecture doc and index entry.
- **Outcome:** Future GitHub analysis work had an architecture entry point and progress history.

## 2026-05-07

### GitHub Analysis Analyzer Scaffold

- **Decision:** Create one feature-local analyzer file per planned GitHub repo signal.
- **Problem:** The new GitHub analysis direction needed clear backend entry points without committing to queueing, AI prompts, or final orchestration yet.
- **Solution:** Added analyzer placeholders for project structure, dependency/config, source code, tests, README/docs, CI/CD, commits, and pull requests.
- **Outcome:** The backend has a clear place to build the GitHub analyzer pipeline incrementally.
