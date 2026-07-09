# Auth Testing Changelog

> Chronological implementation history for Auth Testing. Add new entries at the top.

---

## 2026-04-09

### Real Clerk Sign-Up E2E Coverage

- **Decision:** Add one browser-level sign-up happy-path spec that generates a fresh Clerk test email per run and uses Clerk's fixed OTP instead of introducing a reusable sign-up account or mailbox polling.
- **Problem:** Login and forgot-password already had real Clerk browser coverage, but sign-up still relied on smoke and unit-level tests only, which left the create-account plus OTP verification journey without the same end-to-end proof.
- **Solution:**
  1. **`apps/frontend/e2e/signup.real.spec.ts` + `apps/frontend/e2e/helpers/env.ts`**: Added a real sign-up spec and a unique Clerk test email generator so each run can create a brand-new account and verify it with OTP `424242`.
  2. **`apps/frontend/package.json` + `package.json`**: Added dedicated headless and headed sign-up commands and extended the combined real-auth wrapper to include sign-up coverage.
  3. **`docs/architecture/auth/testing/README.md`**: Documented the unique-email sign-up strategy, the new real sign-up spec, and the updated verification commands.
- **Outcome:** The auth browser test stack now covers all three real email/password journeys end to end: sign-up, login, and forgot-password.

## 2026-04-08

### Forgot-Password Real Auth Serialization And Input Hardening

- **Decision:** Run the dedicated forgot-password real-auth suite with one Playwright worker and harden the email-entry helper against hydration-time input resets.
- **Problem:** Invoking the forgot-password happy-path spec and password-policy spec together used Playwright's default local worker count, so both specs drove the same Clerk reset account concurrently, while the forgot-password email field could also lose its value before submit and leave the suite stuck on the first step.
- **Solution:**
  1. **`package.json`**: Added a dedicated headless forgot-password wrapper and forced both headless and headed forgot-password suite commands to pass `--workers=1`.
  2. **`apps/frontend/e2e/helpers/auth/forgot-password-flow.ts`**: Switched the email-entry helper to wait for editability, type with `pressSequentially()`, and retry until the value is stable before clicking `Send Reset Code`.
  3. **`docs/architecture/auth/testing/README.md`**: Updated the verification commands so the serial forgot-password suite entry points are documented.
- **Outcome:** The forgot-password real-auth suite now has a dedicated serial command surface and a more reliable first-step submission path before the reset-code UI is expected.

## 2026-04-07

### CI Auth Smoke Coverage

- **Decision:** Add the auth smoke Playwright spec to the default GitHub Actions CI workflow.
- **Problem:** The repo already had smoke E2E coverage for signed-out auth pages and route guards, but CI only ran Vitest and build checks, so browser-level auth regressions could still merge unnoticed.
- **Solution:**
  1. **`.github/workflows/ci.yml`**: Installed Playwright Chromium in CI and added `npm run test:e2e:frontend -- auth-smoke.spec.ts` to the default check job.
  2. **`docs/architecture/auth/testing/README.md`**: Documented the policy that auth smoke runs in CI while real Clerk specs remain out of the default CI path.
- **Outcome:** Every push and PR now validates the app-owned auth smoke journey in GitHub Actions before merge.

## 2026-04-07

### Clerk Test-Mail Reset OTP

- **Decision:** Remove Gmail polling from the forgot-password E2E path and use Clerk test emails with the fixed OTP instead.
- **Problem:** Mailbox polling added external timing and configuration overhead even though the reset flow uses Clerk test-email accounts that already expose a deterministic OTP.
- **Solution:**
  1. **`apps/frontend/e2e/helpers/env.ts` + `apps/frontend/.env.e2e.local.example`**: Removed Gmail credentials from the required forgot-password E2E setup.
  2. **`apps/frontend/e2e/forgot-password.real.spec.ts`**: Replaced mailbox polling with `getClerkTestVerificationCode()` so both reset tests enter Clerk's fixed test OTP directly.
  3. **`docs/architecture/auth/testing/README.md`**: Updated the auth testing contract to document Clerk test mail as the reset-code source.
- **Outcome:** Forgot-password E2E is now deterministic on our side and no longer depends on Gmail, IMAP timing, or mailbox configuration.

## 2026-04-07

### Single-Cycle Forgot-Password Happy Path

- **Decision:** Keep the happy-path forgot-password browser spec to exactly one `A -> B -> A` cycle and move the password-policy scenario into its own spec file.
- **Problem:** Running `forgot-password.real.spec.ts` in headed mode looked like a loop because the happy-path restoration finished and Playwright immediately started the second reset-policy test in the same file.
- **Solution:**
  1. **`apps/frontend/e2e/forgot-password.real.spec.ts`**: Reduced the file to the single reset-and-restore happy path only.
  2. **`apps/frontend/e2e/forgot-password-policy.real.spec.ts`**: Moved the invalid-password policy coverage into a dedicated spec.
  3. **`apps/frontend/package.json` + `docs/architecture/auth/testing/README.md`**: Kept the combined real-auth command and documentation aligned with the split spec layout.
- **Outcome:** Headed runs of `forgot-password.real.spec.ts` now perform one deterministic end-to-end cycle and stop, while the password-policy case remains available separately.

## 2026-04-07

### Login-Only Real Auth Account Split

- **Decision:** Move the real login spec onto a dedicated Clerk test email with one fixed password and leave the shared rotating account only for forgot-password coverage.
- **Problem:** The original login spec had to discover and recover the active password on the shared auth user, which forced extra sign-in/sign-out cycles and made a simple login proof depend on reset-state drift.
- **Solution:**
  1. **`apps/frontend/e2e/helpers/env.ts` + `apps/frontend/.env.e2e.local.example`**: Added a dedicated `E2E_CLERK_LOGIN_TEST_EMAIL` path for the fixed login-only account while keeping the shared reset env contract intact.
  2. **`apps/frontend/e2e/login.real.spec.ts`**: Removed password recovery and reset fallback from the login spec so it performs one direct sign-in with `E2E_CLERK_TEST_PASSWORD_A` and only completes the Clerk test OTP challenge when required.
  3. **`docs/architecture/auth/testing/README.md`**: Documented the split-account policy so future auth E2E work keeps login and forgot-password state isolated.
- **Outcome:** The real login suite now validates one stable password-login journey without mailbox recovery or password rotation, while forgot-password coverage can continue using the separate rotating test account.

## 2026-04-07

### Real Clerk Login E2E Coverage

- **Decision:** Add a dedicated real login browser spec that reuses the existing shared Clerk test user, password-rotation helper, and Gmail OTP helper instead of introducing a second auth test stack.
- **Problem:** Login already had strong fast coverage, but there was still no browser-level proof that the real `/login` journey could sign in with the current password, survive Clerk's Client Trust email challenge, or surface the forced-reset redirect cleanly.
- **Solution:**
  1. **`apps/frontend/e2e/helpers/auth/login-recovery.ts` + `apps/frontend/lib/auth/login-recovery.test.ts`**: Added an explicit public login outcome model so real-auth specs can distinguish direct sign-in, Client Trust-completed sign-in, reset-required redirects, and invalid credential failures without duplicating browser parsing logic.
  2. **`apps/frontend/e2e/login.real.spec.ts`**: Added a serial real-auth login suite that opportunistically asserts the reset-required redirect when the shared Clerk user is currently in that state and otherwise recovers the account via the existing forgot-password flow before proving a successful password login.
  3. **`apps/frontend/package.json` + `CLAUDE.md` + `docs/architecture/auth/testing/README.md`**: Wired the new spec into the real-auth command surface, forced the shared-user real-auth suite to run serially, documented the manual social-auth policy, and made chat-based planning the default over repo-local `PLAN.md` files.
- **Outcome:** The auth test stack now has real Clerk browser coverage for the password-login journey, including live Client Trust handling and honest reset-required behavior, without trying to automate brittle Google or Apple provider flows.


## 2026-04-06

### Auth E2E Foundation

- **Decision:** Add Playwright only to the frontend workspace and start with deterministic signed-out auth smoke coverage.
- **Problem:** Manual auth verification was the only browser-level safety net, which made route-guard regressions and auth page breakages easy to miss.
- **Solution:**
  1. **`apps/frontend/package.json` + root `package.json`**: Added frontend E2E scripts for headless and headed browser runs from both the app workspace and repo root.
  2. **`apps/frontend/playwright.config.ts`**: Configured Playwright to boot the local frontend app, capture traces/screenshots/videos on failure, and keep browser automation isolated to `apps/frontend/e2e/`.
  3. **`apps/frontend/e2e/`**: Added minimal shared auth helpers plus signed-out smoke tests for protected-route redirects, `/forgot-password`, and `/login`.
  4. **`CLAUDE.md` + `docs/architecture/README.md`**: Documented the new frontend E2E verification path.
- **Outcome:** The repo now has repeatable browser-level auth smoke coverage without depending on real Clerk email delivery or third-party OAuth providers.

## 2026-04-06

### Real Clerk Forgot-Password E2E

- **Decision:** Automate the real Clerk forgot-password flow with Playwright and a free Gmail IMAP inbox instead of using mocked OTP steps or paid inbox tooling.
- **Problem:** The auth smoke suite proved route and UI health, but it did not verify the real Clerk reset email, OTP entry, password rotation, or post-reset authenticated redirect behavior.
- **Solution:**
  1. **`apps/frontend/playwright.config.ts`**: Extended the E2E harness to load E2E env overrides and start both frontend and backend services for authenticated post-reset navigation.
  2. **`apps/frontend/e2e/helpers/env.ts`**: Added a dedicated E2E env loader for Clerk test-user credentials, Gmail IMAP credentials, and reset-email polling settings.
  3. **`apps/frontend/.env.e2e.local.example`**: Added a checked-in setup template so the real-auth suite can be configured without reverse-engineering env keys from the test code.
  4. **`apps/frontend/e2e/helpers/mail/gmail-imap.ts`**: Added Gmail IMAP polling plus reset-code extraction from live Clerk emails.
  5. **`apps/frontend/e2e/helpers/auth/forgot-password.ts`**: Added browser helpers for requesting reset emails, completing reset flows, signing out, and resolving two-password rotation.
  6. **`apps/frontend/e2e/forgot-password.real.spec.ts`**: Added a serial real-auth suite covering the happy path and a live Clerk password-policy error path.
- **Outcome:** The frontend test suite can now verify the real Clerk forgot-password journey end to end with a free, reusable mailbox workflow and repeatable password rotation.

## 2026-04-07

### Real Auth E2E Helper Modularization

- **Decision:** Split the real auth E2E helper stack by concern instead of keeping login recovery, OTP mechanics, forgot-password orchestration, and Clerk mail rules in one expanding helper file.
- **Problem:** The real forgot-password coverage was working, but the helper layout was becoming difficult to scale because unrelated responsibilities lived together, which would make future auth E2E changes harder to reason about and easier to break.
- **Solution:**
  1. **`apps/frontend/e2e/helpers/auth/otp.ts`**: Extracted the shared OTP interaction and reset-code verification helpers.
  2. **`apps/frontend/e2e/helpers/auth/login-recovery.ts`**: Extracted login readiness, second-factor recovery, password rotation detection, and dev sign-out behavior.
  3. **`apps/frontend/e2e/helpers/auth/forgot-password-flow.ts`**: Extracted forgot-password page submission and reset completion helpers.
  4. **`apps/frontend/e2e/helpers/auth/forgot-password.ts`**: Reduced the original helper to a thin barrel so existing spec imports stay readable.
  5. **`apps/frontend/e2e/helpers/mail/clerk-mail.ts` + `apps/frontend/e2e/helpers/mail/gmail-imap.ts`**: Moved Clerk-specific reset-email selection rules out of the generic Gmail polling helper.
- **Outcome:** The auth E2E code now has cleaner module boundaries, with transport, Clerk-specific mail behavior, OTP UI mechanics, and flow orchestration separated so each piece can evolve without dragging the others along.

## 2026-04-07

### Real Auth E2E Reset-Step Interaction Consistency

- **Decision:** Route both real forgot-password specs through the same OTP-entry helper and make the forgot-password email submission wait for a confirmed identifier before clicking.
- **Problem:** The happy-path test passed after the Gmail helper fix, but the password-policy test still used `.fill()` directly on Clerk's OTP UI and could lose the page when the test timed out or the control never accepted the code. The reset-email request helper could also click before the email field was durably populated.
- **Solution:** Reused the shared verification helper and hardened email submission waits in the forgot-password auth helpers and real spec.
- **Outcome:** Both real forgot-password specs now drive Clerk's reset OTP UI through the same reliable interaction path, and the reset-email request no longer races the page hydration step.

## 2026-04-07

### Real Auth E2E Fresh-Reset Preference

- **Decision:** Prefer reset emails that arrive after the current forgot-password request before falling back to older still-valid reset codes.
- **Problem:** The widened reset-code grace window prevented timeouts, but it also allowed an older reset email from password-rotation setup to be selected immediately, which made Clerk reject the code as incorrect before the fresh reset email had a chance to arrive.
- **Solution:** Tried a fresh-only reset email search first, then fell back to the bounded grace-window search only if needed.
- **Outcome:** The reset helper now avoids grabbing stale reset codes from earlier setup flows while still recovering when Clerk legitimately reuses the newest valid reset code.

## 2026-04-07

### Real Auth E2E Reset-Code Subject Extraction

- **Decision:** Prefer extracting Clerk reset codes from the email envelope subject before parsing the full MIME body.
- **Problem:** The Gmail helper could see matching reset emails in IMAP fetch results and still time out because it depended on full message parsing before it would accept a reset email, even though Clerk already places the OTP in the subject line.
- **Solution:** Added subject-first OTP extraction with MIME parsing as a fallback.
- **Outcome:** The reset helper no longer blocks on full body parsing for standard Clerk reset emails.

## 2026-04-07

### Real Auth E2E Reset-Email Matching

- **Decision:** Match reset emails by Clerk's stable subject fragment and allow a bounded grace window for the newest valid reset code instead of assuming every reset request sends a brand-new email.
- **Problem:** The happy-path Playwright reset test kept timing out in Gmail polling because the suite filtered on the wrong subject text and then rejected the latest valid reset email when Clerk reused an existing reset code instead of emitting a fresh one for the current request.
- **Solution:** Updated the Gmail poller search contract and removed the stale env-based subject override from the real reset setup.
- **Outcome:** The real forgot-password happy path now accepts the same reset email Clerk actually uses for the flow.

## 2026-04-07

### Real Auth E2E Reset-Code Entry Alignment

- **Decision:** Reuse the same OTP-entry helper for Clerk's reset-code step and second-factor verification step.
- **Problem:** The real forgot-password suite could fetch the live reset code email, but it still tried to fill the reset step like a plain labeled input, which did not drive HeroUI's `InputOTP` control or enable the `Verify Code` button reliably.
- **Solution:** Reused the shared OTP filler for the reset step and waited for the verify button to enable before submitting.
- **Outcome:** The real forgot-password suite now enters the reset email code through the same browser interaction path a user takes.

## 2026-04-07

### Real Auth E2E Second-Factor Recovery

- **Decision:** Treat Clerk's email-code challenge as a first-class branch in the real forgot-password browser helper and retry the latest inbox code before assuming the verification step failed.
- **Problem:** The real-auth suite could reach `/login` second-factor verification, fetch the Gmail inbox successfully, and still skip the correct code because the timestamp cutoff was too strict, leaving the OTP textbox empty until Playwright's timeout expired.
- **Solution:** Added second-factor retry logic, widened the inbox selection to the newest eligible message, and aligned OTP filling with Clerk's textbox control.
- **Outcome:** The real forgot-password suite now consumes the newest valid verification email for the active Clerk challenge instead of stalling on the second-factor screen.
