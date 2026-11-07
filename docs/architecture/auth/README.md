# AUTH: Authentication & SSO Flow

> Hub doc for TailorCV's Clerk v7 custom auth system. Start here, then jump to the focused sub-doc that matches the change you are making.

---

## 1. Core Philosophy

### 1.1 Design Pillars

| Pillar                       | Description                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **No prebuilt Clerk UI**     | All auth flows are custom — no `<SignIn />` or `<SignUp />` components. Full control over UX.                               |
| **Controller/View split**    | Route files stay thin, flow hooks own Clerk orchestration, and view files are render-only.                                  |
| **v7 Future Resource API**   | Uses `SignInFutureResource` / `SignUpFutureResource` from `useSignIn()` / `useSignUp()` — not the legacy v6 resource types. |
| **`decorateUrl` everywhere** | All `finalize()` and `setActive()` calls use the `navigate` callback with `decorateUrl` for Safari ITP cookie refresh.      |

### 1.2 Key Decisions

- **`redirectCallbackUrl` vs `redirectUrl`**: `redirectCallbackUrl` = intermediate callback page (`/sso-callback`). `redirectUrl` = final destination after session is created. These are easy to swap — don't.
- **`signUp.finalize()` not `setActive()`**: Post-completion navigation uses `finalize()`. `setActive()` is only for the `existingSession` edge case.
- **`hasRun` ref**: Prevents double-execution in React StrictMode on the SSO callback hook.
- **`auth_reason` login redirects**: When OAuth cannot finish sign-in because Clerk requires the primary factor, a second factor, or a password reset, redirect to `/login` with a reason code so the login page can explain the next step inline. The `session_expired` reason is used by the global 401 handler.
- **Route access lives in server layouts, not `proxy.ts`**: `proxy.ts` has no route matchers. Layouts call the guards in `lib/auth/guards.ts`: `(auth)/layout.tsx` runs `redirectIfSignedIn` and `onboarding/layout.tsx` runs `requireNotOnboardedUser`.
- **One place handles an expired session**: `QueryProvider` gives the `QueryCache` and `MutationCache` an `onError` that sends any `UNAUTHORIZED` error to `/login?auth_reason=session_expired` with a full page load, once per load. Individual calls do not handle it.
- **No account profile names**: TailorCV auth flows do not collect or submit account first/last name. If Clerk reports `missing_requirements` for names, treat it as dashboard configuration drift.
- **Factor-specific social entry**: Login uses `signIn.sso()` and registration uses `signUp.sso()` directly; `/sso-callback` owns transfers between the two resources. `signUp.reset()` is reserved for an explicit registration restart, such as changing the email during verification.

---

## 2. Architecture Overview

### 2.1 Read Order

1. [flows/README.md](flows/README.md) for login, register, and forgot-password behavior
2. [sso/README.md](sso/README.md) for OAuth callback and retired `/sso-continue` guard behavior
3. [testing/README.md](testing/README.md) for Playwright, Gmail IMAP, and real-auth setup

### 2.2 High-Level Map

```
Email/password login            -> flows/README.md
Email/password sign-up          -> flows/README.md
Forgot-password                 -> flows/README.md + testing/README.md
Google/Apple OAuth              -> sso/README.md
SSO callback / retired guard    -> sso/README.md
Auth smoke / real auth testing  -> testing/README.md
```

---

## 3. Key Files & Entry Points

| File                                       | Purpose                                                                            | When to Read                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------- |
| `docs/architecture/auth/flows/README.md`   | Main doc for login, register, forgot-password, and shared auth-controller patterns | Any non-SSO auth UI or flow change          |
| `docs/architecture/auth/sso/README.md`     | Main doc for OAuth start/callback/continuation behavior                            | Any Google/Apple auth or SSO routing change |
| `docs/architecture/auth/testing/README.md` | Main doc for auth browser automation, Gmail polling, and test env setup            | Any auth test or E2E change                 |
| `apps/frontend/lib/auth/guards.ts`         | Server guards: `requireUser`, `requireNotOnboardedUser`, `requireOnboardedUser`, `redirectIfSignedIn` | Route access or redirect changes            |
| `apps/frontend/app/providers/query-provider.tsx` | Global `UNAUTHORIZED` handler that redirects to sign-in with the `session_expired` notice | Expired-session behavior changes            |

---

## 4. Data Flow

### 4.1 Domain Split

- `flows/README.md`: email/password sign-in, sign-up verification, forgot-password, Client Trust
- `sso/README.md`: OAuth start, callback, transfer handling, retired `/sso-continue`
- `testing/README.md`: auth smoke, real forgot-password E2E, helper topology

---

## 5. Component / Module Structure

```
docs/architecture/
├── README.md                  # Global architecture index
└── auth/
    ├── README.md              # This hub doc
    ├── changelog.md           # Auth hub history
    ├── adr/                   # Durable auth architecture decisions
    ├── flows/                 # Login / register / forgot-password
    │   ├── README.md
    │   ├── changelog.md
    │   └── adr/
    ├── sso/                   # OAuth callback / continuation
    │   ├── README.md
    │   ├── changelog.md
    │   └── adr/
    └── testing/               # Auth smoke / real auth / Gmail helpers
        ├── README.md
        ├── changelog.md
        └── adr/
```

---

## 6. Patterns & Conventions

### 6.1 Documentation Pattern

- Keep reusable auth flow/controller patterns in `flows/README.md`
- Keep OAuth-specific state machines in `sso/README.md`
- Keep test harnesses, env requirements, and inbox helpers in `testing/README.md`
- When a change spans multiple auth sub-systems, update all affected sub-docs and cross-link them here

---

## 7. Integration Points

| Domain                  | Relationship                                                       | Key Interface                                               |
| ----------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Middleware (`proxy.ts`) | Only sends a signed-in user on `/` to `/resumes`; it protects no route | `ROUTES.RESUMES`                                            |
| Server layouts          | Decide who may see the auth pages and onboarding                   | `redirectIfSignedIn`, `requireNotOnboardedUser`             |
| Onboarding              | After sign-up, user is sent to onboarding                          | `config.auth.afterSignUpUrl`                                |
| Dashboard               | After sign-in, user is sent to dashboard                           | `config.auth.afterSignInUrl`                                |
| Frontend E2E            | Playwright exercises auth pages and route guards in a real browser | `apps/frontend/playwright.config.ts`, `apps/frontend/e2e/`  |

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
- [x] Route access moved from `proxy.ts` matchers to server layout guards (2026-11-06)
- [x] Global expired-session redirect with a login notice (2026-11-06; the redirect and the notice were not exercised together, and a signed-in user is bounced away from `/login`)

### Phase 2: Hardening (Pending)

- [ ] Guard the other routes: `requireOnboardedUser` has no caller, and `app/test/page.tsx` and any future `/resumes` page have no guard since the matchers were removed

- [ ] Terms of Service acceptance enforced for SSO sign-up (currently bypassed — handle via Clerk dashboard "Legal acceptance" or onboarding)
- [ ] Phone number collection if required by instance settings
- [ ] Clerk first/last-name settings remain optional or disabled

---

## 9. Risks & Mitigations

| Risk                                                   | Mitigation                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Auth guidance grows too large to retrieve reliably     | Keep flows, SSO, and testing in separate sub-docs with a stable hub                  |
| OAuth behavior and password flows drift apart in docs  | Link all auth entry points back to this hub and update cross-doc references together |
| Test helper history overwhelms implementation guidance | Keep test setup and E2E history isolated in `testing/README.md`                      |

---

## 10. History & Decisions

- **Changelog:** [changelog.md](changelog.md)
- **Architecture decisions:** [adr/](adr/)
