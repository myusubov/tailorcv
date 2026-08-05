# Architecture Documentation Index

> **For Developers & AI**: This index is the single entry point for all architecture documentation. Read this first to find the right domain folder for your task.

---

## Quick Reference Table

| **Use Case**                                     | **Primary Doc**                                                                            | **Supporting Docs**                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| SSO / OAuth login or signup changes              | [auth/README.md](auth/README.md)                                                           | [auth/sso/README.md](auth/sso/README.md), `proxy.ts`, `lib/config.ts`                                                  |
| Email/password auth changes                      | [auth/README.md](auth/README.md)                                                           | [auth/flows/README.md](auth/flows/README.md), `lib/schemas/auth.ts`                                                    |
| Auth browser automation / E2E                    | [auth/README.md](auth/README.md)                                                           | [auth/testing/README.md](auth/testing/README.md), `apps/frontend/playwright.config.ts`, `apps/frontend/e2e/`           |
| Real forgot-password E2E setup                   | [auth/testing/README.md](auth/testing/README.md)                                           | `apps/frontend/e2e/helpers/mail/`, `apps/frontend/.env.e2e.local.example`                                              |
| Route protection / middleware                    | [auth/README.md](auth/README.md)                                                           | [auth/sso/README.md](auth/sso/README.md), `proxy.ts`                                                                   |
| Onboarding method or manual-entry flow changes   | [onboarding/README.md](onboarding/README.md)                                               | `apps/frontend/app/onboarding/page.tsx`, `apps/frontend/app/components/onboarding/`                                    |
| HeroUI components, theme, or version changes     | [ui/README.md](ui/README.md)                                                               | `apps/frontend/package.json`, `apps/frontend/app/globals.css`, [ui/adr/](ui/adr/)                                      |
| GitHub repository analysis pipeline changes      | [github-analysis/README.md](github-analysis/README.md)                                     | [github-analysis/pipeline/README.md](github-analysis/pipeline/README.md), [onboarding/README.md](onboarding/README.md) |
| GitHub project structure analyzer changes        | [github-analysis/project-structure/README.md](github-analysis/project-structure/README.md) | `apps/backend/src/services/github-analysis/project-structure/`                                                         |
| Dependency placement or audit remediation        | [dependency-management/README.md](dependency-management/README.md)                         | `package.json`, `apps/*/package.json`, `packages/*/package.json`, `package-lock.json`                                  |
| Local frontend development access or LAN origins | [development-environment/README.md](development-environment/README.md)                     | `apps/frontend/next.config.ts`, host firewall and WSL networking configuration                                         |

---

## Documentation Files

### Core Architecture

- [auth/README.md](auth/README.md) - Hub for Clerk v7 custom auth documentation
- [auth/flows/README.md](auth/flows/README.md) - Email/password login, register, verification, and forgot-password flow details
- [auth/sso/README.md](auth/sso/README.md) - OAuth callback, transfer, and retired continuation guard behavior
- [auth/testing/README.md](auth/testing/README.md) - Auth smoke, real Clerk forgot-password E2E, and Gmail helper setup

---

### Data Layer

<!-- Docs related to data fetching, caching, state management -->

---

### UI Layer

- [ui/README.md](ui/README.md) - HeroUI version, compound-component, theme, provider, and upgrade contracts
- [onboarding/README.md](onboarding/README.md) - Onboarding method selection, manual-entry flow, progress UI, and generation job handoff

---

### Backend Analysis

- [github-analysis/README.md](github-analysis/README.md) - Hub for GitHub repository analyzer pipeline documentation
- [github-analysis/pipeline/README.md](github-analysis/pipeline/README.md) - GitHub endpoint, connection, tree fetching, and orchestration boundaries
- [github-analysis/project-structure/README.md](github-analysis/project-structure/README.md) - Implemented project structure analyzer, scoring rules, and output contracts
- [github-analysis/changelog.md](github-analysis/changelog.md) - GitHub analysis implementation history and decision log

---

### Performance & Optimization

<!-- Docs related to virtualization, caching strategies, lazy loading -->

---

### Utilities & Patterns

- [dependency-management/README.md](dependency-management/README.md) - Workspace dependency ownership, audit remediation, and verified override rules
- [development-environment/README.md](development-environment/README.md) - Local Next.js development access across WSL, Windows, and LAN boundaries

---

### Migrations & Refactors

<!-- Docs for ongoing or completed migrations, historical context -->

---

## Common Workflows

### 1. **Adding a New Feature**

**Read in this order:**

1. This README - Identify which domain folder is relevant
2. Relevant domain/subsystem `README.md` - Understand current architecture and patterns
3. Relevant `changelog.md` - Check recent implementation history
4. Relevant `adr/` folder - Check durable architecture decisions, if any
5. `CLAUDE.md` (project root) - Follow code patterns and naming conventions

### 2. **Debugging an Issue**

**Read in this order:**

1. This README - Find the domain where the issue lives
2. Relevant domain/subsystem `README.md` - Check current boundaries and integration points
3. Relevant `changelog.md` - Check related past decisions and regressions
4. Relevant `adr/` folder - Check durable constraints before changing architecture

---

## Documentation Health

| Metric                       | Status     |
| ---------------------------- | ---------- |
| **Top-level domain folders** | 6          |
| **Last structure migration** | 2026-07-31 |
| **Domains needing split**    | None       |

<!--
  MAINTENANCE RULES FOR AI:
  1. When creating a new domain folder, add its entry here.
  2. When modifying a domain or subsystem README.md, check if quick-reference rows need updating here.
  3. When a domain README.md exceeds 500 lines or covers 3+ distinct subsystems, flag it in "Domains needing split" above.
  4. Keep chronological implementation history in changelog.md.
  5. Keep durable architecture decisions in adr/.
-->
