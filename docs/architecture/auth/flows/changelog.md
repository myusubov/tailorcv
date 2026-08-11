# Auth Flows Changelog

> Chronological implementation history for Auth Flows. Add new entries at the top.

---

## 2026-08-11

### Login Browser Input Semantics

- **Problem:** The login fields relied on their input types alone, leaving browsers and password managers without explicit guidance about the account identifier and existing password while also allowing spellcheck on email text.
- **Solution:**
  1. **Email intent — `apps/frontend/app/components/auth/login/login-form-view.tsx`**: Identifies the account field as email autofill content and disables spellchecking for the identifier.
  2. **Password intent — `apps/frontend/app/components/auth/login/login-form-view.tsx`**: Marks the credential as the account's current password so password managers can distinguish login from password creation.
  3. **Current-state documentation — `docs/architecture/auth/flows/README.md`**: Records the browser-semantic hints without changing Clerk validation ownership.
- **Outcome:** Login fields communicate their intended autofill behavior without altering form validation or authentication flow state.

### Responsive Login Heading Semantics

- **Problem:** Login renders different visible introductions across breakpoints, but keeping the mobile form introduction screen-reader-accessible on desktop duplicated the visible brand-panel heading.
- **Solution:**
  1. **Desktop heading ownership — `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`**: Keeps the visible brand-panel message available as the desktop page heading.
  2. **Mobile heading ownership — `apps/frontend/app/components/auth/login/login-form-view.tsx`**: Removes the form introduction from layout and the accessibility tree only on desktop while preserving it as the visible, accessible heading when the brand panel is hidden on smaller screens.
  3. **Scoped shared behavior — `docs/architecture/auth/flows/README.md`**: Records the login-specific breakpoint switch without changing registration or forgot-password heading accessibility.
- **Outcome:** Login exposes exactly one visible and accessible page heading at each breakpoint, with ownership matching the displayed layout.

### Login Resume Illustration

- **Problem:** The hand-built miniature resume card still looked like a generic interface mockup rather than a natural, memorable product illustration.
- **Solution:**
  1. **Dedicated artwork — `apps/frontend/public/images/auth/login-illustration.webp`**: Adds a transparent, compressed resume-tailoring illustration for the desktop login brand panel.
  2. **Stable shared branding — `apps/frontend/app/components/auth/auth-brand-panel.tsx`**: Pins the shared inverse logo to the panel's top-left so route content can own its composition independently.
  3. **Illustration composition — `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`**: Replaces the HTML resume card with the decorative image while retaining the existing welcome-back copy, eager desktop loading, and quality-preserving unoptimized delivery.
  4. **Current-state documentation — `docs/architecture/auth/flows/README.md`**: Records the illustration asset, presentation contract, and absence of application behavior.
- **Outcome:** The login panel now presents a recognizable resume-tailoring artifact without resembling a speculative dashboard or introducing interactive state.

## 2026-08-10

### Theme-Independent Login Resume Preview

- **Problem:** The miniature resume used semantic surface and neutral roles, so dark mode turned the document dark even though it sits on the same green brand panel and is intended to remain recognizable as white paper.
- **Solution:**
  1. **Fixed document palette — `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`**: Replaces theme-responsive document, label, separator, and placeholder colors with white and zinc utilities that remain visually stable in both application themes.
  2. **Flat preview treatment — `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`**: Removes the padded bordered frame around the document so the preview remains one direct, minimal card rather than a layered card composition.
  3. **Current-state documentation — `docs/architecture/auth/flows/README.md`**: Records the light-paper invariant and its fixed white/zinc ownership.
- **Outcome:** The login brand panel presents the same minimal white resume reminder in light and dark modes without introducing a separate theme token contract.

## 2026-08-08

### Responsive Auth Form Introductions

- **Problem:** Login hid its repeated desktop introduction with a route-specific class, while registration and password recovery retained the same title-and-description pattern beside the shared desktop brand panel.
- **Solution:**
  1. **Shared responsive utility — `apps/frontend/app/globals.css`**: Adds `auth-form-mobile-intro`, which keeps route context visible on smaller screens and visually hides it with `sr-only` on desktop so assistive technology retains the heading.
  2. **Consistent entry forms — `apps/frontend/app/components/auth/login/login-form-view.tsx`, `apps/frontend/app/(auth)/register/page.tsx`, and `apps/frontend/app/components/auth/forgot-password/email-entry-view.tsx`**: Applies the shared introduction behavior across login, registration, and forgot-password email entry.
  3. **Current-state documentation — `docs/architecture/auth/flows/README.md`**: Records the shared responsive ownership and accessibility behavior.
- **Outcome:** Small-screen auth forms retain clear route context without repeating their introduction visually beside the desktop brand panel.

## 2026-08-07

### Login Resume Preview Simplification

- **Problem:** The login panel's overlapping job and resume cards invented analysis states, scores, and tailoring signals that made a familiar returning-user screen feel like a generic AI product demonstration.
- **Solution:**
  1. **Recognizable product artifact — `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`**: Replaces the layered workflow mockup with one flat resume-page preview whose experience, projects, and skills sections echo TailorCV's existing resume output.
  2. **Restrained returning-user copy — `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`**: Replaces product-explanation copy with a short welcome-back message and removes badges, percentages, progress bars, glow, and elevated card effects.
  3. **Current-state documentation — `docs/architecture/auth/flows/README.md`**: Records the recognizable-document approach and the deliberate exclusion of speculative workflow details.
- **Outcome:** The desktop login panel now offers a quiet reminder of the user's resume work without teaching the product again or implying unfinished functionality.

### Auth Panel Canonical Accent Treatment

- **Problem:** The desktop authentication panel introduced dedicated `auth-brand` color tokens even though the canonical HeroUI accent and explicit inverse white utilities already express the intended treatment.
- **Solution:**
  1. **Canonical panel color — `apps/frontend/app/components/auth/auth-brand-panel.tsx` and `apps/frontend/app/globals.css`**: Replaces the custom brand background and foreground tokens with `bg-accent`, `text-white`, and a white-derived grid, then removes the unused token definitions and mappings.
  2. **Inverse login composition — `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`**: Uses white and translucent-white utilities for the preview surface, labels, indicator, chips, and marketing copy.
  3. **Current-state documentation — `docs/architecture/auth/flows/README.md`**: Records the canonical accent and inverse-white ownership boundary.
- **Outcome:** The authentication marketing panel now uses the existing application theme without maintaining a separate brand palette.

### Login Brand Panel Semantic Color Alignment

- **Problem:** The login product preview used fixed white, zinc, black, and emerald utilities, while coupling the large marketing canvas to HeroUI's interactive accent made dark mode switch the bright green panel to a harsh black foreground.
- **Solution:**
  1. **Stable brand shell — `apps/frontend/app/globals.css`, `apps/frontend/app/components/auth/auth-brand-panel.tsx`, and `auth-logo.tsx`**: Adds a dedicated dark-emerald `auth-brand` surface with a stable white foreground, derives the grid from `currentColor`, and keeps the inverse mark consistent in both themes.
  2. **Semantic product preview — `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`**: Replaces fixed palette utilities with accent, surface, separator, neutral, shadow, and success roles.
- **Outcome:** The desktop login composition preserves its visual hierarchy while following the active HeroUI light or dark theme without route-specific color literals.

### Login Product-Outcome Brand Story

- **Problem:** The shared desktop brand panel established TailorCV identity but left the login surface without meaningful product context, while hardcoding login copy into the shared shell would also force it onto registration and password recovery.
- **Solution:**
  1. **Composable shared surface — `apps/frontend/app/components/auth/auth-brand-panel.tsx`**: Adds an optional child-content region below the invariant logo while preserving the existing inset dimensions, grid treatment, and desktop-only behavior.
  2. **Login-specific outcome — `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`**: Adds a static target-role card, overlapping tailored-resume result, and concise returning-user message without introducing interaction, user data, or new client state.
  3. **Route-scoped adoption — `apps/frontend/app/(auth)/login/page.tsx`**: Composes the outcome content only on login so registration and forgot-password remain visually and behaviorally unchanged.
- **Outcome:** Desktop login now demonstrates TailorCV's job-to-resume outcome inside the brand panel while the shared shell remains reusable and authentication behavior remains untouched.

## 2026-08-06

### Shared Desktop Auth Brand Panel

- **Problem:** Login, registration, and forgot-password used separate desktop branding treatments, while fixed percentage columns and centered form content created inconsistent spacing and an oversized gap on wide login screens.
- **Solution:**
  1. **Shared inset surface — `apps/frontend/app/components/auth/auth-brand-panel.tsx`**: Adds one desktop-only primary panel with inverse branding, rounded inset edges, clamped width, and a theme-independent faded grid.
  2. **Cross-route adoption — `apps/frontend/app/(auth)/login/page.tsx`, `apps/frontend/app/(auth)/register/page.tsx`, and `apps/frontend/app/components/auth/forgot-password/email-entry-view.tsx`**: Replaces the route-specific desktop branding sections with the shared panel while preserving each route's mobile and authentication behavior.
  3. **Flexible form ownership — `apps/frontend/app/globals.css` and `apps/frontend/app/components/auth/login/login-form-view.tsx`**: Lets shared form panels fill the remaining desktop width and gives login a clamped leading inset so its fixed-width form stays visually connected to the brand panel on wide screens.
- **Outcome:** The three desktop auth entry surfaces now share one reusable brand panel and responsive width contract, while login keeps a deliberate panel-to-form relationship without stretching controls or changing authentication behavior.

## 2026-08-05

### Fresh Forgot-Password Attempt Restart

- **Problem:** Clerk can retain an in-progress sign-in attempt across a reload, so restoring the UI from `needs_new_password` reopened password entry even though the application deliberately does not persist the rest of the recovery flow.
- **Solution:**
  1. **Non-persistent route entry — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`**: Removes status-driven password-step restoration so a remounted route begins at email entry.
  2. **Explicit Clerk attempt reset — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`**: Resets Clerk before creating a new email attempt and when the user chooses a different email, while clearing local email, code, and cooldown state on flow exit.
  3. **Clerk fixture alignment — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.test.tsx`**: Adds the Clerk `reset()` method and successful result to the hook fixture so existing cooldown scenarios can enter the updated flow.
  4. **Lifecycle contract — `docs/architecture/auth/flows/README.md` and `adr/0002-keep-ui-resend-cooldown-in-memory.md`**: Records that local and Clerk attempt state are deliberately restarted together rather than partially restored.
- **Outcome:** Reloading or abandoning recovery returns users to email entry, and the next submission begins from a fresh Clerk sign-in attempt instead of inheriting a stale password-reset status.

## 2026-08-04

### HeroUI 3.2 Registration Terms Composition

- **Problem:** HeroUI 3.2 requires Checkbox controls to live inside `Checkbox.Content`, while the registration terms field still used the beta-era sibling composition.
- **Solution:**
  1. **Current compound structure — `apps/frontend/app/components/auth/register/register-terms-field.tsx`**: Moves the control into the content wrapper while preserving React Hook Form ownership, validation, and independently reachable terms/privacy links.
  2. **Interaction coverage — `apps/frontend/app/components/auth/register/register-terms-field.test.tsx`**: Proves the visible legal text names the checkbox, toggling updates the controlled form value, and both links remain addressable.
- **Outcome:** Registration terms remain accessible and functional on HeroUI 3.2.3 without retaining the obsolete Checkbox structure.

### Toast-Only Forgot-Password Feedback

- **Problem:** Forgot-password failures were moving to HeroUI toasts while the route and views still carried an unused `globalError` state and rendered or retained inline global-error surfaces, creating two competing feedback paths.
- **Solution:**
  1. **Single feedback owner — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`**: Reports Clerk and flow-level failures through HeroUI toasts, keeps terminal MFA, unexpected-status, and finalization messages visible until dismissed, and removes the obsolete global-error state.
  2. **Prop-chain removal — `apps/frontend/app/(auth)/forgot-password/page.tsx`, `forgot-password-email-entry.tsx`, `email-entry-view.tsx`, `forgot-password-reset.tsx`, and `reset-password-view.tsx`**: Removes `globalError` from controller and view contracts and removes both global `AnimatedError` surfaces while retaining field-level validation messages.
  3. **Focused fixture alignment — `apps/frontend/app/(auth)/forgot-password/page.test.tsx`, `apps/frontend/app/components/auth/forgot-password/forgot-password-email-entry.test.tsx`, `forgot-password-reset.test.tsx`, and `use-forgot-password-flow.test.tsx`**: Removes obsolete `globalError` values from component fixtures and isolates the hook from HeroUI's shared toast queue.
  4. **Current-state documentation — `docs/architecture/auth/flows/README.md`**: Records toast ownership, the field-validation boundary, and persistent terminal feedback.
- **Outcome:** Password-recovery errors now have one user-facing delivery path, while actionable form validation remains attached to the relevant fields and terminal outcomes stay readable until dismissed.

### In-Memory Forgot-Password Resend Cooldown

- **Decision:** Keep the UI resend cooldown in the mounted forgot-password flow instead of restoring it from browser storage; Clerk remains the authoritative resend limiter.
- **Problem:** Session storage restored only a timer while a page reload reset the complete local recovery flow to email entry, and the verification UI still did not consume the cooldown state to prevent repeated requests.
- **Solution:**
  1. **In-memory cooldown ownership — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`**: Removes session-storage restoration and persistence, derives the countdown from an absolute React-state timestamp, blocks active or overlapping resend attempts, renews the cooldown only after Clerk confirms success, and leaves resend available after failure.
  2. **Render-safe cooldown wiring — `apps/frontend/app/(auth)/forgot-password/page.tsx`, `apps/frontend/app/components/auth/forgot-password/forgot-password-reset.tsx`, and `reset-password-view.tsx`**: Passes remaining seconds into the verification view and renders disabled countdown, pending-request, and available resend states.
  3. **Focused behavior coverage — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.test.tsx` and `forgot-password-reset.test.tsx`**: Replaces storage-restoration cases with deterministic ticking, expiry, blocking, renewal, failure, duplicate-request, and UI-state coverage.
  4. **Decision supersession — `docs/architecture/auth/flows/README.md` and `adr/0002-keep-ui-resend-cooldown-in-memory.md`**: Records the mounted-flow ownership boundary and supersedes the earlier session-storage decision without rewriting its history.
- **Outcome:** The verification screen now gives immediate, countdown-based resend feedback and prevents accidental repeated requests during the mounted flow without pretending browser state is authoritative or preserving a timer after the rest of the recovery flow has reset.

## 2026-08-03

### Successful Reset-Code Resend Feedback

- **Problem:** A successful reset-code resend completed silently, leaving users unsure whether Clerk accepted the request and whether they should check their inbox.
- **Solution:**
  1. **Success-only toast — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`**: Shows a Sonner confirmation only after Clerk returns a successful resend result, while returned and thrown errors continue through the existing global-error path.
  2. **Current-state boundary — `docs/architecture/auth/flows/README.md`**: Records the implemented feedback separately from the still-pending resend disabling, cooldown renewal, and flow-exit cleanup.
- **Outcome:** Users receive clear confirmation after a successful reset-code resend without implying that the unfinished cooldown enforcement is complete.

## 2026-08-01

### Single-Owner Cooldown Countdown

- **Problem:** Cooldown restoration and the ticking effect both calculated the initial remaining seconds, while the interval callback returned the updater function instead of invoking it, so the apparent initial state could hide a countdown that never advanced.
- **Solution:**
  1. **Separated effect ownership — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`**: Limits the restoration effect to validating and restoring the absolute timestamp, while the dependent countdown effect exclusively derives remaining seconds immediately and on each interval tick.
  2. **Shared persistence contract — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts` and `use-forgot-password-flow.test.tsx`**: Exports and reuses `AVAILABLE_AT_STORAGE_KEY` instead of duplicating the storage-key literal in focused tests.
  3. **Valid-future restoration coverage — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.test.tsx`**: Freezes time, preloads a future timestamp, renders the hook, and verifies the restored timestamp plus rounded remaining seconds.
  4. **Current-state documentation — `docs/architecture/auth/flows/README.md` and the existing cooldown ADR**: Records that countdown state now ticks while resend-control integration and lifecycle cleanup remain pending.
- **Outcome:** Remaining seconds now have one calculation owner, update from the absolute timestamp every second, and have focused coverage for valid future restoration without claiming that the complete resend UX is finished.

## 2026-07-31

### Forgot-Password Resend Cooldown Groundwork

- **Decision:** Persist the UI-only resend cooldown as one absolute availability timestamp in per-tab session storage while Clerk remains the authoritative server-side rate limiter.
- **Problem:** A successfully requested password-reset code had no persisted UI cooldown, and returned Clerk errors from identifier creation or code sending could be missed before the flow advanced.
- **Solution:**
  1. **Clerk result handling — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`**: Treats returned errors from both `signIn.create()` and `sendCode()` as terminal failures before entering verification.
  2. **Best-effort cooldown persistence — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`**: Stores an absolute 60-second resend-availability timestamp after the initial send succeeds, restores only valid future safe-integer values, and still clears expired in-memory state when removing session storage throws.
  3. **Focused hook coverage — `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.test.tsx`**: Proves the initial state and the successful initial-send boundary that stores the cooldown and advances to code verification.
  4. **Persistence decision — `docs/architecture/auth/flows/adr/0001-use-session-storage-for-ui-resend-cooldown.md`**: Records why session storage owns this UX state and why Clerk, rather than browser state, remains responsible for abuse prevention.
  5. **Current-state contract — `docs/architecture/auth/flows/README.md`**: Records that live countdown updates, resend disabling, successful-resend renewal, and lifecycle cleanup remain unfinished.
- **Outcome:** The flow can persist and restore the initial resend-availability timestamp without misclassifying browser-storage failures as Clerk failures, while the remaining UI cooldown work stays explicitly tracked as incomplete.

### Password-Recovery Privacy And Focused Branding

- **Problem:** Password-recovery guidance exposed the complete submitted email, and mobile/reset-card logos added visual weight without helping users complete the focused recovery task.
- **Solution:**
  1. **Masked recovery context — `apps/frontend/app/components/auth/forgot-password/reset-password-view.tsx`**: Uses `maskdata` for user-facing verification and new-password descriptions while retaining the real email inside the flow.
  2. **Focused recovery surfaces — `apps/frontend/app/components/auth/forgot-password/email-entry-view.tsx` and `reset-password-view.tsx`**: Removes the narrow-screen and reset-card logo treatments while preserving the desktop split-layout brand panel.
  3. **Native width utility — `apps/frontend/app/components/auth/forgot-password/reset-password-view.tsx`**: Replaces the arbitrary 440px card width with Tailwind's equivalent `max-w-110` spacing token.
- **Outcome:** Password recovery reveals less account-identifying text and presents a simpler task-focused layout on narrow screens without removing desktop brand context.

## 2026-07-28

### Shared Responsive Auth Form Panel

- **Problem:** Login, registration, and forgot-password email entry repeated the same responsive form-column background, flex centering, viewport height, width, and padding classes, so layout changes could drift across the split auth routes.
- **Solution:**
  1. **Semantic Tailwind utility — `apps/frontend/app/globals.css`**: Replaced the minimum-height-only helper with `auth-form-panel`, which owns the complete responsive split-layout form-column contract.
  2. **Native spacing-scale content utility — `apps/frontend/app/globals.css`**: Added `auth-form-content` for the repeated centered inner width and vertical rhythm, replacing the arbitrary `440px` maximum with the equivalent native Tailwind `max-w-110` rem-based utility.
  3. **Mobile logo placement utility — `apps/frontend/app/globals.css`**: Added `auth-form-mobile-logo` for the centered small-screen logo treatment shared by login and registration.
  4. **Shared auth layout adoption — `apps/frontend/app/components/auth/login/login-form-view.tsx`, `apps/frontend/app/(auth)/register/page.tsx`, and `apps/frontend/app/components/auth/forgot-password/email-entry-view.tsx`**: Replaced each duplicated outer and inner layout recipe with the shared utilities while keeping the mobile logo limited to login and registration.
  5. **Architecture contract — `docs/architecture/auth/flows/README.md`**: Documented the utility boundaries and the styling responsibilities that remain local to each auth view.
- **Outcome:** All three split-layout auth routes now share one responsive form-panel contract, including small-screen viewport centering, without forcing the distinct reset-password and verification layouts into the same abstraction.

## 2026-07-27

### Shared TailorCV Shield Mark

- **Decision:** Use the supplied shield/T concept as one deterministic SVG silhouette with primary, inverse, and monochrome color variants across the custom auth journey.
- **Problem:** Login had begun using a generic document/T mark while registration and password-recovery screens still used Lucide file icons, and the shared registration marketing panel referenced a removed logo constant that prevented frontend typecheck from succeeding.
- **Solution:**
  1. **Vector reconstruction — `apps/frontend/public/brand/tailorcv-mark-primary.svg`, `tailorcv-mark-inverse.svg`, and `tailorcv-mark-monochrome.svg`**: Reconstructed the approved shield/T geometry as compact SVG paths and retained the established emerald, white, and zinc treatments.
  2. **Configurable brand-link component — `apps/frontend/app/components/auth/auth-logo.tsx` and `auth-logo.test.tsx`**: Centralized variant selection, supported auth sizing, decorative-image semantics, and the accessible home-link contract with focused regression coverage.
  3. **Contrast-aware auth integration — `apps/frontend/app/components/auth/login/branding-view.tsx`, `auth-marketing-panel.tsx`, `apps/frontend/app/(auth)/register/page.tsx`, and forgot-password views**: Applied inverse marks to dark marketing panels and primary marks to light/mobile surfaces through the shared component.
  4. **Asset contract repair — `apps/frontend/lib/config/constants.ts` consumers**: Replaced the stale `LOGOS.TAILORCV` usage with the named primary/inverse variants so all auth branding resolves through the current asset contract.
- **Outcome:** Login, registration, forgot-password entry, and password reset now share one recognizable TailorCV mark with appropriate contrast, and the frontend asset references typecheck again.

## 2026-04-20

### Register Password Confirmation

- **Decision:** Add local confirm-password validation to email/password registration while keeping Clerk sign-up payloads unchanged.
- **Problem:** Register users could mistype a password without a local confirmation check, which pushed avoidable mistakes into the Clerk sign-up flow.
- **Solution:**
  1. **`apps/frontend/lib/schemas/auth.ts`**: Added `confirmPassword` to `registerSchema` and reused the reset-password `.refine(... path: ['confirmPassword'])` mismatch pattern.
  2. **`apps/frontend/app/components/auth/register/use-register-flow.ts`**: Added a `confirmPassword` form default while continuing to call `signUp.password()` with only `emailAddress` and `password`.
  3. **`apps/frontend/app/components/auth/register/register-fields.tsx`**: Rendered a required `Confirm password` field directly after `Password`.
- **Outcome:** Email/password registration now catches mismatched passwords before Clerk submission without changing OAuth, backend, or stored account data.

## 2026-04-20

### Register-Owned Verification Callbacks

- **Decision:** Keep Clerk's `signUp` resource inside `useRegisterFlow()` for the active register journey and return only render-safe OTP view props from `verificationViewProps`.
- **Problem:** `verificationViewProps` still included the Clerk `signUp` resource, so the register controller boundary exposed implementation details even though the rendered verification view only needed state and callbacks.
- **Solution:**
  1. **`apps/frontend/app/components/auth/register/use-register-flow.ts`**: Added OTP code/error/loading state plus resend and submit callbacks that call Clerk internally and finalize navigation.
  2. **`apps/frontend/app/components/auth/register/register-form.tsx`**: Renders `RegistrationVerificationView` directly from render-safe `verificationViewProps`.
  3. **`apps/frontend/app/components/auth/registration-verification-view.tsx` + register boundary tests**: Exported the view prop contract and updated coverage so no Clerk resource is required by the register verification branch.
- **Outcome:** The register flow now keeps Clerk orchestration inside the flow hook while the verification view receives only primitives and event handlers.

## 2026-04-13

### Registration Verification View Prop Contract

- **Decision:** Make `useRegistrationVerificationFlow()` return the complete `viewProps` object consumed by `RegistrationVerificationView`.
- **Problem:** `RegistrationVerification` still knew every verification hook field and manually remapped them into the view, which duplicated the controller/view prop-mapping pattern that register had just moved out of the component.
- **Solution:**
  1. **`apps/frontend/app/components/auth/use-registration-verification-flow.ts`**: Added `email` and `onGoBack` as hook inputs and returned a grouped `viewProps` object with OTP state, loading state, and handlers.
  2. **`apps/frontend/app/components/auth/registration-verification.tsx`**: Reduced the component to hook invocation plus one intentional `RegistrationVerificationView` prop spread.
  3. **`apps/frontend/app/components/auth/registration-verification-boundary.test.tsx`**: Added boundary coverage proving the grouped view props flow through the controller.
- **Outcome:** Registration verification now follows the same grouped view-props contract as the register form controller, keeping view prop changes localized to the flow hook.

## 2026-04-13

### Register View Prop Contract

- **Decision:** Make `useRegisterFlow()` return explicit `formViewProps` and `verificationViewProps` branches instead of a flat field bag consumed manually by `RegisterForm`.
- **Problem:** The register controller had to know every internal hook field and remap handlers by hand, which made the route boundary noisier and easier to drift from the auth controller/view pattern.
- **Solution:**
  1. **`apps/frontend/app/components/auth/register/use-register-flow.ts`**: Replaced the flat return object with a discriminated `mode` result that exposes only the active view's render-safe props.
  2. **`apps/frontend/app/components/auth/register/register-form.tsx`**: Reduced the controller to a mode switch that intentionally spreads the matching view-props object.
  3. **`apps/frontend/app/components/auth/register/register-form.test.tsx`**: Updated boundary coverage to prove the grouped props are forwarded to the correct view.
- **Outcome:** Register composition now matches the preferred flow-controller shape, so future register view prop changes can stay localized to the hook and target view.

## 2026-04-07

### Forgot-Password View Purification

- **Decision:** Keep `useForgotPasswordFlow()` as the Clerk/state-machine hook, but move the remaining RHF and schema wiring out of the forgot-password view files into local controller components so the views become render-only.
- **Problem:** The forgot-password route already had the main controller hook, but `email-entry-view.tsx` and `reset-password-view.tsx` still owned `react-hook-form` and Zod setup, which made them inconsistent with the newer auth controller/view pattern used by login, register, and SSO continuation.
- **Solution:**
  1. **`apps/frontend/app/components/auth/forgot-password/forgot-password-email-entry.tsx` + `apps/frontend/app/components/auth/forgot-password/forgot-password-reset.tsx`**: Added thin local form controllers that own RHF + schema setup and adapt submitted values back into the existing flow hook callbacks.
  2. **`apps/frontend/app/components/auth/forgot-password/email-entry-view.tsx` + `apps/frontend/app/components/auth/forgot-password/reset-password-view.tsx`**: Removed RHF ownership so both files now render only from passed control/submit props.
  3. **`apps/frontend/app/(auth)/forgot-password/page.tsx` + focused Vitest specs**: Switched the route to render the new local controllers and added page-boundary plus controller submission tests.
- **Outcome:** The forgot-password flow now matches the rest of the auth stack's controller/view split, with Clerk logic in `useForgotPasswordFlow()`, form wiring in small local controllers, and render-only view files.

## 2026-04-07

### Login Controller Hook Extraction

- **Decision:** Move the login page's Clerk orchestration into a dedicated hook so the route component matches the controller/view boundaries already used by register and registration verification.
- **Problem:** `apps/frontend/app/(auth)/login/page.tsx` still mixed RHF setup, auth-reason URL cleanup, password sign-in state handling, Client Trust verification, SSO initiation, and view switching in one route file, which made the last major auth controller harder to test and reason about.
- **Solution:**
  1. **`apps/frontend/app/components/auth/login/use-login-flow.ts`**: Extracted the login controller state, Clerk sign-in handlers, Client Trust resend/verify handlers, auth-notice cleanup, and finalize navigation into a dedicated hook.
  2. **`apps/frontend/app/(auth)/login/page.tsx`**: Reduced the route component to a thin render boundary that selects between `LoginFormView` and `VerificationView`.
  3. **`apps/frontend/app/components/auth/login/use-login-flow.test.tsx` + `apps/frontend/app/(auth)/login/page.test.tsx`**: Added focused regression coverage for the extracted login flow and the route-level render switch.
- **Outcome:** The login route now follows the same controller/view split as the rest of the auth stack, and the most important password-sign-in branches have fast, direct coverage without relying on browser automation.

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
