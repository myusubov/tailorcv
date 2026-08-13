# Dependency Management Changelog

> Chronological implementation history for Dependency Management. Add new entries at the top.

---

## 2026-08-12

### Next.js 16.3 Framework Alignment

- **Decision:** Upgrade the frontend from Next.js 16.2 to the latest stable 16.3 release while leaving the already-compatible React declarations unchanged.
- **Problem:** Next.js 16.2.12 restored stale Turbopack development output after current authentication CSS had been pulled, and its release line retained the older bundled PostCSS resolution.
- **Solution:**
  1. **Synchronized framework ownership — `apps/frontend/package.json`**: Advances `next` and `eslint-config-next` together to `^16.3.0` without broadening the upgrade to React or unrelated direct dependencies.
  2. **Reproducible resolution — `package-lock.json`**: Resolves the Next runtime, SWC platform packages, ESLint plugin, Sharp 0.35.3 image stack, and patched PostCSS graph shipped by Next.js 16.3.
  3. **Compatibility review — repository routes and configuration**: Confirms the app does not use the 16.3 behaviors most likely to require attention, including `generateStaticParams`, Cache Components, Partial Prefetching, Instant Navigation configuration, or a custom HMR endpoint.
- **Outcome:** The frontend now uses Next.js and its ESLint rules at 16.3.0, gaining the current Turbopack persistence, incremental-build, watcher, and development-diagnostics fixes without an application migration or codemod.

## 2026-08-06

### Aceternity Auth Background Prerequisites

- **Problem:** The frontend workspace did not declare the dependency set documented for the selected Aceternity copy-paste background examples.
- **Solution:**
  1. **Frontend ownership — `apps/frontend/package.json`**: Adds `clsx`, `motion`, and `tailwind-merge` to the workspace where auth background components are being developed.
  2. **Reproducible resolution — `package-lock.json`**: Records the installed packages and Motion 13 dependency graph produced by the workspace install.
  3. **Current usage boundary — `docs/architecture/dependency-management/README.md`**: Records that the current auth grid is CSS-only and does not yet import these prerequisites directly.
- **Outcome:** Subsequent Aceternity background variants can use the documented frontend dependencies without another installation, while their currently unused status remains explicit.

## 2026-08-04

### Exact HeroUI 3.2.3 Dependency Contract

- **Decision:** Keep HeroUI React and Styles on matching exact versions and leave React Aria peers lockfile-managed unless source ownership or an unmet peer requires direct declarations.
- **Problem:** The frontend's beta-era caret ranges could admit unreviewed component and styling changes, while HeroUI 3.2 externalized React Aria packages into its peer contract.
- **Solution:**
  1. **Frontend ownership — `apps/frontend/package.json`**: Pins `@heroui/react` and `@heroui/styles` to `3.2.3` and aligns `@internationalized/date` with the upgraded date-component graph.
  2. **Reproducible peer resolution — `package-lock.json`**: Records HeroUI 3.2.3, Tailwind Variants 3.3.0, and the compatible React Aria peer packages without adding unused direct application dependencies.
  3. **Durable upgrade policy — `docs/architecture/ui/adr/0001-pin-heroui-exact-versions.md`**: Requires synchronized exact pins and deliberate release, composition, dependency, and behavior review.
- **Outcome:** Routine installs cannot silently advance HeroUI, and future upgrades have an explicit owner and verification boundary.

## 2026-07-29

### Frontend Email-Masking Dependency

- **Problem:** The frontend did not have a reusable package for masking email addresses in privacy-sensitive UI such as password-recovery screens.
- **Solution:**
  1. **Frontend workspace ownership — `apps/frontend/package.json`**: Added `maskdata` as a frontend runtime dependency beside the password-recovery UI that imports it.
  2. **Recovery UI consumption — `apps/frontend/app/components/auth/forgot-password/reset-password-view.tsx`**: Uses the package's email-masking API for verification and new-password guidance.
  3. **Reproducible resolution — `package-lock.json`**: Records `maskdata` and the dependency graph produced by the install; because that lockfile diff also refreshes many existing transitive versions, it requires broader review than the one-line manifest change.
- **Outcome:** Password-recovery UI can mask the submitted email through a declared frontend dependency, while the unusually broad lockfile re-resolution remains visible as a review risk rather than being attributed solely to `maskdata`.

## 2026-05-23

### Low-Risk Audit Cleanup and Workspace Dependency Ownership

- **Decision:** Move app-only runtime dependencies out of the root manifest, align Prisma 7 backend packages, and keep only the verified `js-cookie` override.
- **Problem:** The root `package.json` declared frontend/backend runtime packages such as `next`, `react`, `@clerk/express`, and `openai`, which made dependency ownership unclear and left audit remediation harder to reason about.
- **Solution:**
  1. **Frontend ownership:** Kept `next`, `react`, `react-dom`, and `@clerk/nextjs` in `apps/frontend/package.json`, and added direct `@internationalized/date` ownership for frontend date utilities.
  2. **Backend ownership:** Added `@clerk/express` to `apps/backend/package.json` and aligned `@prisma/client`, `@prisma/adapter-pg`, and `prisma` on `7.8.0`.
  3. **Root cleanup:** Removed app runtime dependencies from root `package.json` and kept only the verified root `js-cookie` override.
  4. **Audit triage:** Verified `npm audit` now has no high-severity `js-cookie` finding; remaining moderate findings require upstream fixes or separate major migrations.
- **Outcome:** Dependency ownership now matches workspace source imports, the high-risk cookie advisory path is remediated, and remaining audit work is isolated to Prisma/Next upstream pins and the Vitest/Vite major migration.

---
