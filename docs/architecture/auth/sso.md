# AUTH SSO

> Google and Apple OAuth start flows, Clerk callback handling, transfer logic, and the `/sso-continue` missing-requirements path.

---

## 1. Core Philosophy

- Treat OAuth as a separate state machine from password auth
- Fail closed on public callback/continuation routes
- Keep OAuth start pages thin and put Clerk orchestration in hooks

---

## 2. Architecture Overview

```
User clicks "Continue with Google/Apple"
  -> signIn.sso() / signUp.sso()
  -> /sso-callback
  -> useSSOCallback()
     -> finalize sign-in
     -> transfer sign-in/sign-up
     -> redirect to /login with auth_reason
     -> redirect to /sso-continue
     -> setActive(existingSession)

/sso-continue
  -> use-sso-continue-flow.ts
  -> clerk.client!.signUp.update()
  -> signUp.finalize()
```

---

## 3. Key Files & Entry Points

| File | Purpose | When to Read |
| ---- | ------- | ------------ |
| `apps/frontend/app/components/auth/sso-callback/use-sso-callback.ts` | Core v7 SSO callback hook — all OAuth finalization logic | Any SSO flow change |
| `apps/frontend/app/sso-callback/page.tsx` | SSO callback page — delegates to `useSSOCallback` | SSO flow changes |
| `apps/frontend/app/(auth)/sso-continue/page.tsx` | Thin SSO continuation route controller that renders the missing-fields form and Clerk captcha mount | Apple/Google missing fields |
| `apps/frontend/app/components/auth/sso-continue/use-sso-continue-flow.ts` | SSO continuation controller hook — invalid-flow guards, prefill, Clerk update, and finalize navigation | Missing-requirements continuation changes |
| `apps/frontend/app/components/auth/sso-continue/sso-continue-form.tsx` | View — first/last name form for missing OAuth fields | UI changes to continue form |
| `apps/frontend/lib/auth/sso-flow.ts` | Tab-scoped SSO flow markers and cleanup helpers | Direct-navigation guard changes |
| `apps/frontend/lib/auth/login-auth-reason.ts` | Fallback reason codes and `/login` notice mapping for incomplete OAuth sign-in | OAuth fallback UX changes |
| `apps/frontend/proxy.ts` | Clerk middleware — public/auth/protected route matchers | Route protection changes |

---

## 4. Data Flow

### 4.1 SSO Sign-In/Sign-Up Flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as Login/Register Page
    participant O as OAuth Provider
    participant CB as /sso-callback
    participant Hook as useSSOCallback
    participant C as /sso-continue

    U->>L: Click "Sign in with Google"
    L->>O: signIn.sso({ redirectCallbackUrl: '/sso-callback', redirectUrl: '/dashboard' })
    O-->>CB: Redirect after OAuth
    CB->>Hook: useSSOCallback()
    alt signIn complete
        Hook->>Hook: signIn.finalize({ navigate: decorateUrl })
    else signUp missing_requirements
        Hook->>C: router.push('/sso-continue')
        U->>C: Submit first/last name
        C->>C: clerk.client!.signUp.update({ firstName, lastName })
        C->>C: signUp.finalize({ navigate: decorateUrl })
    else existingSession
        Hook->>Hook: clerk.setActive({ session, navigate: decorateUrl })
    end
```

---

## 5. Component / Module Structure

```
app/components/auth/
├── sso-callback/
│   └── use-sso-callback.ts
└── sso-continue/
    ├── index.ts
    ├── use-sso-continue-flow.ts
    └── sso-continue-form.tsx
```

---

## 6. Patterns & Conventions

### 6.1 SSO Initiation (Sign-In)

```typescript
await signIn.sso({
  strategy: 'oauth_google',
  redirectCallbackUrl: '/sso-callback',
  redirectUrl: config.auth.afterSignInUrl,
});
```

### 6.2 SSO Initiation (Sign-Up)

```typescript
await signUp.sso({
  strategy: 'oauth_google',
  redirectCallbackUrl: '/sso-callback',
  redirectUrl: config.auth.afterSignUpUrl,
});
```

### 6.3 Updating Sign-Up in missing_requirements State

```typescript
await clerk.client!.signUp.update({ firstName, lastName });
```

- ALWAYS use `clerk.client!.signUp.update()` — NOT `signUp.update()`
- `SignUpFutureResource.update()` hits the wrong endpoint (missing ID in URL → 405)

### 6.4 OAuth Fallback Redirect Context

```typescript
router.push(buildLoginUrl({ reason: 'primary_required' }));
```

- `primary_required`: OAuth is not the account's primary sign-in method here
- `second_factor_required`: Clerk requires a second step after password sign-in
- `reset_password_required`: Clerk requires a password reset before sign-in can complete

---

## 7. Integration Points

| Domain | Relationship | Key Interface |
| ------ | ------------ | ------------- |
| Login | OAuth callback can send users back to `/login` with context | `buildLoginUrl()` |
| Onboarding | OAuth sign-up finalization lands here | `config.auth.afterSignUpUrl` |
| Dashboard | OAuth sign-in finalization lands here | `config.auth.afterSignInUrl` |
| Middleware (`proxy.ts`) | `/sso-continue` is public but still guarded in-app | public route config + hook redirect |

---

## 8. Implementation Status

- [x] Google OAuth sign-in
- [x] Apple OAuth sign-in
- [x] Google OAuth sign-up
- [x] Apple OAuth sign-up
- [x] SSO callback hook
- [x] SSO continuation hook
- [x] Direct-navigation guards for `/sso-callback` and `/sso-continue`

---

## 9. Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| `redirectUrl`/`redirectCallbackUrl` swapped in `sso()` | Keep the param order from the examples above; never swap them |
| `SignUpFutureResource.update()` sends wrong URL (405) | Always use `clerk.client!.signUp.update()` for missing-requirements updates |
| React StrictMode double-execution on SSO callback | `hasRun = useRef(false)` guard in `useSSOCallback` |
| Direct navigation to `/sso-callback` with no active flow | Require a fresh tab-scoped SSO marker from the OAuth start page; otherwise redirect to `/login` |
| Direct navigation to `/sso-continue` with no active flow | Require both the SSO marker and `signUp.verifications.externalAccount.status === 'verified'`; otherwise redirect to `/register` |
| Stale Clerk `signUp` object causes false continuation access | Reject stale `missing_requirements` state unless the current tab has an active SSO marker and Clerk reports a verified external account |

---

## 10. Development Log

### [2026-04-07] - SSO Continue Controller Hook Extraction

- **Decision:** Move the SSO missing-requirements page logic into a dedicated hook and keep the route component limited to rendering the existing continuation form plus Clerk captcha mount.
- **Problem:** `apps/frontend/app/(auth)/sso-continue/page.tsx` still mixed RHF setup, stale/direct-access guard logic, Clerk sign-up updates, finalize navigation, and page rendering, and the only coverage was a source-string check for the captcha div.
- **Solution:**
  1. **`apps/frontend/app/components/auth/sso-continue/use-sso-continue-flow.ts`**: Extracted the continuation controller state, prefill effect, invalid-flow guard, `clerk.client!.signUp.update()` submit handler, and finalize navigation.
  2. **`apps/frontend/app/(auth)/sso-continue/page.tsx` + `apps/frontend/app/components/auth/sso-continue/index.ts`**: Reduced the route to a thin controller that consumes the hook and renders `SSOContinueForm` plus `#clerk-captcha`.
  3. **`apps/frontend/app/(auth)/sso-continue/page.test.tsx` + `apps/frontend/app/components/auth/sso-continue/use-sso-continue-flow.test.tsx`**: Replaced the source-level captcha assertion with direct page-boundary and hook-behavior coverage.
- **Outcome:** The SSO continuation route now follows the same controller/view split as the rest of the auth stack, and its redirect, prefill, Clerk update, and finalize paths have fast regression coverage instead of relying on source inspection alone.

### [2026-04-06] - SSO Page Guards & Stale-State Fix

- **Decision:** Gate OAuth return pages on a short-lived tab-scoped SSO marker plus Clerk's external-account verification state.
- **Problem:** Both pages are public routes. A user with no active OAuth flow could visit them directly, and Clerk's persisted `signUp` object could make a stale `missing_requirements` state look valid.
- **Solution:**
  1. **OAuth entry points**: Added `beginSSOFlow()` before each Google/Apple `sso()` call in login and registration so the browser tab records that an OAuth redirect was intentionally started.
  2. **`use-sso-callback.ts`**: Rejects the callback immediately when no active SSO marker exists, clears the marker on success/fallback exits, and only treats `missing_requirements` as valid when `signUp.verifications.externalAccount.status === 'verified'`.
  3. **`sso-continue/page.tsx`**: Requires the active SSO marker, `missing_requirements`, and a verified external account before rendering the continuation form.
- **Outcome:** Direct navigation to `/sso-callback` and `/sso-continue` now fails closed, and stale persisted Clerk state no longer reopens `/sso-continue` unless the current browser tab just completed a real OAuth redirect.

### [2026-04-06] - Login Redirect Context For OAuth Fallbacks

- **Decision:** Preserve Clerk fallback reasons in the `/login` URL so users see a stable inline explanation when SSO cannot complete sign-in on its own.
- **Problem:** The SSO callback redirected users back to `/login` with no context when Clerk required the primary factor, a second factor, or a password reset, which made the fallback feel like a broken loop.
- **Solution:**
  1. **`apps/frontend/lib/auth/login-auth-reason.ts`**: Added shared login reason codes plus the canonical inline notice copy for each fallback state.
  2. **`apps/frontend/app/components/auth/sso-callback/use-sso-callback.ts`**: Redirects `/login` fallbacks with `auth_reason` query params instead of sending users back to a blank login screen.
  3. **`apps/frontend/app/(auth)/login/page.tsx` + `apps/frontend/app/components/auth/login/login-form-view.tsx`**: Reads the query param and renders a contextual inline banner, including a reset-password action when Clerk requires a password change.
- **Outcome:** OAuth fallback redirects now explain the exact next step on the login page, so users can recover without guessing why SSO stopped.

### [2026-04-04] - Clerk v7 SSO Full Implementation & Bug Fixes

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
