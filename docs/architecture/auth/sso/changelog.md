# Auth SSO Changelog

> Chronological implementation history for Auth SSO. Add new entries at the top.

---

## 2026-08-14

### Clerk-Native Login SSO And Callback Failure Handling

- **Decision:** Start login OAuth through Clerk's supported `signIn.sso()` operation while retaining the existing manual `signIn.create()` registration path, and treat callback transfer failures or unresolved sign-up requirements as visible terminal states.
- **Problem:** Login still carried the manual provider-redirect workaround introduced for an earlier SDK behavior, transfer calls ignored returned Clerk errors, and `missing_requirements` could leave the callback spinner active while external verification had not reached `verified`.
- **Solution:**
  1. **Login initiation — `apps/frontend/app/components/auth/login/use-login-flow.ts`**: Uses `signIn.sso({ strategy, redirectCallbackUrl: '/sso-callback', redirectUrl })` for Google and Apple and reports immediate failures through HeroUI toasts.
  2. **Transfer result handling — `apps/frontend/app/components/auth/sso-callback/use-sso-callback.ts`**: Checks the `{ error }` returned by both sign-up-to-sign-in and sign-in-to-sign-up transfers before continuing.
  3. **Terminal missing requirements — `use-sso-callback.ts` and `apps/frontend/app/sso-callback/page.tsx`**: Converts every remaining `missing_requirements` state into the callback page's existing error UI instead of waiting indefinitely for a verification-status gate.
  4. **Focused regression contracts — login and SSO callback hook tests**: Updates login initiation expectations and adds returned-transfer-error plus unverified missing-requirements cases.
- **Outcome:** Login delegates provider navigation to Clerk, and the callback leaves its spinner for transfer or configuration failures. Registration still uses its separate manual OAuth start path, and no auth test or provider flow was executed during documentation reconciliation.

## 2026-04-21

### Manual OAuth Start Avoids Abandoned Provider Resume

- **Decision:** Start both login and register social auth through `signIn.create()` and manually navigate to Clerk's external provider redirect URL.
- **Problem:** After a user cancelled an OAuth provider by navigating back, Clerk could auto-resume the abandoned provider on the next social-button click. `signIn.sso()`, `signUp.sso()`, resource reset, client reset, cache clear, and short delays did not reliably create a fresh provider attempt; manual testing showed `signIn.create()` did.
- **Solution:**
  1. **`apps/frontend/app/components/auth/login/use-login-flow.ts`**: Replaced social `signIn.sso()` starts with `signIn.create({ strategy, redirectUrl: '/sso-callback', actionCompleteRedirectUrl: config.auth.afterSignInUrl })`, then navigates to `signIn.firstFactorVerification.externalVerificationRedirectURL`.
  2. **`apps/frontend/app/components/auth/register/use-register-flow.ts`**: Routes Google and Apple register buttons through the same sign-in OAuth start path, using `config.auth.afterSignUpUrl` as the action-complete URL so `/sso-callback` can transfer unknown users into sign-up.
  3. **`apps/frontend/app/components/auth/login/use-login-flow.test.tsx` + `apps/frontend/app/components/auth/register/use-register-flow.test.tsx`**: Updated OAuth tests to assert fresh `signIn.create()` attempts and provider redirects instead of `sso()` calls.
- **Outcome:** Provider-back cancellation no longer leaks the abandoned provider into the next Google/Apple click on login or register; social registration relies on the existing callback transfer path for new users.

## 2026-04-21

### Clear Stale OAuth Errors Before Retry

- **Decision:** Clear the visible inline auth error before every Google or Apple OAuth start.
- **Problem:** If an OAuth attempt failed and the user retried or switched providers, the previous `globalError` could remain visible during a fresh SSO attempt, making the UI look like the new provider flow had already failed.
- **Solution:**
  1. **`apps/frontend/app/components/auth/login/use-login-flow.ts`**: Clears `globalError` before setting provider loading state and resetting the Clerk sign-in resource.
  2. **`apps/frontend/app/components/auth/register/use-register-flow.ts`**: Clears `globalError` before both Google and Apple sign-up SSO starts.
  3. **`apps/frontend/app/components/auth/login/use-login-flow.test.tsx` + `apps/frontend/app/components/auth/register/use-register-flow.test.tsx`**: Added stale-error retry coverage and invocation-order assertions proving Clerk resource reset runs before each `sso()` call.
- **Outcome:** OAuth retries and provider switches now start with a clean inline-error state while still guarding against stale Clerk provider attempts.

## 2026-04-20

### Defer Missing Requirements Until External Verification

- **Decision:** Only surface OAuth `missing_requirements` configuration drift after Clerk reports the external account as verified.
- **Problem:** During sign-in to sign-up transfer, Clerk can temporarily report `signUp.status === 'missing_requirements'` while `signUp.verifications.externalAccount.status` is still pending. Showing the missing-fields error at that point incorrectly interrupts a valid OAuth verification.
- **Solution:**
  1. **`apps/frontend/app/components/auth/sso-callback/use-sso-callback.ts`**: Mirrored the later Case 6 gate in the transfer branch so `showMissingRequirementsError()` only runs when `externalAccount.status === 'verified'`.
  2. **`apps/frontend/app/components/auth/sso-callback/use-sso-callback.test.tsx`**: Added coverage that transfers a sign-in to sign-up with an unverified external account and confirms the callback does not show the configuration-drift error or redirect.
- **Outcome:** OAuth transfers now wait for Clerk's external-account verification state before deciding that remaining missing requirements are app configuration drift.

## 2026-04-20

### Reset OAuth Resource Before Provider Redirect

- **Decision:** Reset the active Clerk sign-in/sign-up resource before each Google or Apple SSO start.
- **Problem:** If a user cancelled one OAuth provider and then clicked the other provider, Clerk could reuse the stale provider attempt from the cancelled flow, sending Apple clicks to Google or Google clicks to Apple until browser storage was cleared.
- **Solution:**
  1. **`apps/frontend/lib/auth/reset-clerk-auth-resource.ts`**: Added a typed helper for Clerk's runtime `reset()` method, which is exposed on the resource proxy but not present in the installed future-resource typings.
  2. **`apps/frontend/app/components/auth/login/use-login-flow.ts`**: Reset the `signIn` resource immediately before `signIn.sso()`.
  3. **`apps/frontend/app/components/auth/register/use-register-flow.ts`**: Reset the `signUp` resource immediately before each social sign-up `signUp.sso()` call.
  4. **`apps/frontend/app/components/auth/login/use-login-flow.test.tsx` + `apps/frontend/app/components/auth/register/use-register-flow.test.tsx`**: Added provider-switching regressions that click Google then Apple and assert the requested provider is used after each reset.
- **Outcome:** Cancelled OAuth attempts no longer leak provider choice into the next social-login click.

## 2026-04-20

### Account Name Removal And SSO Continue Retirement

- **Decision:** Stop collecting account first/last name in auth flows and retire the SSO continuation form.
- **Problem:** OAuth from `/login` can legitimately become sign-up when Clerk reports a transferable sign-in, but requiring profile names forced unknown users into `/sso-continue`; refreshing that page could leave stale local SSO marker state and send users back into registration with confusing Clerk state.
- **Solution:**
  1. **`apps/frontend/app/components/auth/register/*` + `apps/frontend/lib/schemas/auth.ts`**: Removed first/last-name fields from registration validation, UI, and the Clerk password sign-up payload.
  2. **`apps/frontend/app/components/auth/sso-callback/use-sso-callback.ts`**: Removed tab-scoped SSO marker checks and finalized transferable OAuth sign-ups directly when Clerk reports completion.
  3. **`apps/frontend/app/(auth)/sso-continue/page.tsx`**: Replaced the name-collection continuation page with a defensive redirect to `/register`.
  4. **`apps/backend/src/utils/clerk.ts`**: Stopped writing Clerk profile names into app users while leaving nullable database columns available for future reintroduction.
- **Outcome:** OAuth sign-in/sign-up no longer depends on account profile names or sessionStorage intent markers; Clerk dashboard first/last-name requirements must remain optional or disabled.

## 2026-04-07

### SSO Continue Controller Hook Extraction

- **Decision:** Move the SSO missing-requirements page logic into a dedicated hook and keep the route component limited to rendering the existing continuation form plus Clerk captcha mount.
- **Problem:** `apps/frontend/app/(auth)/sso-continue/page.tsx` still mixed RHF setup, stale/direct-access guard logic, Clerk sign-up updates, finalize navigation, and page rendering, and the only coverage was a source-string check for the captcha div.
- **Solution:**
  1. **`apps/frontend/app/components/auth/sso-continue/use-sso-continue-flow.ts`**: Extracted the continuation controller state, prefill effect, invalid-flow guard, `clerk.client!.signUp.update()` submit handler, and finalize navigation.
  2. **`apps/frontend/app/(auth)/sso-continue/page.tsx` + `apps/frontend/app/components/auth/sso-continue/index.ts`**: Reduced the route to a thin controller that consumes the hook and renders `SSOContinueForm` plus `#clerk-captcha`.
  3. **`apps/frontend/app/(auth)/sso-continue/page.test.tsx` + `apps/frontend/app/components/auth/sso-continue/use-sso-continue-flow.test.tsx`**: Replaced the source-level captcha assertion with direct page-boundary and hook-behavior coverage.
- **Outcome:** The SSO continuation route now follows the same controller/view split as the rest of the auth stack, and its redirect, prefill, Clerk update, and finalize paths have fast regression coverage instead of relying on source inspection alone.

## 2026-04-06

### SSO Page Guards & Stale-State Fix

- **Decision:** Gate OAuth return pages on a short-lived tab-scoped SSO marker plus Clerk's external-account verification state.
- **Problem:** Both pages are public routes. A user with no active OAuth flow could visit them directly, and Clerk's persisted `signUp` object could make a stale `missing_requirements` state look valid.
- **Solution:**
  1. **OAuth entry points**: Added `beginSSOFlow()` before each Google/Apple `sso()` call in login and registration so the browser tab records that an OAuth redirect was intentionally started.
  2. **`use-sso-callback.ts`**: Rejects the callback immediately when no active SSO marker exists, clears the marker on success/fallback exits, and only treats `missing_requirements` as valid when `signUp.verifications.externalAccount.status === 'verified'`.
  3. **`sso-continue/page.tsx`**: Requires the active SSO marker, `missing_requirements`, and a verified external account before rendering the continuation form.
- **Outcome:** Direct navigation to `/sso-callback` and `/sso-continue` now fails closed, and stale persisted Clerk state no longer reopens `/sso-continue` unless the current browser tab just completed a real OAuth redirect.

## 2026-04-06

### Login Redirect Context For OAuth Fallbacks

- **Decision:** Preserve Clerk fallback reasons in the `/login` URL so users see a stable inline explanation when SSO cannot complete sign-in on its own.
- **Problem:** The SSO callback redirected users back to `/login` with no context when Clerk required the primary factor, a second factor, or a password reset, which made the fallback feel like a broken loop.
- **Solution:**
  1. **`apps/frontend/lib/auth/login-auth-reason.ts`**: Added shared login reason codes plus the canonical inline notice copy for each fallback state.
  2. **`apps/frontend/app/components/auth/sso-callback/use-sso-callback.ts`**: Redirects `/login` fallbacks with `auth_reason` query params instead of sending users back to a blank login screen.
  3. **`apps/frontend/app/(auth)/login/page.tsx` + `apps/frontend/app/components/auth/login/login-form-view.tsx`**: Reads the query param and renders a contextual inline banner, including a reset-password action when Clerk requires a password change.
- **Outcome:** OAuth fallback redirects now explain the exact next step on the login page, so users can recover without guessing why SSO stopped.

## 2026-04-04

### Clerk v7 SSO Full Implementation & Bug Fixes

- **Decision:** Implement complete Clerk v7 custom SSO flow replacing deprecated v6 `AuthenticateWithRedirectCallback` approach.
- **Problem:** Google/Apple sign-in and sign-up were broken. `redirectUrl`/`redirectCallbackUrl` were swapped in all 4 SSO call sites, no SSO callback logic existed (only deprecated component), and no `/sso-continue` page existed for handling missing OAuth fields. Additionally, `SignUpFutureResource.update()` was found to construct incorrect API URLs (missing sign_up ID → 405).
- **Solution:**
  1. **Swapped params in `login/page.tsx`**: `redirectCallbackUrl: '/sso-callback'`, `redirectUrl: config.auth.afterSignInUrl`.
  2. **Swapped params in `register-form.tsx`**: same correction for sign-up.
  3. **Created `use-sso-callback.ts`**: Custom hook with full v7 logic — handles complete, transferable, missing_requirements, existingSession, and error states.
  4. **Replaced `sso-callback/page.tsx`**: Removed `AuthenticateWithRedirectCallback`, now delegates to `useSSOCallback`.
  5. **Created `sso-continue/page.tsx`**: Controller using `clerk.client!.signUp.update()` (not `signUp.update()`) + `signUp.finalize()` with `decorateUrl`.
  6. **Created `sso-continue-form.tsx` + `index.ts`**: View component for first/last name form.
  7. **Added `ssoContinueSchema`** to `lib/schemas/auth.ts`.
  8. **Added `/sso-continue(.*)` to public routes** in `proxy.ts`.
  9. **Added `decorateUrl`** to all `finalize()` and `setActive()` navigate callbacks.
  10. **Added `signUp.status === 'missing_requirements'` branch** in `useSSOCallback` — was missing, caused infinite hang on `/sso-callback`.
- **Outcome:** Google and Apple sign-in/sign-up work end-to-end. Missing-fields case correctly lands on `/sso-continue`, collects the data, and completes registration.
