# ADR 0001: Use GitHub App Installations for Repository Access

- **Status:** Accepted
- **Date:** 2026-08-19
- **Domain:** `docs/architecture/github-analysis/pipeline/`
- **Related changelog entry:** [../changelog.md](../changelog.md)

---

## Context

Repository analysis needs access that is scoped to repositories a user explicitly installs for TailorCV. The former user OAuth connection persisted user-profile data and a broad access token, which neither represents the selected installation nor supports the GitHub App token lifecycle. Its stateless callback state could be replayed until expiry.

## Decision

Use a GitHub App installation as the durable connection boundary. Persist the installation ID plus a short-lived installation token and its expiration for each Clerk user; do not persist the callback's user authorization token or expose installation credentials through the client API.

Initiate the installation flow with an opaque random state stored in Redis for five minutes and consume it atomically during the callback. Validate that the authorized GitHub user can access the selected installation. Refresh the persisted installation token before protected GitHub operations when it is within five minutes of expiry.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| Persist broad user OAuth tokens | Simpler legacy flow, but grants broader access and does not model selected installations. |
| Use GitHub App installations with renewable tokens | Requires app credentials, token refresh, and reconnection of legacy users, but scopes access to installed repositories. |
| Generate an installation token for every request without persistence | Avoids storing a token, but adds avoidable GitHub API calls and does not provide a defined cached-token lifecycle. |

## Consequences

- Repository access is constrained to the user's GitHub App installation.
- Existing OAuth connection records are deleted by the migration because they cannot be safely converted; affected users reconnect.
- Protected GitHub routes depend on Redis for callback-state validation and GitHub App credentials for token creation.
- The temporary analyze endpoint remains paused; this ADR governs access and token handling, not analyzer orchestration.

## References

- `apps/backend/src/services/github.service.ts`
- `apps/backend/src/controllers/github.controller.ts`
- `apps/backend/src/middleware/github-auth.ts`
- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/20260819000000_simplify_github_connection/migration.sql`
- `docs/architecture/github-analysis/pipeline/changelog.md`