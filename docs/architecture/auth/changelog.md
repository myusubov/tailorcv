# Auth Changelog

> Chronological implementation history for Auth. Add new entries at the top.

---

## 2026-11-06

### Route Access Moves From Middleware to Server Layouts

- **Problem:** `proxy.ts` held public, auth and protected route matchers and, for every protected request, fetched the onboarding status from a Next route and redirected by whether a base resume existed.
- **Solution:**
  1. **Middleware — `apps/frontend/proxy.ts`**: Removed the matchers, the `redirect_url` login redirect and the status fetch. It now only redirects a signed-in user on `/` to `ROUTES.RESUMES`. The export became `config`, with the same matcher string.
  2. **Guards — `apps/frontend/lib/auth/guards.ts`**: `requireUser` (`auth.protect()`), `requireNotOnboardedUser`, `requireOnboardedUser` and `redirectIfSignedIn`.
  3. **Layouts — `apps/frontend/app/(auth)/layout.tsx`, `apps/frontend/app/onboarding/layout.tsx`**: The auth layout runs `redirectIfSignedIn`; the onboarding layout runs `requireNotOnboardedUser`.
  4. **Routes — `apps/frontend/lib/config/constants.ts`**: `ROUTES` holds the onboarding and resumes paths used by the guards and the middleware.
- **Outcome:** Only the auth pages and onboarding have an access check. `requireOnboardedUser` has no caller, and `/test` is unguarded. The owner's reason for removing the middleware matchers is not recorded, so no ADR was written. `guards.test.ts` covers the guards; it was not run.

### Global Expired-Session Redirect

- **Problem:** A 401 from any query or server action left the user on a page whose calls all fail, with a toast that disappears.
- **Solution:**
  1. **Handler — `apps/frontend/app/providers/query-provider.tsx`**: `QueryCache` and `MutationCache` `onError` send an error with code `UNAUTHORIZED` to `buildLoginUrl({ reason: 'session_expired' })` through `window.location.href`. A module-level flag stops repeat redirects; the full page load resets it.
  2. **Notice — `apps/frontend/lib/auth/login-auth-reason.ts`**: Added the `session_expired` reason: "Your session expired".
  3. **Caller — `apps/frontend/app/components/onboarding/github/github-step.tsx`**: Skips its toast for `UNAUTHORIZED`.
- **Outcome:** An `UNAUTHORIZED` result from a query or an action redirects to `/login` once. With the fake backend 401 used while testing, the user was still signed in with Clerk, so `(auth)/layout.tsx` sent them on to `/resumes` and the notice was not seen. The real backend 401 body for a rejected Clerk token is not confirmed to carry the code `UNAUTHORIZED`. No test covers the handler.

---

## 2026-04-07

### Auth Doc Split

- **Decision:** Split the oversized auth domain doc into a hub plus focused sub-docs for flows, SSO, and testing.
- **Problem:** `docs/architecture/AUTH.md` had grown to nearly 600 lines and mixed three distinct auth sub-systems, which reduced retrieval quality for both humans and AI and crossed the project's split threshold.
- **Solution:**
  1. **`docs/architecture/auth/README.md`**: Created a hub doc that keeps the high-level auth philosophy, status, and navigation.
  2. **`docs/architecture/auth/flows/README.md` + `docs/architecture/auth/sso/README.md` + `docs/architecture/auth/testing/README.md`**: Moved implementation details into focused sub-docs by concern.
  3. **`docs/architecture/README.md`**: Updated the architecture index so the new auth hub is the single entry point.
- **Outcome:** Auth documentation is now split by concern, below the effective retrieval threshold per file, and easier to update without mixing unrelated flow, SSO, and testing detail.
