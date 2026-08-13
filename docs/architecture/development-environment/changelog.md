# Development Environment Changelog

> Chronological implementation and documentation history for the development environment. Add new entries at the top.

---

## 2026-08-13

### Disable Unreliable Cross-Session Turbopack Development Cache

- **Problem:** Repeated development sessions restored stale authentication CSS and failed to load the browser HMR client chunk. Turbopack continued compiling source changes, but the open page did not receive them until the development server was fully stopped and restarted.
- **Root cause:** `apps/frontend/next.config.ts` explicitly enabled the experimental `turbopackFileSystemCacheForDev` configuration flag, allowing compiler artifacts in `.next` to be restored across `next dev` sessions. This workspace reproduced the filesystem cache's documented stability risk despite the Next.js 16.3 upgrade.
- **Solution:** Set `turbopackFileSystemCacheForDev` to `false`. Turbopack and its normal in-memory Fast Refresh behavior remain enabled; only compiler persistence across server restarts is disabled.
- **Tradeoff:** Subsequent development-server starts may perform more compilation work, but source and CSS correctness take priority over faster warm startup.

## 2026-08-12

### Next.js 16.3 Development Runtime

- **Problem:** A Next.js 16.2.12 development session rebuilt authentication CSS from an invalid restored Turbopack result, serving a removed login scale transition while omitting the newly added register illustration animation.
- **Solution:**
  1. **Framework update — `apps/frontend/package.json` + `package-lock.json`**: Upgrades Next.js to 16.3.0, which includes fixes for restored module-factory incremental builds, filesystem watching, persistence failure handling, and development asset cache busting.
  2. **Built-in recovery — Next.js 16.3 DevTools**: Makes the framework-provided bundler-cache reset and compilation diagnostics available when a development cache becomes invalid instead of introducing a repository-specific cache-deletion startup script.
- **Outcome:** The repository retains Next.js filesystem caching and normal development startup while moving to the framework release that improves cache correctness and provides its supported stale-output recovery path.

## 2026-08-11

### Self-Contained Backend Production Build

- **Decision:** Make the backend build generate and package its Prisma runtime so `npm run build` followed by `npm start` uses the same artifact locally and in Docker.
- **Problem:** TypeScript emitted imports targeting `dist/prisma/generated/client`, but the local backend build did not copy that generated JavaScript. Docker repaired the artifact with an extra copy step, leaving local production startup broken.
- **Solution:**
  1. **Backend build ownership — `apps/backend/package.json`**: Runs Prisma generation before TypeScript compilation and packages the Prisma runtime afterward.
  2. **Deterministic artifact assembly — `apps/backend/scripts/copy-prisma-runtime.mjs`**: Replaces `dist/prisma` with the current schema, migrations, and generated client after compilation.
  3. **Shared local/container contract — `Dockerfile`**: Removes the container-only Prisma copy and consumes the self-contained backend `dist` output.
- **Outcome:** A clean production-like workflow requires only `npm run build` followed by `npm start`; local and Docker startup resolve the same compiled Prisma path.

## 2026-08-04

### Repository-Wide Node 22 Runtime

- **Decision:** Use Node 22 consistently across local development, workspace types, CI, Docker, and Vercel's package-engine selection.
- **Problem:** HeroUI 3.2.3 requires Node 22 while the repository still declared Node 20 across tooling and container boundaries, which could make installs and builds depend on the environment used.
- **Solution:**
  1. **Local and deployment contract — `package.json` and `.nvmrc`**: Declares Node `22.x` for package-manager/deployment selection and provides a local version-manager default.
  2. **Workspace type alignment — root, frontend, and backend `package.json` files**: Moves every direct `@types/node` declaration to the Node 22 line.
  3. **Automation and containers — `.github/workflows/ci.yml`, `Dockerfile`, and `apps/frontend/Dockerfile`**: Uses Node 22 for CI plus backend and frontend images.
  4. **Project convention — `CLAUDE.md`**: Updates the documented runtime and supported HeroUI release.
- **Outcome:** Repository-owned environments now share one Node major suitable for HeroUI 3.2.3; command, Docker, and deployment verification remain pending authorization.

## 2026-07-31

### Explicit Next.js LAN Development Origin

- **Problem:** Opening the WSL2-hosted frontend through the Windows host LAN address required Next.js to recognize that development origin, while no architecture domain documented the repository-owned part of the network path.
- **Solution:**
  1. **Narrow app allowlist — `apps/frontend/next.config.ts`**: Added `192.168.1.65` to `allowedDevOrigins` for the Windows host address used by the current local network.
  2. **Environment ownership — `docs/architecture/development-environment/README.md`**: Separates the Next.js allowlist from external WSL2 networking and Windows firewall responsibilities and records that the private address can become stale.
  3. **Architecture routing — `docs/architecture/README.md`**: Registers the development-environment domain for future local-access changes.
- **Outcome:** The repository now records both the current Next.js LAN-origin configuration and the boundaries that still require host-side setup and endpoint verification.
