# GitHub Analysis Changelog

> Hub-level implementation log for the GitHub analysis domain. Project-structure analyzer implementation history lives in [project-structure/changelog.md](project-structure/changelog.md).

---

## 2026-10-14

### Evidence-to-AI Side-Check: Candidate Files Confirmed High Value

- **Decision:** Treat Candidate Files to Inspect (raw file content handed to the AI call) as the highest-value Sprint 3 item. The analyzer output stays as the verified-facts layer and the file picker, not the only AI input.
- **Problem:** The MVP plan assumed GitHub evidence plus AI could produce a good resume, but nothing had checked what the path-only analyzer output could carry on its own. Structure facts cannot say what a project does.
- **Solution:**
  1. Manually ran the analyzer on the TailorCV repository (567 files) and pasted the per-repo JSON into Claude (web app) with one real job description, a Full-Stack TypeScript/Next.js posting. No script, schema or UI was built.
  2. Pass A gave the model the JSON only; pass B added a hand-written `<repo_notes>` block approximating what a README would supply. Both prompts told the model to treat signals as heuristics (`present: false` means "not detected"), to invent no metrics (placeholders instead), to map each bullet to its evidence fields, and to ask questions about gaps.
  3. `analyzeGithubRepositories` (`github-analysis.service.ts`) now also returns a `repository` object per repo (`id`, `name`, `fullName`, `description`, `htmlUrl`, `topics`, `isFork`, `language`) from the repo listing it already fetched, so the AI can see the project name. It is built by the new `mapGitHubRepoToMetadata` in `mappers/github.mapper.ts` and typed as `GithubRepositoryMetadata` in `types/github.ts`. The path-only analyzer is unchanged.
- **Affected files:** `apps/backend/src/services/github-analysis.service.ts`, `apps/backend/src/mappers/github.mapper.ts`, `apps/backend/src/types/github.ts`, `docs/architecture/github-analysis/pipeline/README.md`, `docs/architecture/github-analysis/changelog.md`.
- **Outcome:** Pass A stayed grounded (placeholders, no invented skills, sharp questions) but its bullets were inferred from file names and it could not state the project's purpose. Pass B was clearly better and drew nearly all its substance from the notes; the analyzer JSON still supplied the checkable facts (78 test files against 394 source files, CI, Docker, layered backend). Both passes left out job-description requirements the evidence did not support (multi-tenancy, webhooks, FinTech, Vercel, Sentry). Sprint 3 consequences: research first how to choose which files to read, then build Candidate Files from the findings (what to pick is not decided yet), label claims as stated by file content versus verified by structure, cap bullet length (the pass B bullets ran three lines or more), and keep the "not detected" wording and the evidence table in the synthesis prompt. Known limits: one repository and one job description; the notes were written from `CLAUDE.md`, not the repository README; the mismatched-job-description run was not done; Claude web account context leaked into one pass B question, so verify the final prompt through the API. No tests, typecheck or lint were run for the service change.

## 2026-08-26

### Temporary Analyze Endpoint Resumed

- **Decision:** Invoke the real `analyzeGithubRepositories` orchestration from the analyze endpoint instead of the placeholder empty response, and align the surrounding types with the current `github.service.ts`/`github-tree-fetcher.ts` return shapes.
- **Problem:** `analyzeGithubRepos` had been temporarily short-circuited to `return successResponse(res, {}, 200)` while `analyzeGithubRepositories` was implemented against an older `fetchGithubRepos` (array return) and `fetchRepositoryTree` (`{ tree: { tree, truncated } }`) contract; those services had since moved to `{ repositories }` and `{ tree, truncated }` respectively, and `GitHubRepo` had no `default_branch` field, so re-enabling the call needed matching fixes rather than a one-line revert.
- **Solution:**
  1. Re-enabled the call in `analyzeGithubRepos` (`github.controller.ts`), passing `githubConnection.installationAccessToken` and returning `{ result }`.
  2. Updated `analyzeGithubRepositories` (`github-analysis.service.ts`) to destructure `{ repositories }` from `fetchGithubRepos` and `{ tree, truncated }` from `fetchRepositoryTree`, and removed the now-redundant local `GitHubRepoForAnalysis` type.
  3. Added `default_branch?: string` to the shared `GitHubRepo` type (`packages/shared/src/types/github.ts`) so `repo.default_branch` is typed instead of cast.
  4. Changed frontend `AnalyzeGithubReposInput` from a bare `number[]` to `{ repoIds: number[] }` and updated `GitHubStep`'s `handleAnalyze` to match the action's object input.
  5. Simplified `splitRepositoryFullName` from an object-parameter to a single string parameter, matching the project convention that single-input functions take the value directly.
- **Affected files:** `apps/backend/src/controllers/github.controller.ts`, `apps/backend/src/services/github-analysis.service.ts`, `apps/backend/src/utils/github-utils.ts`, `packages/shared/src/types/github.ts`, `apps/frontend/lib/types/github.ts`, `apps/frontend/app/components/onboarding/github/github-step.tsx`, `docs/architecture/github-analysis/pipeline/README.md`, `docs/architecture/github-analysis/changelog.md`.
- **Outcome:** Selecting repositories in onboarding and clicking Analyze now returns real project-structure summaries and detected areas end-to-end instead of an empty placeholder. This entry documents only the endpoint-wiring fix; it does not cover the in-progress declarative detected-area rule engine migration recorded separately in [project-structure/changelog.md](project-structure/changelog.md).

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
