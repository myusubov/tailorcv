# Dependency Management Changelog

> Chronological implementation history for Dependency Management. Add new entries at the top.

---

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
