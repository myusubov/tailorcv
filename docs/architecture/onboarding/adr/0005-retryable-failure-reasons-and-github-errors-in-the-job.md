# ADR 0005: Retryable Failure Reasons and GitHub Errors in the Job

- **Status:** Accepted
- **Date:** 2026-11-28
- **Domain:** docs/architecture/onboarding/
- **Related changelog entry:** [changelog.md](../changelog.md#retry-for-github_repo_analysis_failed-and-github-errors-in-the-job)

---

## Context

[ADR 0004](0004-retry-a-failed-resume-from-its-stored-analysis.md) lets only a resume that failed with `SERVICE_UNAVAILABLE` be retried. Two gaps remained:

- A resume that failed with `GITHUB_REPO_ANALYSIS_FAILED` (every selected repository could not be read) got 409, although the user can fix the cause, for example by sharing a repository with the app again.
- The worker stored a raw Octokit `RequestError` as `INTERNAL_ERROR`, because `mapOctokitErrorToAppError` ran only in the Express error handler. A GitHub outage or rate limit during analysis therefore ended as a failure no retry accepts.

## Decision

`resetFailedResume` accepts a `FAILED` resume whose reason is in `RETRYABLE_FAILURE_REASONS`: `SERVICE_UNAVAILABLE` and `GITHUB_REPO_ANALYSIS_FAILED`. Any other state or reason still gives 409 `RESUME_NOT_RETRYABLE`. A reason becomes retryable by being added to that list, in the same change that designs its retry.

A `GITHUB_REPO_ANALYSIS_FAILED` retry needs no job change: nothing was stored when every repository failed, so `analyzedRepoIds` is empty and `generateResume` runs the full flow.

`getFailureReason` translates a `RequestError` with `mapOctokitErrorToAppError`. Of the codes it returns, `GITHUB_API_ERROR` and `RATE_LIMIT_EXCEEDED` are stored as `SERVICE_UNAVAILABLE`, because the user's action is the same (wait and try again) and that reason already has a retry. `GITHUB_CONNECTION_REQUIRED` and `INTERNAL_ERROR` are stored as the mapper returns them.

A failed repository carries no reason of its own. The analysis cannot tell most causes apart (a repository missing from the installation has no name, and a 404 covers both lost access and a missing default branch), so `failedRepoNames` stays a list of names.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| One list of retryable reasons (chosen) | One place to read and extend; costs a test expectation that is updated by hand with the list. |
| A second `OR` condition in the reset query | No list, but the rule spreads across the query and is harder to read. |
| Store `GITHUB_API_ERROR` and `RATE_LIMIT_EXCEEDED` as their own reasons | More precise, but each needs a story and a retry, for the same user action as `SERVICE_UNAVAILABLE`. |
| A reason per failed repository | Would need a structured field in place of `failedRepoNames`, for causes the analysis mostly cannot distinguish. |

## Consequences

- A `SERVICE_UNAVAILABLE` resume may have no stored analysis, so its retry can read GitHub again.
- A `GITHUB_REPO_ANALYSIS_FAILED` retry helps only if the user fixed the cause first. There is still no retry limit, cooldown or attempt counter.
- `GITHUB_APP_SUSPENDED`, `GITHUB_CONNECTION_REQUIRED` and `INTERNAL_ERROR` still get 409.
- If a retry cannot be queued (Redis down), the resume is stored as `SERVICE_UNAVAILABLE` even when it failed with `GITHUB_REPO_ANALYSIS_FAILED`; the next retry that reaches the job restores the original reason. Accepted because it is rare and self-correcting. Revisit when the failed-resume page exists, since until then that page would lose its choose-other-repositories action.
- There is no frontend control for retry yet.

## References

- `apps/backend/src/services/resume.service.ts` (`RETRYABLE_FAILURE_REASONS`, `resetFailedResume`)
- `apps/backend/src/services/resume-generation.service.ts` (`getFailureReason`)
- `apps/backend/src/lib/octokit-error.ts`
- `apps/backend/src/services/resume.service.test.ts`, `apps/backend/src/services/resume-generation.service.test.ts`
- [ADR 0003](0003-generate-resume-content-in-a-queue-worker.md), [ADR 0004](0004-retry-a-failed-resume-from-its-stored-analysis.md)
