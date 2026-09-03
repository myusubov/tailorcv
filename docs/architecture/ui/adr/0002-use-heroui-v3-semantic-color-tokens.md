# ADR 0002: Use HeroUI v3 Semantic Color Tokens

- **Status:** Accepted
- **Date:** 2026-08-07
- **Domain:** `docs/architecture/ui/`
- **Related changelog entry:** [changelog.md#heroui-v3-semantic-color-contract](../changelog.md#heroui-v3-semantic-color-contract)

---

## Context

TailorCV's global theme combined HeroUI v3 tokens with v2-era names such as
`primary`, `secondary`, and `content1-4`, plus numbered semantic color classes.
Those compatibility aliases bypassed HeroUI v3's semantic surface hierarchy,
calculated soft states, and foreground pairings. Components could therefore
compile while failing to follow the active light or dark theme consistently.

## Decision

Use HeroUI v3's canonical semantic color contract throughout frontend source.
TailorCV uses the supplied generated OKLCH values for base variables such as
`--accent`, `--surface`, `--default`, and status colors in
`apps/frontend/app/globals.css`, while HeroUI continues to own the Tailwind
mappings and calculated hover, soft, border, and separator values. The supplied
light/default and dark selectors, radii, transparent field borders, and Inter
font assignment are kept together as one theme contract.

Application source uses colors by role:

- `accent` for brand identity and emphasis
- `surface` and `overlay` for their respective container types
- `default` and `muted` for neutral controls and subdued content
- `border`, `separator`, and `focus` for structure and interaction
- `success`, `warning`, and `danger` only for state communication

Product-specific decorative concepts remain explicitly namespaced instead of
being presented as HeroUI semantics.

The desktop authentication marketing surface uses the canonical HeroUI accent
for its canvas and explicit white or translucent-white utilities for its
intentional inverse content. It does not introduce a feature-specific palette.

## Considered Alternatives

| Option                                | Tradeoff                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Retain compatibility aliases          | Minimizes edits but preserves two competing theme vocabularies and prevents reliable v3 behavior. |
| Create feature-specific color classes | Shortens component markup but hides semantic intent and duplicates the global token system.       |
| Adopt HeroUI v3 semantic tokens       | Requires a coordinated migration but gives every consumer one theme-aware contract.               |

## Consequences

- Brand color consumers use `accent` rather than `primary`.
- v2 `content1-4` layers become `surface` levels, and numbered semantic shades become soft, hover, border, or muted roles.
- Light and dark foreground pairings flow through semantic utilities instead of fixed white, black, zinc, or emerald classes.
- Future custom colors require a distinct product concept and mappings for both themes; compatibility aliases and duplicate feature palettes must not be reintroduced.

## References

- `apps/frontend/app/globals.css`
- `apps/frontend/app/components/auth/auth-brand-panel.tsx`
- `apps/frontend/app/components/auth/login/login-brand-panel-content.tsx`
- `docs/architecture/ui/README.md`
- `docs/architecture/ui/changelog.md`
