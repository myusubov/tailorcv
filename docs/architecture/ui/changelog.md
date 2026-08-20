# UI Changelog

> Chronological implementation and documentation history for the frontend UI system. Add new entries at the top.

---

## 2026-08-20

### Shared Error Toast Migrated to HeroUI Toast

- **Problem:** `showErrorToast` and `useActionMutation`'s default error path rendered through Sonner's `toast.error`, splitting the app's error-feedback surface from the HeroUI Toast provider used elsewhere.
- **Solution:**
  1. **Shared utility — `apps/frontend/lib/utils/error-toast.tsx`**: Imports `toast` from `@heroui/react` and calls `toast.danger`, mapping the retry action to `actionProps.children`/`onPress` and `duration` to `timeout`.
  2. **Mutation default — `apps/frontend/lib/hooks/use-action-mutation.ts`**: Imports `toast` from `@heroui/react` for its default error toast instead of `sonner`.
- **Outcome:** `showErrorToast` and default mutation error toasts render through HeroUI Toast; Sonner remains mounted in `app/layout.tsx` for other call sites per the existing coexistence rule until a full consolidation decision is made.

## 2026-08-14

### Reset-Password Card Field Treatment

- **Problem:** The reset code already used HeroUI's contrasting Card-surface treatment, but the new-password and confirmation inputs still used the default field variant on the same surface.
- **Solution:**
  1. **Consistent reset fields — `apps/frontend/app/components/auth/forgot-password/reset-password-view.tsx`**: Applies HeroUI's `secondary` variant to both password inputs so they follow the established reset-card OTP treatment.
  2. **UI contract — `docs/architecture/ui/README.md`**: Extends the surface-aware field rule to both `InputOTP` and password `Input` components.
- **Outcome:** Every interactive field on the reset Card uses the same distinguishable surface treatment in light and dark themes.

## 2026-08-13

### Forgot-Password CSS Motion and OTP Surface Treatment

- **Decision:** Keep forgot-password mount-only presentation in native CSS and use HeroUI's surface-appropriate `InputOTP` variant rather than changing global field tokens.
- **Problem:** Recovery views retained Framer Motion wrappers for deterministic entrance effects, and primary reset-code slots shared the Card's surface color with a transparent field border, making them effectively invisible until focus.
- **Solution:**
  1. **Semantic animation targets — forgot-password entry and reset views**: Replaces Motion wrappers with native elements and route-specific classes while preserving the existing entry, scale, and staggered vertical treatments.
  2. **Scoped timelines — `apps/frontend/app/globals.css`**: Adds the illustration, email-entry, reset-card, and item sequences and includes every target in the reduced-motion override.
  3. **Surface-aware OTP composition — `apps/frontend/app/components/auth/forgot-password/reset-password-view.tsx`**: Selects HeroUI's `secondary` variant so the slots use the contrasting `default` surface role inside the Card.
- **Outcome:** Forgot-password presentation no longer requires Framer Motion, reduced-motion users avoid decorative entrances, and reset-code slots remain perceivable before focus in both themes.

## 2026-08-11

### Register Entrance Animation CSS Migration

- **Decision:** Use CSS keyframes for the registration form and email-verification entrance sequences.
- **Problem:** Registration retained multiple Framer Motion wrappers for fixed mount-only opacity, translation, and scale effects after login had moved the same presentation concern into inspectable native CSS.
- **Solution:**
  1. **Semantic animation targets — register view components and `apps/frontend/app/components/auth/registration-verification-view.tsx`**: Replaces Motion wrappers with native elements and route-specific classes while preserving form and verification structure.
  2. **Scoped timelines — `apps/frontend/app/globals.css`**: Reuses shared form keyframes, adds dedicated illustration and verification treatments, preserves existing durations and delays, and honors reduced-motion preferences.
  3. **Ownership boundary — `docs/architecture/auth/flows/README.md`**: Records registration animation as a CSS presentation concern with no authentication-flow responsibility.
- **Outcome:** Registration retains its staggered form and verification entrances while removing Framer Motion from those static presentation paths.

### Login Entrance Animation CSS Migration

- **Decision:** Use CSS keyframes for the login form's fixed entrance sequence.
- **Problem:** The static login view used multiple Framer Motion wrappers for mount-only opacity, translation, and scale effects that developers wanted to inspect and replay together with browser animation tooling.
- **Solution:**
  1. **Semantic animation targets — `apps/frontend/app/components/auth/login/login-form-view.tsx`**: Replaces Motion wrappers with native elements and attaches existing or reusable classes to every animated region.
  2. **Reusable timelines — `apps/frontend/app/globals.css`**: Preserves the existing durations, delays, and offsets, keeps the illustration and mobile-logo entrances fade-only, and shares repeated vertical and fade keyframes while honoring reduced-motion preferences.
  3. **Ownership boundary — `docs/architecture/auth/flows/README.md`**: Records that fixed login entrance motion belongs to CSS rather than JavaScript animation wrappers.
- **Outcome:** The login form retains its existing staggered entrance while removing Framer Motion from this static presentation path.

## 2026-08-07

### Auth Brand Token Removal

- **Problem:** The authentication marketing panel duplicated the generated HeroUI theme with a separate `auth-brand` background and foreground pair.
- **Solution:**
  1. **Token removal — `apps/frontend/app/globals.css`**: Removes the custom auth brand variables and Tailwind mappings while retaining unrelated TailorCV decorative tokens.
  2. **Canonical consumers — `apps/frontend/app/components/auth/auth-brand-panel.tsx` and `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`**: Uses the existing `accent` role for the canvas and explicit white utilities for its intentional inverse content.
  3. **Theme boundary — `docs/architecture/ui/README.md` and `docs/architecture/ui/adr/0002-use-heroui-v3-semantic-color-tokens.md`**: Records that authentication branding does not own an additional palette.
- **Outcome:** The generated HeroUI theme remains the only application color contract used by the authentication panel.

### Exact HeroUI Generated Theme

- **Problem:** TailorCV's canonical HeroUI tokens still used a hand-authored hex palette and narrower theme selectors instead of the supplied generated theme contract.
- **Solution:**
  1. **Exact generated token values — `apps/frontend/app/globals.css`**: Replaces the HeroUI light and dark variables with the supplied OKLCH values, theme selectors, radii, transparent field borders, and Inter font assignment while retaining separately namespaced TailorCV decorative tokens.
  2. **Contract record — `docs/architecture/ui/README.md` and `docs/architecture/ui/adr/0002-use-heroui-v3-semantic-color-tokens.md`**: Records that the canonical base palette now follows the supplied generated HeroUI theme verbatim.
- **Outcome:** HeroUI components and semantic Tailwind utilities now resolve from the supplied light and dark theme values across class-based and `data-theme` selectors.

### HeroUI Secondary Chip Color Treatment

- **Problem:** HeroUI 3.2.3 documents `secondary` Chips as bordered, but its shipped `.chip--secondary` rule is empty and its color rules change only the foreground, so changing a default Chip's semantic color does not change the rest of its visual treatment.
- **Solution:**
  1. **Missing compound styles — `apps/frontend/app/globals.css`**: Completes the secondary Chip treatment with each semantic color's soft background and foreground plus a matching inset border, without patching installed package files or changing Chip markup.
  2. **UI-system contract — `docs/architecture/ui/README.md`**: Records the local compatibility override and its ownership boundary.
- **Outcome:** A secondary Chip's `color` now controls its full semantic tint while `variant` continues to choose the solid, bordered, transparent, or soft presentation.

### HeroUI v3 Semantic Color Contract

- **Decision:** Use HeroUI v3's canonical color roles throughout frontend source and reserve custom tokens for product-specific concepts.
- **Problem:** The TailorCV theme mixed v3 variables with v2-era `primary`, `secondary`, `content1-4`, numbered semantic shades, and fixed component palettes, so valid Tailwind classes did not consistently inherit HeroUI's light/dark foreground and calculated-state behavior.
- **Solution:**
  1. **Canonical theme ownership — `apps/frontend/app/globals.css`**: Makes emerald the HeroUI `accent`, defines canonical surface, overlay, neutral, field, status, focus, border, and separator values, and leaves calculated variants plus the semantic Tailwind bridge to `@heroui/styles`.
  2. **Frontend consumer migration — `apps/frontend/app/`, `apps/frontend/e2e/`**: Replaces v2 aliases and numbered semantic shades with `accent`, surface, default, muted, border, separator, focus, overlay, and soft-status utilities according to their UI roles.
  3. **Durable contract — `CLAUDE.md`, `docs/architecture/ui/README.md`, and `docs/architecture/ui/adr/0002-use-heroui-v3-semantic-color-tokens.md`**: Records the canonical vocabulary and prevents compatibility aliases from returning.
- **Outcome:** TailorCV now has one HeroUI v3-aware color contract whose components inherit the correct light/dark values and semantic foreground pairings.

## 2026-08-04

### HeroUI 3.2.3 Upgrade

- **Decision:** Upgrade HeroUI from `3.0.0-beta.7` to exactly `3.2.3`, adopt its current compound-component contract, and retain TailorCV's intentional Tooltip behavior.
- **Problem:** The frontend remained on a beta release whose Checkbox composition, React Aria peer model, theme behavior, and supported Node runtime had changed across the stable HeroUI releases.
- **Solution:**
  1. **Exact dependency migration — `apps/frontend/package.json` and `package-lock.json`**: Pins `@heroui/react` and `@heroui/styles` to `3.2.3`, aligns the date dependency, and records the updated HeroUI/React Aria graph.
  2. **Checkbox composition migration — `apps/frontend/app/components/auth/register/register-terms-field.tsx`, onboarding item components, and resume-review cards**: Moves `Checkbox.Control` inside `Checkbox.Content`, removes invalid nested labels, and preserves existing controlled behavior.
  3. **Explicit stylesheet boundary — `apps/frontend/app/globals.css`**: Imports HeroUI through its public `@heroui/styles/css` export so Turbopack cannot combine 3.2 component markup with a persisted beta stylesheet, and keeps immediate Tooltip closing through `--tooltip-close-delay: 0ms`.
  4. **Focused interaction coverage — registration and onboarding component tests**: Covers accessible registration terms toggling and the current-item end-date clearing behavior affected by the migrated checkboxes.
- **Outcome:** TailorCV source now targets HeroUI 3.2.3's public composition and theme contracts, with runtime and browser verification still explicitly pending authorization.
