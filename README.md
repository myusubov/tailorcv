# TailorCV

> AI-powered resume platform for turning developer evidence into structured, editable resumes.

**Status:** Active development (started December 2025) · **Type:** Full-stack web app

[Repository](https://github.com/myusubov/tailorcv/) · [Author](https://www.muradyusubov.dev/) · [Contact](mailto:me@muradyusubov.dev)

<!-- REUSE: keep this header block for every project. Swap the name, tagline, status line, and links. -->

---

## Overview

Self-taught and project-heavy developers often have strong proof of work sitting in GitHub repositories, with no easy way to turn it into resume content. TailorCV solves this with a GitHub-based extractor: connect your account, select up to three repositories, and a deterministic analysis pipeline detects project shape, tech stack hints, and frontend and backend areas directly from the repo tree, with no AI involved at this stage. That structured evidence feeds into a base resume with section editors, autosave, a live A4-style preview, and undo and redo.

Manual entry and file upload are also built, but hidden from the onboarding flow while the GitHub path stays the focus.

An AI layer that turns extracted evidence into resume content is planned, not yet built. See [Roadmap](#roadmap).

<!-- REUSE: this is your what-and-why paragraph, two to four sentences, current state only, no roadmap items mixed in. -->

---

## Current Features

- Custom Clerk authentication: email and password login, registration, OTP verification, forgot password, Google OAuth, Apple OAuth, protected routes
- Onboarding method selection: GitHub Extractor is the only option currently live in the UI, manual entry and file upload are built but hidden
- GitHub OAuth connection with server-side token storage, repository listing, search, and selection of up to three repositories
- GitHub analysis endpoint that fetches recursive repo trees and runs deterministic, path-based project-structure analysis
- Base resume persistence through authenticated CRUD endpoints
- Resume review page with section editors, a completeness panel, autosave, a live A4-style preview, and undo and redo
- Test coverage across auth, onboarding, shared schemas, and the GitHub analyzer, with the analyzer carrying the largest share of test cases
---

## GitHub Analyzer: Implementation Status

<!-- PROJECT-SPECIFIC: this section highlights the project's standout technical component. Replace with your own project's most distinctive piece, or delete this section entirely. -->

The analyzer pipeline is built one stage at a time: deterministic analysis first, AI synthesis last.

**Implemented**
- Repo tree fetching
- Project shape detection
- Inferred stack hints
- Detected frontend areas
- Detected backend areas
- Technology metadata
- Owner-isolated scoring rules

**Not yet implemented**
- Dependency and config analyzer
- Source-code analyzer
- Test-quality analyzer
- README and docs analyzer
- CI/CD analyzer
- Commit analyzer
- PR analyzer
- Evidence aggregator
- Final AI resume synthesis

---

## Tech Stack

**Frontend**
Next.js 16, React 19, TypeScript, Tailwind CSS 4, HeroUI v3 (beta), React Hook Form, Zod, TanStack Query

**Backend**
Express, Prisma 7, PostgreSQL, Redis, Clerk

**Testing and Tooling**
Playwright, Vitest, Docker, Vercel config

<!-- REUSE: keep the three subheadings for a full-stack project. Drop Backend for a frontend-only repo, or drop Frontend for a backend-only repo. -->

---

## Architecture

Monorepo with `apps/frontend`, `apps/backend`, and `packages/shared`.

The frontend uses the Next.js App Router, Server Actions, React Query, and shared Zod contracts. The backend is an Express API with Clerk auth, rate limiting, and Prisma persistence.

**Design decision:** GitHub analysis is deterministic first. API fetching happens at the service boundary, and analyzers receive normalized repo-tree entries and return structured evidence, before any AI synthesis gets layered on top.

### Project Structure

```
tailorcv/
├── apps/
│   ├── frontend/        # Next.js app
│   └── backend/         # Express API
└── packages/
    └── shared/          # Shared types and Zod contracts
```

---

## Getting Started

<!-- REUSE: keep this whole section for every project. The bracketed lines are the only parts to fill in per repo. -->

### Prerequisites

- Node.js [confirm version]
- PostgreSQL
- Redis
- A Clerk account, for auth keys

### Installation

```bash
git clone https://github.com/myusubov/tailorcv.git
cd tailorcv
[install command, e.g. npm install or pnpm install]
```

### Environment Variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

Typical variables this stack needs (confirm exact names against `.env.example`):

- `DATABASE_URL`, PostgreSQL connection string
- `REDIS_URL`, Redis connection string
- `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`, from your Clerk dashboard

### Running Locally

```bash
[migration command, e.g. npx prisma migrate dev]
[dev command, e.g. npm run dev]
```

---

## Testing

```bash
[test command, e.g. npm run test]
[e2e command, e.g. npm run test:e2e]
```

Coverage spans auth, onboarding, shared schemas, and the GitHub analyzer, with the analyzer itself carrying the largest share of test cases.

---

## Roadmap

- AI-driven resume generation from manual entry, uploaded files, and GitHub evidence (v1 target, first AI integration)
- Dashboard with base resumes and multiple tailored resumes
- Job hub: paste a job description, tailor a resume per role
- AI resume coach: conversational, streamed editing with persistent conversation history
- Rich diff and version UI to accept or reject AI changes section by section
- More GitHub analyzers: dependencies, source code, tests, docs, CI/CD, commits, pull requests
- Evidence sources beyond developers: Behance, LinkedIn, and other professional profiles

---

## Screenshots

<!-- Add product screenshots once a finished-product shot exists. Placeholder, not yet added. -->

---

## Author

**Murad Yusubov**
Full-Stack Developer | React, Next.js, TypeScript, Node.js, Express.js

- Portfolio: [muradyusubov.dev](https://www.muradyusubov.dev/)
- LinkedIn: [linkedin.com/in/murad-yusubov](https://www.linkedin.com/in/murad-yusubov/)
- GitHub: [@myusubov](https://github.com/myusubov/)
- Email: [me@muradyusubov.dev](mailto:me@muradyusubov.dev)
