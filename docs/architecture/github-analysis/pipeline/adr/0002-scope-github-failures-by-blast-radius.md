# ADR 0002: Scope GitHub Failures by Blast Radius

- **Status:** Accepted
- **Date:** 2026-10-23
- **Domain:** `docs/architecture/github-analysis/pipeline/`
- **Related changelog entry:** [../changelog.md](../changelog.md)

---

## Context

The analyze call makes many GitHub requests for up to three repositories: one tree request per repository and one file request per candidate path. Some failures concern one repository or file (a deleted file, a removed repository, an empty repository). Others concern every request (a rate limit, a rejected or revoked installation token, a GitHub outage). Catching every error at a call site makes the second kind look like success: the user would get empty file contents instead of a rate-limit message or a reconnect prompt.

## Decision

Classify GitHub failures once, at the Octokit boundary, and let the call site decide only what is local.

- `createOctokit` returns the single client; non-2xx responses throw `RequestError`. The global error handler converts every `RequestError` with `mapOctokitErrorToAppError`, so each failure meaning has one `ErrorCode` and HTTP status.
- `analyzeGithubRepositories` degrades a single unit only for statuses that concern that unit: a tree request answered with 404, 409 or 422 puts the repository in `failedRepoIds`, and `fetchRepoFile` itself returns `null` for a 404, so that candidate file gets `content: null` without a catch in the analysis service.
- Every other failure is rethrown and rejects the whole call, so the user sees the rate-limit toast, the reconnect page or the GitHub-outage message.
- A new local status needs a stated reason that it concerns one repository or file and not the installation.

## Considered Options

| Option                                                     | Tradeoff                                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Catch every error per file and return `null` content       | Never fails the call, but hides rate limits, rejected tokens and outages behind empty results that look successful.       |
| Reject the whole call on any error, including a 404        | Simple, but one file deleted after the tree was read fails every selected repository.                                    |
| Scope by blast radius at the call site (chosen)            | Needs an explicit list of local statuses and a rethrow, but keeps shared failures visible and one-off failures contained. |

## Consequences

- A rate limit, a rejected token or a GitHub outage during file reads fails the analyze call for all selected repositories, including repositories whose files were read.
- `CandidateFileContent.error` is not set by any current path; it remains in the contract for a future per-file failure that concerns only that file.
- Raw `fetch` call sites in `github.service.ts` are not covered by this classification until they move to the Octokit client.
- The mapper, the call-site status lists and the frontend error states must change together when a new status is introduced.

## References

- `apps/backend/src/lib/octokit.ts`
- `apps/backend/src/lib/octokit-error.ts`
- `apps/backend/src/middleware/error.ts`
- `apps/backend/src/services/github-analysis.service.ts`
- `packages/shared/src/types/github-analysis.ts`
- `apps/backend/src/lib/octokit-error.test.ts`
- `apps/backend/src/middleware/error.test.ts`
- `docs/architecture/github-analysis/pipeline/changelog.md`
