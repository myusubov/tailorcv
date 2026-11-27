# ADR 0004: Retry a Failed Resume From Its Stored Analysis

- **Status:** Accepted
- **Date:** 2026-11-26
- **Domain:** docs/architecture/onboarding/
- **Related changelog entry:** [changelog.md](../changelog.md#retry-for-a-resume-that-failed-with-service_unavailable)

---

## Context

A resume that failed with `SERVICE_UNAVAILABLE` (Redis rejected the job, Gemini was overloaded, the database was unreachable) left the user with a dead resume and no way to continue. Retrying should not repeat work that already succeeded, such as the GitHub analysis. The `analyses` table has one row per user and repository, overwritten on every analysis, so a row cannot say which resume it was written for.

## Decision

`POST /api/v1/resumes/:id/retry` moves the user's resume from `FAILED` to `GENERATING` and clears its failure reason, only when it failed with `SERVICE_UNAVAILABLE`. It then removes the old queue job and adds a new one. The job id is the resume id and BullMQ ignores an add while a job with that id still exists, so the old job has to go first. If removing or adding fails, the resume is marked `FAILED` again and the endpoint answers 503.

A resume that is not the user's gives 404. A resume in any other state, or one that failed for another reason, gives 409 `RESUME_NOT_RETRYABLE`.

`Resume.analyzedRepoIds` holds the ids of the repositories whose analysis was stored for this resume. The job writes it after `storeAnalyses` succeeds, never before.

`generateResume` decides what to redo, and the job data stays `{ resumeId }` with no flag. With a non-empty `analyzedRepoIds` and a stored row for every id, the job reuses those rows and calls neither GitHub nor `saveFailedRepoNames`. Otherwise it runs the full flow, which always saves `failedRepoNames`, even an empty list.

Repositories that failed analysis are not analyzed again on retry: their causes (no access, empty or deleted repository) are permanent and unrelated to an outage.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| Field on the resume, decision in `generateResume` (chosen) | One source of truth that the job itself wrote; costs one column and a migration. |
| Look for rows in `analyses` for the selected repositories | No new column, but another resume of the same user may have written some of those rows, so the retry could build a resume from a subset without any warning. |
| The endpoint decides and passes a reuse flag in the job data | Puts the decision in the endpoint, where the flag and the field can disagree. |
| Always run the full flow on retry | Simplest, but repeats the GitHub calls for a failure that happened after the analysis. |

## Consequences

- A job attempt that starts after the analysis was stored reuses it instead of repeating the GitHub analysis, including BullMQ's own retries.
- A reusing job makes no GitHub call, so a retry can finish after the user disconnected GitHub or the app was suspended.
- The rows are the latest analysis of each repository; a later resume of the same repository may have overwritten them, which is still a valid analysis.
- If only `saveFailedRepoNames` fails while the other writes succeed, a later attempt reuses the stored analysis and never writes the failed names, so the page loses its warning. This was accepted as rare.
- There is no retry limit, cooldown or attempt counter, and no frontend control yet. Other failure reasons have no retry flow and get 409.

## References

- `apps/backend/src/services/resume-generation.service.ts`
- `apps/backend/src/services/resume.service.ts`
- `apps/backend/src/services/analysis.service.ts`
- `apps/backend/src/controllers/resume.controller.ts`, `apps/backend/src/routes/resume.router.ts`
- `apps/backend/prisma/schema.prisma`
- [ADR 0003](0003-generate-resume-content-in-a-queue-worker.md)
