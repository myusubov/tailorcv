# AUTH Testing

> Auth smoke coverage, real Clerk login and forgot-password E2E, Gmail/IMAP helpers, and test environment setup.

---

## 1. Core Philosophy

- Fast auth regressions should be caught by colocated Vitest coverage
- Browser-level route and page-health checks live in auth smoke
- Real Clerk password-reset coverage is separate because it still mutates a shared test account

---

## 2. Architecture Overview

```
Fast coverage
  -> hook/controller Vitest tests
  -> clerk-flow.test.ts
  -> helper unit tests

Browser smoke
  -> apps/frontend/e2e/auth-smoke.spec.ts

Real Clerk reset coverage
  -> dedicated login Clerk user
  -> shared Clerk reset user
  -> unique Clerk sign-up test email per run
  -> serial real-auth execution
  -> apps/frontend/e2e/login.real.spec.ts
  -> apps/frontend/e2e/forgot-password.real.spec.ts
  -> apps/frontend/e2e/forgot-password-policy.real.spec.ts
  -> apps/frontend/e2e/signup.real.spec.ts
  -> Clerk test-email OTP
  -> password rotation helpers
```

---

## 3. Key Files & Entry Points

| File                                                                                  | Purpose                                                                                                                                          | When to Read                                   |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `apps/frontend/playwright.config.ts`                                                  | Frontend browser automation config for auth smoke tests                                                                                          | Auth E2E changes                               |
| `apps/frontend/e2e/auth-smoke.spec.ts`                                                | Smoke suite for signed-out auth pages and direct-navigation guards                                                                               | Auth browser automation changes                |
| `apps/frontend/e2e/login.real.spec.ts`                                                | Real Clerk login browser coverage for a dedicated fixed-password Clerk test user and optional Client Trust completion                            | Real login-flow changes                        |
| `apps/frontend/e2e/forgot-password.real.spec.ts`                                      | Real Clerk forgot-password browser coverage for the single `A -> B -> A` happy-path cycle                                                        | Real reset-flow changes                        |
| `apps/frontend/e2e/forgot-password-policy.real.spec.ts`                               | Real Clerk forgot-password password-policy coverage                                                                                              | Real reset-policy changes                      |
| `apps/frontend/e2e/signup.real.spec.ts`                                               | Real Clerk sign-up browser coverage for a unique `+clerk_test` email and fixed OTP verification                                                  | Real sign-up flow changes                      |
| `apps/frontend/e2e/helpers/auth/otp.ts`                                               | Shared OTP interaction helper for Clerk auth challenges                                                                                          | OTP UI changes in auth E2E                     |
| `apps/frontend/e2e/helpers/auth/login-recovery.ts`                                    | Login/session recovery helpers, public login outcomes, and password rotation detection                                                           | Real auth login-state setup changes            |
| `apps/frontend/e2e/helpers/auth/forgot-password-flow.ts`                              | Forgot-password page orchestration helpers                                                                                                       | Real forgot-password browser-flow changes      |
| `apps/frontend/e2e/helpers/auth/forgot-password.ts`                                   | Thin barrel that re-exports public forgot-password auth helpers                                                                                  | Spec-facing auth helper imports                |
| `apps/frontend/e2e/helpers/env.ts`                                                    | E2E env loader for Clerk/Gmail test configuration                                                                                                | Real auth test setup changes                   |
| `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.test.tsx` | Focused hook coverage for one-shot email prefill cleanup, initial code sending, cooldown timing, resend blocking, and retry protection             | Forgot-password controller or cooldown changes |
| `apps/frontend/app/components/auth/login/use-login-flow.test.tsx`                     | Focused login coverage for direct password sign-in, Client Trust, toast feedback, and Clerk-native login SSO initiation                          | Login controller or OAuth-entry changes        |
| `apps/frontend/app/components/auth/register/use-register-flow.test.tsx`                | Focused registration coverage for password/code initiation, attempt reset, HeroUI feedback, and Clerk-native signup SSO                         | Register controller or OAuth-entry changes     |
| `apps/frontend/app/components/auth/sso-callback/use-sso-callback.test.tsx`            | Focused callback coverage for finalization, transfers, returned transfer errors, missing requirements, and fallback redirects                    | SSO callback state-machine changes             |
| `apps/frontend/lib/auth/login-recovery.test.ts`                                       | Focused unit coverage for password rotation selection logic                                                                                      | Fast auth-helper regression coverage           |
| `apps/frontend/lib/auth/clerk-mail.test.ts`                                           | Focused unit coverage for Clerk reset-mail fallback behavior                                                                                     | Fast mail-helper regression coverage           |

---

## 4. Data Flow

### 4.1 Test Layers

- Vitest:
  - controller hooks and thin page boundaries
  - helper utilities
  - Clerk state decision helpers
  - login password, Client Trust, and Clerk-native SSO initiation outcomes
  - register password/code initiation, attempt reset, and Clerk-native signup SSO outcomes
  - SSO transfer errors and terminal missing-requirements outcomes
- Playwright auth smoke:
  - signed-out pages render
  - registration readiness accepts the visible breakpoint-owned level-one heading
  - protected routes redirect
  - `/sso-callback` rejects direct navigation and retired `/sso-continue` redirects to registration
- Playwright real auth:
  - login happy path with a dedicated fixed-password Clerk test user
  - Client Trust-aware login completion through the shared email-code helper
  - forgot-password happy path
  - sign-up happy path with a unique Clerk test email per run
  - Clerk test-email reset-code entry via the fixed OTP
  - Clerk test-email sign-up verification via the fixed OTP
  - Clerk password-policy failure path in a dedicated separate spec

---

## 5. Component / Module Structure

```
apps/frontend/e2e/
├── auth-smoke.spec.ts
├── forgot-password.real.spec.ts
├── login.real.spec.ts
├── signup.real.spec.ts
├── helpers/
│   ├── auth/
│   ├── env.ts
│   └── mail/
└── utils/auth.ts

apps/frontend/app/components/auth/forgot-password/
└── use-forgot-password-flow.test.tsx # Fast controller-hook coverage

apps/frontend/app/components/auth/login/
└── use-login-flow.test.tsx # Fast password, Client Trust, feedback, and SSO-start coverage

apps/frontend/app/components/auth/register/
└── use-register-flow.test.tsx # Fast password, reset, feedback, and signup SSO-start coverage

apps/frontend/app/components/auth/sso-callback/
└── use-sso-callback.test.tsx # Fast callback transfer and fallback coverage
```

---

## 6. Patterns & Conventions

### 6.1 Real Forgot-Password E2E Inputs

```bash
# Copy `apps/frontend/.env.e2e.local.example` to `.env.e2e.local`
E2E_CLERK_FORGOT_PASSWORD_TEST_EMAIL=
E2E_CLERK_LOGIN_TEST_EMAIL=
E2E_CLERK_TEST_PASSWORD_A=
E2E_CLERK_TEST_PASSWORD_B=
E2E_CLERK_INVALID_RESET_PASSWORD="Password123!"
```

### 6.2 Real Sign-Up E2E Inputs

```bash
# No dedicated sign-up email env var is required.
# The sign-up spec generates a fresh `+clerk_test` email for each run.
```

### 6.3 Verification Commands

```bash
npm run typecheck:frontend
npm test --workspace frontend
npm run test:e2e:frontend -- auth-smoke.spec.ts
npm run test:e2e:frontend -- login.real.spec.ts
npm run test:e2e:frontend:forgot-password
npm run test:e2e:frontend:headed:forgot-password
npm run test:e2e:frontend:signup
npm run test:e2e:frontend:headed:signup
npm run test:e2e:frontend:real-auth
```

### 6.4 CI Policy

- Run the auth smoke Playwright suite in CI on every push and pull request.
- Keep real Clerk login, sign-up, and forgot-password coverage out of the default CI path because those specs depend on external auth state and dedicated secrets.

### 6.5 Social Auth Testing Policy

- Keep Google and Apple auth automation at the app-owned boundary only:
  - login and register flow-hook initiation
  - `useSSOCallback`
  - retired `/sso-continue` redirect
  - public-route guards and fallback redirects
- Use auth smoke for page health and direct-navigation rejection.
- Verify provider-controlled flows manually:
  - Google sign-in
  - Google sign-up
  - Apple sign-in
  - Apple sign-up
  - same-provider retry after cancelling registration OAuth
  - cross-provider switch after cancelling registration OAuth
  - missing-requirements configuration-drift error
  - existing-session callback behavior
- Do not add full provider-browser automation by default; it is too flaky relative to the confidence gained over the current hook and smoke coverage.

---

## 7. Integration Points

| Domain           | Relationship                                                                                                                                                                           | Key Interface                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Frontend app     | Playwright boots the local auth UI and route guards                                                                                                                                    | `apps/frontend/playwright.config.ts`                 |
| Clerk test users | Login and reset coverage use separate test accounts so the login flow stays fixed while reset flow can still rotate passwords, while sign-up uses a fresh `+clerk_test` email each run | `.env.e2e.local`, `apps/frontend/e2e/helpers/env.ts` |

---

## 8. Implementation Status

- [x] Auth smoke suite
- [x] Real Clerk login E2E
- [x] Real Clerk forgot-password E2E
- [x] Real Clerk sign-up E2E
- [x] Focused helper unit coverage for reset email and password rotation logic
- [x] Successful initial code send and in-memory cooldown start coverage
- [x] Deterministic countdown progression and expiration cleanup coverage
- [x] Cooldown blocking followed by resend availability and renewal after expiry
- [x] Failed-resend retry availability and duplicate in-flight request protection
- [x] Rejected Clerk reset stops fresh-attempt creation and surfaces error feedback
- [x] Login email handoff is exposed once while URL cleanup preserves unrelated query parameters
- [x] Direct password sign-in, login toast feedback, Client Trust, and `signIn.sso()` invocation contracts
- [x] Registration password/code initiation, reset lifecycle, entry-toast feedback, and `signUp.sso()` invocation contracts
- [ ] Registration reset and OTP failure assertions aligned with the toast-only verification contract
- [x] Returned SSO transfer errors and terminal missing-requirements callback contracts
- [ ] Forgot-password reset ordering, returned reset-error handling, and different-email cleanup coverage

---

## 9. Risks & Mitigations

| Risk                                                                          | Mitigation                                                                                                     |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| OTP UI interactions diverge between flows                                     | Reuse the shared OTP helper for reset and verification steps                                                   |
| External services slow down the suite                                         | Keep real auth tests separate from fast Vitest and smoke runs                                                  |
| Partial forgot-password coverage is mistaken for its complete reset contract  | Keep reset ordering, returned errors, and different-email cleanup listed as pending until asserted directly    |
| Shared real-auth user collides across specs                                   | Run the combined real-auth command with one Playwright worker so password rotation and reset state stay serial |
| Sign-up coverage becomes non-repeatable because the test email already exists | Generate a fresh Clerk test email per run instead of reusing a fixed sign-up account                           |
| Google/Apple provider automation becomes brittle                              | Keep OAuth coverage at the app-owned hook/guard layer and verify provider-controlled flows manually            |
| Clerk resumes an abandoned registration provider attempt                      | Use Clerk's direct `signUp.sso()` contract and manually verify same-provider retry plus cross-provider switching |
| Registration tests retain the removed inline OTP-error contract                | Assert HeroUI danger toasts for reset, resend, verification, finalization, and unexpected-status failures        |

---

---

## 10. History & Decisions

- **Changelog:** [changelog.md](changelog.md)
- **Architecture decisions:** [adr/](adr/)
- Historical domain-level entries may also live in the parent changelog.
