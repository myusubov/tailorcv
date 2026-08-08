# UI Changelog

> Chronological implementation and documentation history for the frontend UI system. Add new entries at the top.

---

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
