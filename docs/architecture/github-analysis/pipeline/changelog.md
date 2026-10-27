# GitHub Analysis Pipeline Changelog

> Chronological implementation history for GitHub Analysis Pipeline. Add new entries at the top.

---

Historical pipeline entries currently live in the parent GitHub Analysis changelog: [../changelog.md](../changelog.md).

## 2026-10-27

### Rate Limiting Not Applied to GitHub Routes

- **Decision:** No backend route applies a rate limiter. The owner removed rate limiting on purpose; the reason was not recorded.
- **Problem:** The AI chat routes were the only routes that applied a limiter. `githubAuthRateLimiter`, `githubApiRateLimiter` and `globalRateLimiter` were already defined but not applied (the global one is commented out in `apps/backend/src/server.ts`).
- **Solution:**
  1. **Chat limiters removed — `apps/backend/src/middleware/rateLimiter.ts`**: `aiChatRateLimiter` and `aiConversationCrudRateLimiter` were deleted with the chat router.
  2. **Guidance updated — `CLAUDE.md`**: The backend route pattern no longer tells contributors to apply a limiter, and says none is applied on purpose.
  3. **Risk recorded — pipeline README, Risks & Mitigations**: The analyze endpoint and the other GitHub routes are listed as unthrottled.
- **Outcome:** The unused GitHub and global limiters stay in place for a later decision. No ADR was written because the rationale and alternatives are not recorded. Not verified: no request-level check of the unthrottled routes was run.

## 2026-10-23

### Candidate File Contents in the Analyze Response

- **Decision:** Read the files the analyzer picks and return their text beside the structure analysis, so later steps do not have to re-fetch them. The failure rule is recorded in [ADR 0002](adr/0002-scope-github-failures-by-blast-radius.md).
- **Problem:** `candidateFilesToInspect` was always empty and the analyze response carried paths only, so nothing could say what a project does.
- **Solution:**
  1. **Per-path read — `apps/backend/src/services/github-analysis.service.ts`**: After `analyzeProjectStructure`, each path in `candidateFilesToInspect` is read with `fetchRepoFile`, all paths of a repository in parallel, and returned as `candidateFileContents` (`{ path, content }`).
  2. **Text request and missing files — `apps/backend/src/services/github.service.ts`**: `fetchRepoFile` asks for GitHub's raw media type, so no base64 decoding is needed. It returns `null` for a 404 and when the response is not text (for example a directory), and rethrows every other error. The analysis service has no per-file catch, so those errors reach the global error handler and reject the call.
  3. **Contract — `packages/shared/src/types/github-analysis.ts`**: Adds `CandidateFileContent` and `candidateFilesToInspect` / `candidateFileContents` to `AnalyzedGithubRepository`.
- **Affected files:** `apps/backend/src/services/github-analysis.service.ts`, `apps/backend/src/services/github.service.ts`, `packages/shared/src/types/github-analysis.ts`, `apps/backend/src/types/github.ts`.
- **Outcome:** The analyze response includes file text for the picked files. `CandidateFileContent.error` exists but no path sets it. A read-only unauthenticated request to a public repository confirmed that a nested path is accepted in Octokit's `%2F`-encoded form, that raw text comes back as a string, that a directory path returns an array, and that a missing file throws 404. The backend typecheck reported no errors once during development and was not re-run after the final refactors; no test or lint was run. Candidate paths per repository are capped at 10 (tier two) and 5 (tier three) beyond the uncapped tier one.

### Octokit Client and GitHub Failure Handling

- **Decision:** Move installation, repository, tree and file requests to one Octokit client and map its errors to `ErrorCode`s in the global error handler; degrade a repository or file only for statuses that concern that unit ([ADR 0002](adr/0002-scope-github-failures-by-blast-radius.md)).
- **Problem:** GitHub requests used raw `fetch` with per-call 502 `AppError`s. A revoked or suspended installation, a rate limit, a GitHub outage and a missing resource were not told apart, and one failing tree rejected the analysis for every selected repository.
- **Solution:**
  1. **Client — `apps/backend/src/lib/octokit.ts`**: `createOctokit(token)` builds the client from the individual `@octokit` packages (the `octokit` umbrella pulls in `@octokit/app`, which has no CommonJS entry and fails to load under `tsx`), adds pagination, retry (no retry for 400, 401, 403, 404, 409, 410, 422, 429, 451) and throttling that fails fast on a rate limit, and pins `x-github-api-version` to `2026-03-10`.
  2. **Error mapping — `apps/backend/src/lib/octokit-error.ts`, `apps/backend/src/middleware/error.ts`**: `mapOctokitErrorToAppError` produces `RATE_LIMIT_EXCEEDED`, `GITHUB_CONNECTION_REQUIRED`, `GITHUB_API_ERROR` or `INTERNAL_ERROR` (table in the pipeline README, 6.3); `errorHandler` applies it to every `RequestError`. The same edit removed the cockatiel resilience branch from `errorHandler`; `handleResilienceError` is still called directly by `ai-chat.controller.ts`, and the reason for the removal is not recorded.
  3. **Service calls — `apps/backend/src/services/github.service.ts`**: Installation token creation (no longer retried on 401; JWT lifetime shortened from 10 to 9 minutes), the suspended-installation check in `getValidInstallationToken` (`GITHUB_APP_SUSPENDED`), `fetchGithubRepos` (still limited to the first 100 repositories, with pagination deferred, and now returning the array), `fetchRepositoryTree` (moved here from the deleted `github-analysis/github-tree-fetcher.ts`) and `fetchRepoFile` use the client.
  4. **Partial results — `apps/backend/src/services/github-analysis.service.ts`**: A selected repository missing from the installation list, or whose tree answers 404, 409 or 422, goes to `failedRepoIds` while the others return; the call fails with 400 only when none of the selected repositories is found.
  5. **Response shapes — `apps/backend/src/controllers/github.controller.ts`, `packages/shared/src/types/`**: `getGithubRepos` responds `{ total_count, repositories }`, analyze responds with `AnalyzeGithubReposResponse` directly instead of `{ result }`, and `ErrorCode` gains `GITHUB_API_ERROR` and `GITHUB_APP_SUSPENDED`. The analyze contract moved from backend and frontend copies to `packages/shared/src/types/github-analysis.ts`.
- **Affected files:** `apps/backend/src/lib/octokit.ts`, `apps/backend/src/lib/octokit-error.ts`, `apps/backend/src/middleware/error.ts`, `apps/backend/src/services/github.service.ts`, `apps/backend/src/services/github-analysis.service.ts`, `apps/backend/src/controllers/github.controller.ts`, `apps/backend/src/types/github.ts`, `apps/backend/src/mappers/github.mapper.ts`, `packages/shared/src/types/errors.ts`, `packages/shared/src/types/github-analysis.ts`, `packages/shared/src/index.ts`.
- **Outcome:** Each GitHub failure meaning has one code and status, and repository-specific failures no longer fail the whole analysis. Known limits: `exchangeCodeForToken`, `verifyGithubUserCanAccessInstallation`, `getGitHubUser`, commits, pull requests and README requests still use raw `fetch`; the 422 tree status is handled without a recorded reason; `octokit-error.test.ts` and `error.test.ts` were written but not run, and no lint was run (see the previous entry for the typecheck).

## 2026-08-21

### OAuth State TTL Extended

- **Problem:** The 5-minute Redis TTL on `github_oauth_state:<state>` (`apps/backend/src/services/github.service.ts`) could expire before a user completed the GitHub App installation authorization redirect.
- **Solution:** Extended the TTL to 15 minutes (`EX 900`).
- **Outcome:** Callback state remains valid for longer installation flows while still expiring and single-use via `GETDEL`.

## 2026-08-19

### GitHub App Installation Connection and Token Lifecycle

- **Problem:** The prior broad OAuth connection stored user identity and a long-lived token, used replayable stateless JWT state, and could not represent a repository-scoped GitHub App installation.
- **Solution:**
  1. Updated `getGithubAuthUrl` in `apps/backend/src/services/github.service.ts` to generate random 32-byte Base64URL states and persist `github_oauth_state:<state> -> clerkUserId` in Redis for 5 minutes (`EX 300`).
  2. Routed authorization redirects to `https://github.com/apps/<GITHUB_APP_SLUG>/installations/new?state=<state>`.
  3. Updated `handleGithubCallback` in `apps/backend/src/controllers/github.controller.ts` to atomically consume and validate state, verify the authorized GitHub user can access the returned installation, and create an installation token with an app-signed JWT.
  4. Replaced legacy connection fields in `apps/backend/prisma/schema.prisma` with the installation ID, cached installation token, and expiration; the accompanying migration deletes incompatible legacy OAuth records.
  5. Updated `requireGithubConnection` and `apps/backend/src/services/github.service.ts` to refresh a token that is within five minutes of expiry before protected GitHub operations.
  6. Narrowed `GitHubConnectionResponse` and the onboarding picker contract so the browser receives connection status and installation-repository results without GitHub account identity or token-bearing fields.
- **Outcome:** GitHub access is installation-scoped, callback state is single-use and server-side, protected operations use renewable short-lived tokens, and legacy connections require an explicit reconnect.

## 2026-08-18

### GitHub App Environment Preparation

- Replaced the backend environment schema's OAuth-only keys with required
  GitHub App identity, user authorization, callback, and private-key settings.
- Normalized escaped PEM newlines during environment loading.
- Added temporary legacy aliases inside the config boundary so the existing
  OAuth service remains buildable until its redirect and token flow is replaced.
