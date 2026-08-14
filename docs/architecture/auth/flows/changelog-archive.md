# Auth Flows Changelog Archive

> Archived implementation history for Auth Flows. Entries remain newest-first.

---

## 2026-04-07

### Clerk v7 Auth Parity Audit And Smoke Coverage

- **Decision:** Align the custom auth controllers with Clerk v7's documented state machine instead of relying on implicit status handling, and lock the public-route guard behavior down with smoke coverage.
- **Problem:** The login flow still finalized without `decorateUrl`, treated Client Trust as a generic second-factor email flow, the forgot-password flow assumed every successful password submission could finalize immediately, `/sso-continue` was missing Clerk's required captcha mount, and middleware redirected authenticated auth-route visits to a stale `/test` path.
- **Solution:**
  1. **`apps/frontend/lib/auth/clerk-flow.ts` + `apps/frontend/lib/auth/clerk-flow.test.ts`**: Added focused Clerk-status decision helpers and regression tests for login and forgot-password state handling.
  2. **`apps/frontend/app/(auth)/login/page.tsx`**: Switched successful sign-in completion to `finalize({ navigate })`, split `needs_client_trust` from `needs_second_factor`, and moved trusted-device verification to `signIn.mfa.sendEmailCode()` / `signIn.mfa.verifyEmailCode()`.
  3. **`apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`**: Added explicit post-password handling for `complete`, `needs_second_factor`, and unexpected statuses instead of always finalizing.
  4. **`apps/frontend/app/components/auth/register/register-form.tsx` + `apps/frontend/app/components/auth/registration-verification.tsx`**: Tightened sign-up and email-verification error handling so unexpected Clerk statuses surface explicitly instead of stalling silently.
- **Outcome:** The custom auth stack now matches Clerk v7's documented login and recovery states more closely, trusted-device verification uses the correct API surface, and auth redirects are consistent with the configured post-sign-in destination.

## 2026-04-06

### Forgot-Password State Alignment

- **Decision:** Model forgot-password as a staged Clerk sign-in flow that verifies the reset code before accepting a new password.
- **Problem:** The reset page submitted `verifyCode()` and `submitPassword()` in the same handler, which left the flow in `needs_first_factor` and blocked users from completing password resets reliably.
- **Solution:**
  1. **`apps/frontend/app/(auth)/forgot-password/page.tsx`**: Split the controller into `email`, `verify-code`, and `set-password` phases and handled Clerk statuses explicitly.
  2. **`apps/frontend/app/components/auth/forgot-password/reset-password-view.tsx`**: Converted the reset screen into a staged single-screen UI that only reveals password fields after Clerk returns `needs_new_password`.
  3. **`docs/architecture/auth/flows/README.md`**: Documented the forgot-password state progression and required handler split for future auth work.
- **Outcome:** The reset flow now follows Clerk's documented state machine, invalid codes stay in the verification step, and successful resets finalize with the same redirect behavior as the rest of the auth system.
