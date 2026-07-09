# Dependency Management Changelog

> Chronological implementation history for Dependency Management. Add new entries at the top.

---

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
