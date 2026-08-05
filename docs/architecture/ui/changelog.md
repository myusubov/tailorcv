# UI Changelog

> Chronological implementation and documentation history for the frontend UI system. Add new entries at the top.

---

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
