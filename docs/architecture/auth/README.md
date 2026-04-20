# AUTH: Authentication & SSO Flow

> Hub doc for TailorCV's Clerk v7 custom auth system. Start here, then jump to the focused sub-doc that matches the change you are making.

---

## 1. Core Philosophy

### 1.1 Design Pillars

| Pillar | Description |
| ------ | ----------- |
| **No prebuilt Clerk UI** | All auth flows are custom — no `<SignIn />` or `<SignUp />` components. Full control over UX. |
| **Controller/View split** | Route files stay thin, flow hooks own Clerk orchestration, and view files are render-only. |
| **v7 Future Resource API** | Uses `SignInFutureResource` / `SignUpFutureResource` from `useSignIn()` / `useSignUp()` — not the legacy v6 resource types. |
| **`decorateUrl` everywhere** | All `finalize()` and `setActive()` calls use the `navigate` callback with `decorateUrl` for Safari ITP cookie refresh. |

### 1.2 Key Decisions

- **`redirectCallbackUrl` vs `redirectUrl`**: `redirectCallbackUrl` = intermediate callback page (`/sso-callback`). `redirectUrl` = final destination after session is created. These are easy to swap — don't.
- **`signUp.finalize()` not `setActive()`**: Post-completion navigation uses `finalize()`. `setActive()` is only for the `existingSession` edge case.
- **`hasRun` ref**: Prevents double-execution in React StrictMode on the SSO callback hook.
- **`auth_reason` login redirects**: When OAuth cannot finish sign-in because Clerk requires the primary factor, a second factor, or a password reset, redirect to `/login` with a reason code so the login page can explain the next step inline.
- **No account profile names**: TailorCV auth flows do not collect or submit account first/last name. If Clerk reports `missing_requirements` for names, treat it as dashboard configuration drift.

---

## 2. Architecture Overview

### 2.1 Read Order

1. [flows.md](flows.md) for login, register, and forgot-password behavior
2. [sso.md](sso.md) for OAuth callback and retired `/sso-continue` guard behavior
3. [testing.md](testing.md) for Playwright, Gmail IMAP, and real-auth setup

### 2.2 High-Level Map

```
Email/password login            -> flows.md
Email/password sign-up          -> flows.md
Forgot-password                 -> flows.md + testing.md
Google/Apple OAuth              -> sso.md
SSO callback / retired guard    -> sso.md
Auth smoke / real auth testing  -> testing.md
```

---

## 3. Key Files & Entry Points

| File | Purpose | When to Read |
| ---- | ------- | ------------ |
| `docs/architecture/auth/flows.md` | Main doc for login, register, forgot-password, and shared auth-controller patterns | Any non-SSO auth UI or flow change |
| `docs/architecture/auth/sso.md` | Main doc for OAuth start/callback/continuation behavior | Any Google/Apple auth or SSO routing change |
| `docs/architecture/auth/testing.md` | Main doc for auth browser automation, Gmail polling, and test env setup | Any auth test or E2E change |

---

## 4. Data Flow

### 4.1 Domain Split

- `flows.md`: email/password sign-in, sign-up verification, forgot-password, Client Trust
- `sso.md`: OAuth start, callback, transfer handling, retired `/sso-continue`
- `testing.md`: auth smoke, real forgot-password E2E, helper topology

---

## 5. Component / Module Structure

```
docs/architecture/
├── README.md                  # Global architecture index
└── auth/
    ├── README.md              # This hub doc
    ├── flows.md               # Login / register / forgot-password
    ├── sso.md                 # OAuth callback / continuation
    └── testing.md             # Auth smoke / real auth / Gmail helpers
```

---

## 6. Patterns & Conventions

### 6.1 Documentation Pattern

- Keep reusable auth flow/controller patterns in `flows.md`
- Keep OAuth-specific state machines in `sso.md`
- Keep test harnesses, env requirements, and inbox helpers in `testing.md`
- When a change spans multiple auth sub-systems, update all affected sub-docs and cross-link them here

---

## 7. Integration Points

| Domain | Relationship | Key Interface |
| ------ | ------------ | ------------- |
| Middleware (`proxy.ts`) | Auth determines public/protected route access | `isPublicRoute`, `isAuthRoute`, `isProtectedRoute` matchers |
| Onboarding | After sign-up, user is sent to onboarding | `config.auth.afterSignUpUrl` |
| Dashboard | After sign-in, user is sent to dashboard | `config.auth.afterSignInUrl` |
| Frontend E2E | Playwright exercises auth pages and route guards in a real browser | `apps/frontend/playwright.config.ts`, `apps/frontend/e2e/` |

---

## 8. Implementation Status

### Phase 1: Core Auth (Complete)

- [x] Email/password sign-in (`/login`)
- [x] Email/password sign-up with OTP verification (`/register`)
- [x] Forgot password flow
- [x] Google OAuth sign-in
- [x] Apple OAuth sign-in
- [x] Google OAuth sign-up
- [x] Apple OAuth sign-up
- [x] SSO callback (v7 custom hook — `useSSOCallback`)
- [x] Retired SSO continue route redirects to `/register`
- [x] `decorateUrl` in all `finalize()` and `setActive()` calls
- [x] Public/protected route middleware (`proxy.ts`)

### Phase 2: Hardening (Pending)

- [ ] Terms of Service acceptance enforced for SSO sign-up (currently bypassed — handle via Clerk dashboard "Legal acceptance" or onboarding)
- [ ] Phone number collection if required by instance settings
- [ ] Clerk first/last-name settings remain optional or disabled

---

## 9. Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Auth guidance grows too large to retrieve reliably | Keep flows, SSO, and testing in separate sub-docs with a stable hub |
| OAuth behavior and password flows drift apart in docs | Link all auth entry points back to this hub and update cross-doc references together |
| Test helper history overwhelms implementation guidance | Keep test setup and E2E history isolated in `testing.md` |

---

## 10. Development Log

### [2026-04-07] - Auth Doc Split

- **Decision:** Split the oversized auth domain doc into a hub plus focused sub-docs for flows, SSO, and testing.
- **Problem:** `docs/architecture/AUTH.md` had grown to nearly 600 lines and mixed three distinct auth sub-systems, which reduced retrieval quality for both humans and AI and crossed the project's split threshold.
- **Solution:**
  1. **`docs/architecture/auth/README.md`**: Created a hub doc that keeps the high-level auth philosophy, status, and navigation.
  2. **`docs/architecture/auth/flows.md` + `docs/architecture/auth/sso.md` + `docs/architecture/auth/testing.md`**: Moved implementation details into focused sub-docs by concern.
  3. **`docs/architecture/README.md`**: Updated the architecture index so the new auth hub is the single entry point.
- **Outcome:** Auth documentation is now split by concern, below the effective retrieval threshold per file, and easier to update without mixing unrelated flow, SSO, and testing detail.
