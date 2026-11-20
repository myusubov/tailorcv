# ADR 0003: Generate Resume Content in a Queue Worker

- **Status:** Accepted
- **Date:** 2026-11-20
- **Domain:** docs/architecture/onboarding/
- **Related changelog entry:** [changelog.md](../changelog.md#resume-content-generated-by-a-queue-worker)

---

## Context

Reading up to 3 repositories and asking a model for the resume content takes tens of seconds, longer than the 15-second server-action timeout and longer than an HTTP request should stay open. The resume already exists in `GENERATING` when Analyze returns, and the work must survive a closed browser tab. The project runs on free tiers, so the model call is limited by rate and quota, and a retry costs a model call.

## Decision

Analyze creates the resume, adds a BullMQ job on Redis and returns the resume id. A separate worker process (`npm run dev:worker`, started by `npm run dev:backend`) runs `generateResume`. The job id is the resume id, so the same resume is never queued twice while its job exists. A job has 3 attempts with exponential backoff from 5 seconds.

The failure policy depends on who can fix the problem:

- Failures a retry cannot fix mark the resume `FAILED` and end the job: a missing GitHub connection, a suspended app, no analyzable repository, and any Gemini failure. The Gemini client already retries a failed call 3 times, and a bad reply is requested once more.
- Any other error (database, save) is thrown and retried by BullMQ. Only after the last attempt does the worker mark the resume `FAILED` (`SERVICE_UNAVAILABLE` for a database connection error, `INTERNAL_ERROR` otherwise).
- Every status change uses a conditional update on `GENERATING`, so a late or repeated job cannot overwrite a finished or failed resume.

The model returns a `repoId` for each project; the project name and URL are copied from the analyzed repository, never from the model. The content, `READY` and `onboardingCompletedAt` are written in one transaction.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| BullMQ worker on Redis (chosen) | Survives a closed tab, retries, a stalled job is taken by another worker, and Bull Board shows jobs in development. Adds a process and a Redis dependency to run. |
| Generate inside the analyze request | No new process, but the request outlives the 15-second action timeout and a failure loses the work. |
| Fire and forget in the API process | No queue, but a deploy or crash loses the job silently and nothing retries it. |
| Database-backed job table | One less service, but retries, backoff and stalled-job recovery would be hand-written. |

## Consequences

- Redis must be reachable for Analyze to queue; if it is not, the resume is marked `FAILED` (`SERVICE_UNAVAILABLE`) and the route still returns the id.
- A resume whose worker dies with no other worker left stays `GENERATING`; there is no job timeout or sweeper, and no retry flow for a `FAILED` resume.
- A transient Gemini failure is not retried by BullMQ, so a user sees `FAILED` after the client's own retries are used up.
- Bull Board has no login and is mounted only when `NODE_ENV` is `development`.
- A job retry repeats the GitHub analysis, which is why the Gemini client keeps its own retries short.
- Failure paths were checked by hand; no automated test covers the worker, the save or the failure policy.

## References

- `apps/backend/src/services/resume-generation.service.ts`
- `apps/backend/src/services/resume-ai.service.ts`
- `apps/backend/src/services/resume.service.ts`
- `apps/backend/src/lib/resume-queue.ts`, `apps/backend/src/lib/resume-worker.ts`, `apps/backend/src/lib/queue-config.ts`
- `apps/backend/src/controllers/github.controller.ts`
