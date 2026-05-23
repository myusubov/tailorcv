# Architecture Documentation Index

> **For Developers & AI**: This index is the single entry point for all architecture documentation. Read this first to find the right doc for your task.

---

## Quick Reference Table

| **Use Case**                                   | **Primary Doc**                                                              | **Supporting Docs**                                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| SSO / OAuth login or signup changes            | [auth/README.md](auth/README.md)                                             | [auth/sso.md](auth/sso.md), `proxy.ts`, `lib/config.ts`                                        |
| Email/password auth changes                    | [auth/README.md](auth/README.md)                                             | [auth/flows.md](auth/flows.md), `lib/schemas/auth.ts`                                          |
| Auth browser automation / E2E                  | [auth/README.md](auth/README.md)                                             | [auth/testing.md](auth/testing.md), `apps/frontend/playwright.config.ts`, `apps/frontend/e2e/` |
| Real forgot-password E2E setup                 | [auth/testing.md](auth/testing.md)                                           | `apps/frontend/e2e/helpers/mail/`, `apps/frontend/.env.e2e.local.example`                      |
| Route protection / middleware                  | [auth/README.md](auth/README.md)                                             | [auth/sso.md](auth/sso.md), `proxy.ts`                                                         |
| Onboarding method or manual-entry flow changes | [onboarding.md](onboarding.md)                                               | `apps/frontend/app/onboarding/page.tsx`, `apps/frontend/app/components/onboarding/`            |
| GitHub repository analysis pipeline changes    | [github-analysis/README.md](github-analysis/README.md)                       | [github-analysis/pipeline.md](github-analysis/pipeline.md), [onboarding.md](onboarding.md)     |
| GitHub project structure analyzer changes      | [github-analysis/project-structure.md](github-analysis/project-structure.md) | `apps/backend/src/services/github-analysis/project-structure/`                                 |
| Dependency placement or audit remediation      | [dependency-management.md](dependency-management.md)                         | `package.json`, `apps/*/package.json`, `packages/*/package.json`, `package-lock.json`          |

---

## Documentation Files

### Core Architecture

- [auth/README.md](auth/README.md) — Hub for Clerk v7 custom auth documentation
- [auth/flows.md](auth/flows.md) — Email/password login, register, verification, and forgot-password flow details
- [auth/sso.md](auth/sso.md) — OAuth callback, transfer, and retired continuation guard behavior
- [auth/testing.md](auth/testing.md) — Auth smoke, real Clerk forgot-password E2E, and Gmail helper setup

---

### Data Layer

<!-- Docs related to data fetching, caching, state management -->

---

### UI Layer

- [onboarding.md](onboarding.md) — Onboarding method selection, manual-entry flow, progress UI, and generation job handoff

### Backend Analysis

- [github-analysis/README.md](github-analysis/README.md) — Hub for GitHub repository analyzer pipeline documentation
- [github-analysis/pipeline.md](github-analysis/pipeline.md) — GitHub endpoint, connection, tree fetching, and orchestration boundaries
- [github-analysis/project-structure.md](github-analysis/project-structure.md) — Implemented project structure analyzer, scoring rules, and output contracts
- [github-analysis/changelog.md](github-analysis/changelog.md) — GitHub analysis implementation history and decision log

---

### Performance & Optimization

<!-- Docs related to virtualization, caching strategies, lazy loading -->

---

### Utilities & Patterns

<!-- Docs related to shared hooks, helpers, cross-cutting concerns -->

- [dependency-management.md](dependency-management.md) — Workspace dependency ownership, audit remediation, and verified override rules

---

### Migrations & Refactors

<!-- Docs for ongoing or completed migrations, historical context -->

---

## Common Workflows

### 1. **Adding a New Feature**

**Read in this order:**

1. This README - Identify which domain docs are relevant
2. Relevant domain doc(s) - Understand existing architecture and patterns
3. `CLAUDE.md` (project root) - Follow code patterns and naming conventions

### 2. **Debugging an Issue**

**Read in this order:**

1. This README - Find the domain where the issue lives
2. Relevant domain doc - Check dev log for related past decisions
3. Integration points section - Check cross-domain dependencies

---

## Documentation Health

| Metric                 | Status     |
| ---------------------- | ---------- |
| **Total domain docs**  | 10         |
| **Last full review**   | 2026-05-15 |
| **Docs needing split** | None       |

<!--
  MAINTENANCE RULES FOR AI:
  1. When creating a new domain doc, add its entry here (file description + quick reference rows).
  2. When modifying a domain doc, check if "When to Reference" needs updating here.
  3. When a domain doc exceeds 500 lines, flag it in "Docs needing split" above.
  4. When adding cross-domain features, add a workflow entry in "Common Workflows".
  5. Keep the Quick Reference Table sorted by most common use cases first.
-->
