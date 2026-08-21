# GitHub Analysis Pipeline Changelog

> Chronological implementation history for GitHub Analysis Pipeline. Add new entries at the top.

---

Historical pipeline entries currently live in the parent GitHub Analysis changelog: [../changelog.md](../changelog.md).

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
