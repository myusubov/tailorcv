# ADR 0002: Store the Idempotency Key on the Created Row

- **Status:** Accepted
- **Date:** 2026-11-07
- **Domain:** docs/architecture/onboarding/
- **Related changelog entry:** [changelog.md](../changelog.md#idempotency-key-stops-duplicate-resumes)

---

## Context

A server action stops waiting after 15 seconds but the backend keeps working, so a retry after a timeout, or a double submit, created a second resume. Users will also create several resumes in parallel (for example one per job description), so "one resume being generated per user" is not an acceptable rule. The repository already has a Redis `idempotency()` middleware, which no route uses.

## Decision

The browser makes a UUID per attempt and sends it as `idempotencyKey`. `Resume.idempotencyKey` is nullable and unique together with `userId`. `createResume` looks the key up and returns that resume's id; otherwise it inserts the resume with the key. If the insert fails with `P2002`, a request with the same key won the race, and the service looks the key up again and returns that id. Any other error is rethrown.

The same selection of repositories reuses its key on retry; a different selection gets a new key.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| Key column on the created row (chosen) | The key and the resume id are written in one insert, and the unique constraint decides concurrent requests. Each endpoint that creates a row needs its own column. |
| Existing Redis `idempotency()` middleware | The key is claimed first and the row written afterwards, so a crash in between leaves `processing` for up to 24 hours (409 for retries, no resume). A Redis restart or failover can lose the key, it lets requests through when Redis errors, and it never stores the resume id to return on a replay. |
| Shared `idempotency_keys` table | Reusable for endpoints with no single created row, but the key lives apart from the row it protects. Not needed until another endpoint requires it. |
| One resume in `GENERATING` per user | Simple, but blocks parallel resumes. |

## Consequences

- Another endpoint that creates a row needs its own key column and unique constraint, or the shared table above.
- A replay with the same key and different repository ids returns the first resume; the client avoids this by changing the key when the selection changes. The server does not compare them.
- A key lives as long as its resume; there is no expiry.
- Rows created before the change have a null key. PostgreSQL does not treat nulls as equal in a unique index, so they never conflict.
- The `P2002` branch and the replay path have no test.

## References

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/20261107090000_add_resume_idempotency_key/migration.sql`
- `apps/backend/src/services/resume.service.ts`
- `apps/frontend/app/components/onboarding/github/github-step.tsx`
- Brandur Leach, [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys)
