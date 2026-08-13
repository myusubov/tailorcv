# UI: HeroUI and Tailwind Component System

> TailorCV's frontend UI composes HeroUI v3 primitives with Tailwind CSS 4 and repository-owned theme tokens.

---

## 1. Core Philosophy

| Pillar | Description |
| ------ | ----------- |
| **Accessible primitives** | HeroUI and React Aria own component semantics, keyboard behavior, and compound-component contracts. |
| **Canonical semantic theme** | TailorCV uses the supplied generated HeroUI v3 OKLCH theme values in `globals.css` while retaining HeroUI's semantic names, calculated states, and Tailwind mappings. |
| **Deliberate upgrades** | HeroUI versions are pinned exactly and upgraded only after release-note, type, interaction, and visual review. |

### 1.1 Durable Decisions

- [0001-pin-heroui-exact-versions.md](adr/0001-pin-heroui-exact-versions.md) - Pin HeroUI packages exactly and treat every upgrade as an explicit migration.
- [0002-use-heroui-v3-semantic-color-tokens.md](adr/0002-use-heroui-v3-semantic-color-tokens.md) - Keep application color usage on HeroUI v3 semantic roles rather than compatibility aliases or numbered palettes.

---

## 2. Architecture Overview

```text
@heroui/react components
        +
@heroui/styles theme contract
        +
apps/frontend/app/globals.css TailorCV tokens
        -> feature-local React views
```

---

## 3. Key Files & Entry Points

| File | Purpose | When to Read |
| ---- | ------- | ------------ |
| `apps/frontend/package.json` | Pins the supported HeroUI and Tailwind versions. | Any component-library upgrade. |
| `apps/frontend/app/globals.css` | Imports HeroUI's explicit CSS export and owns TailorCV theme tokens and intentional global overrides. | Theme or cross-component styling changes. |
| `apps/frontend/app/layout.tsx` | Mounts global UI providers, including HeroUI Toast. | Provider or global feedback changes. |

---

## 4. Component Flow

```mermaid
flowchart LR
  H[HeroUI primitive] --> C[Feature component composition]
  S[HeroUI styles] --> T[TailorCV theme tokens]
  T --> C
  C --> U[Accessible user interaction]
```

---

## 5. Component / Module Structure

```text
apps/frontend/
├── package.json             # Exact HeroUI version contract
└── app/
    ├── globals.css          # HeroUI import and TailorCV theme
    ├── layout.tsx           # Global providers
    └── components/          # Feature-local HeroUI compositions
```

---

## 6. Patterns & Conventions

- Import public components and utilities from `@heroui/react`; do not depend on private HeroUI source paths.
- Import `@heroui/styles/css` immediately after Tailwind in `globals.css`; the explicit public CSS export prevents Turbopack's persisted module graph from retaining beta-era styles after a package upgrade.
- Follow the compound-component structure documented for the installed version. In HeroUI 3.2.3, `Checkbox.Control` belongs inside `Checkbox.Content`.
- Preserve accessible names through visible content and semantic HeroUI composition rather than test-only selectors.
- Keep TailorCV palette ownership in `globals.css`; add global interaction overrides only when the application intentionally differs from HeroUI defaults.
- Complete incomplete HeroUI component treatments in the global component layer rather than patching package files. The local secondary Chip treatment combines each semantic color's soft background and foreground with a matching inset border.
- Override HeroUI's canonical base variables instead of recreating its Tailwind bridge or calculated hover/soft colors. Use `accent`, `surface`, `default`, `muted`, `separator`, `border`, `focus`, and state tokens according to semantic intent.
- Keep the generated light and dark OKLCH values, selectors, radii, and Inter assignment synchronized as one theme contract; TailorCV-specific decorative tokens remain outside those blocks.
- Keep genuinely product-specific decorative colors explicitly namespaced, such as landing and orb tokens; authentication panels use the canonical accent instead of a parallel brand palette.
- Use HeroUI's `secondary` `InputOTP` variant when the slots sit directly on a `surface` container so the `default` slot background remains distinguishable in light and dark themes without changing global field tokens.
- Keep HeroUI Toast and Sonner as separate existing feedback systems until a dedicated consolidation decision is made.

---

## 7. Integration Points

| Domain | Relationship | Key Interface |
| ------ | ------------ | ------------- |
| Dependency management | Owns workspace placement, exact package resolution, and peer-tree review. | `apps/frontend/package.json`, `package-lock.json` |
| Development environment | Supplies the Node 22 runtime required by the supported HeroUI toolchain. | `.nvmrc`, CI, Docker, root `engines` |
| Auth flows | Uses Checkbox, InputOTP, Form, and Toast for custom authentication screens. | `apps/frontend/app/components/auth/` |
| Onboarding | Uses Checkbox, DatePicker, Calendar, Modal, Chip, and form primitives. | `apps/frontend/app/components/onboarding/` |

---

## 8. Implementation Status

- [x] HeroUI React and Styles pinned to `3.2.3`
- [x] Tailwind CSS 4 retained as the styling engine
- [x] HeroUI 3.2 Checkbox composition adopted across current application usages
- [x] HeroUI v3 semantic color contract adopted across frontend consumers
- [x] Secondary Chip color and bordered-treatment combinations completed locally
- [x] Immediate Tooltip closing preserved through `--tooltip-close-delay`
- [x] Auth entrance sequences use route-scoped native CSS with reduced-motion fallbacks
- [x] Reset-code `InputOTP` slots remain visible on Card surfaces in light and dark themes
- [ ] Complete authorized type, test, build, dependency-tree, and browser verification

---

## 9. Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| A HeroUI release changes a compound API outside a major version | Keep exact pins and inspect every intervening release before upgrading. |
| React Aria peer packages resolve incompatibly | Regenerate the lockfile and inspect the installed peer tree for every upgrade. |
| Shared theme changes regress contrast or overlays | Review representative light/dark screens and keyboard focus behavior. |
| Mocks hide an invalid real component composition | Keep behavior-focused tests and include real-browser checks for upgraded primitives. |

---

## 10. History & Decisions

- **Changelog:** [changelog.md](changelog.md)
- **Architecture decisions:** [adr/](adr/)
