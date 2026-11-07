# Onboarding ADRs

Architecture Decision Records for this domain.

Add an ADR only when the decision is durable enough that future contributors should not accidentally reverse it.

- [0001-copy-profile-data-into-each-resume.md](0001-copy-profile-data-into-each-resume.md) - A resume owns copies of the profile's rows; one owner per row, enforced by the database.
- [0002-store-idempotency-key-on-the-created-row.md](0002-store-idempotency-key-on-the-created-row.md) - Duplicate resume creation is stopped by a per-user unique idempotency key stored on the resume, not in Redis.
