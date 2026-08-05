# ADR 0001: Pin HeroUI Exact Versions

- **Status:** Accepted
- **Date:** 2026-08-04
- **Domain:** `docs/architecture/ui/`
- **Related changelog entry:** [changelog.md#heroui-323-upgrade](../changelog.md#heroui-323-upgrade)

---

## Context

TailorCV composes HeroUI primitives directly across auth, onboarding, resume review, and shared UI. Releases between `3.0.0-beta.7` and `3.2.3` changed Checkbox composition, Tooltip defaults, theme behavior, React Aria peer ownership, and the supported Node runtime. A semver range could therefore admit a component-library change before the application has reviewed and migrated the affected surfaces.

## Decision

Declare `@heroui/react` and `@heroui/styles` with the same exact version in `apps/frontend/package.json`. Every HeroUI upgrade must intentionally update both packages and the lockfile together, inspect intervening release notes, migrate affected component compositions, and verify dependency, type, interaction, accessibility, visual, and build behavior before delivery.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| Exact matching versions | Prevents unreviewed HeroUI updates but requires deliberate maintenance. |
| Caret ranges | Receives compatible releases automatically but can introduce unreviewed component or styling behavior. |
| Independent React and Styles versions | Allows partial updates but risks mismatched public component and CSS contracts. |

## Consequences

- HeroUI changes cannot enter through a routine install without a manifest edit.
- React and Styles remain synchronized.
- Security and bug-fix releases require an explicit upgrade pass rather than arriving automatically.
- Transitive React Aria packages remain lockfile-managed unless application source imports them directly or npm reports a missing peer.

## References

- `apps/frontend/package.json`
- `package-lock.json`
- `apps/frontend/app/globals.css`
- `docs/architecture/ui/changelog.md`
