# Development Environment

> This domain documents the repository-owned Node runtime contract and the configuration used to reach the Next.js development server from Windows-hosted tools and LAN devices while the project runs inside WSL2.

---

## 1. Core Philosophy

| Pillar                     | Description                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Runtime consistency**    | Local development, CI, Docker, and deployment use the same supported Node major.                                          |
| **Repository boundary**    | Repository-owned configuration is documented here; Windows firewall and WSL networking remain external host state.        |
| **Exact origin allowlist** | Next.js development origins are explicit and narrow instead of allowing arbitrary remote hosts.                           |
| **Environment awareness**  | A private LAN address is not stable across networks and must be re-discovered before the allowlist is treated as current. |

No durable ADR currently constrains this domain.

---

## 2. Architecture Overview

```text
Developer / CI / Docker / Vercel
  -> Node 22 runtime contract
  -> npm workspace commands

Backend production build
  -> generate Prisma client
  -> compile TypeScript
  -> copy Prisma runtime into apps/backend/dist
  -> npm start

LAN browser
  -> Windows private-network firewall
  -> WSL2 mirrored networking
  -> Next.js development server
  -> allowedDevOrigins in apps/frontend/next.config.ts
```

---

## 3. Key Files & Entry Points

| File                                           | Purpose                                                                          | When to Read                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `package.json` and `.nvmrc`                    | Declare the repository Node major for package managers, local shells, and Vercel | Changing or diagnosing the supported Node runtime          |
| `.github/workflows/ci.yml`                     | Selects the Node version used by repository CI                                   | Changing CI runtime behavior                               |
| `Dockerfile`                                   | Selects the backend production/build Node image                                  | Changing backend container runtime                         |
| `apps/backend/package.json`                    | Builds a self-contained backend runtime, including the generated Prisma client   | Changing backend production build or start behavior        |
| `apps/backend/scripts/copy-prisma-runtime.mjs` | Copies Prisma runtime files into the compiled backend artifact                   | Changing the backend output structure                      |
| `apps/backend/prisma.config.ts`                | Points the Prisma CLI at `DATABASE_URL_UNPOOLED` and sets no shadow database URL | Changing or diagnosing migration connectivity              |
| `apps/frontend/Dockerfile`                     | Selects the frontend production/build Node image                                 | Changing frontend container runtime                        |
| `apps/frontend/next.config.ts`                 | Owns the Next.js development-origin allowlist and frontend runtime configuration | Changing the host address used to open the development app |
| `apps/frontend/package.json`                   | Owns the Next.js development-server and compiler release                         | Changing or diagnosing framework development behavior      |
| `.wslconfig` on the Windows host               | Owns WSL2 networking behavior outside this repository                            | Diagnosing Windows-to-WSL or LAN-to-WSL reachability       |

---

## 4. Access Flow

The current repository allowlist includes `192.168.1.65`, the Windows host LAN
address used when this configuration was added. That value permits the Next.js
development server to accept development-origin requests from that host, but it
does not open Windows firewall rules or prove that the endpoint is reachable
from another device.

The address must be re-discovered after changing networks. Repository config,
WSL listener state, Windows firewall state, and the exact LAN endpoint are
separate boundaries and should be checked independently.

---

## 5. Component / Module Structure

```text
Repository runtime
├── package.json / .nvmrc       # Node 22 contract
├── .github/workflows/ci.yml    # CI runtime
├── Dockerfile                  # Backend container runtime
└── apps/frontend/Dockerfile    # Frontend container runtime

apps/frontend/
└── next.config.ts # App-owned Next.js development-origin allowlist

Windows host (outside repository)
├── .wslconfig     # WSL2 networking mode and host-address loopback
└── firewall rules # Private-network access to the frontend development port
```

---

## 6. Patterns & Conventions

- Keep `allowedDevOrigins` development-only and list exact required origins.
- Do not treat a WSL-local HTTP response as proof that a LAN device can connect.
- Re-discover the active Windows private-network address before replacing or adding an origin.
- Keep external host commands and machine-specific firewall state out of repository source files.
- Keep the root engine, `.nvmrc`, CI setup, Docker images, workspace Node types, and documented runtime on the same Node major.
- Change the repository Node major as one coordinated migration rather than allowing environments to drift independently.
- Keep `apps/backend/dist` self-contained: the backend build generates Prisma before compilation and copies the Prisma runtime into the relative path consumed by compiled imports.
- Keep local production-like builds and Docker builds on the same backend build command rather than repairing container output separately.
- Keep the Prisma CLI on `DATABASE_URL_UNPOOLED`, Neon's direct connection, while the running app uses the pooled `DATABASE_URL`. A migrate run through the pooler left a session-level advisory lock that made later runs fail with P1002.
- Define `DATABASE_URL_UNPOOLED` in `apps/backend/.env`. No `.env.example` exists, and every Prisma CLI command, including the `prisma generate` step of `npm run build -w backend`, reads it through `prisma.config.ts`. Prisma's `env()` fails on a missing variable.
- Do not set `shadowDatabaseUrl`. Prisma creates and removes its own shadow database on Neon, and a shadow URL equal to the application database can wipe it.
- The backend `Dockerfile` and `.github/workflows/ci.yml` define a placeholder `DATABASE_URL_UNPOOLED` for `prisma generate`. Whether the build fails without it has not been tested.
- Keep Turbopack's development filesystem cache disabled because this workspace has repeatedly restored stale CSS and HMR chunks. Normal in-memory Fast Refresh remains enabled.

---

## 7. Integration Points

| Domain           | Relationship                                                        | Key Interface                                           |
| ---------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| Frontend         | Next.js decides whether development-origin requests are accepted    | `allowedDevOrigins` in `apps/frontend/next.config.ts`   |
| UI system        | HeroUI 3.2.3 requires the repository's supported Node 22 toolchain  | Root engine, CI, Docker, and workspace Node types       |
| Windows/WSL host | Host networking and firewall decide whether traffic reaches Next.js | WSL2 networking mode and private-profile firewall rules |

---

## 8. Implementation Status

- [x] Node 22 declared for local version selection, package-manager engines, CI, and Docker
- [x] Workspace Node type packages aligned with Node 22
- [x] Current Windows LAN address is represented in `allowedDevOrigins`
- [x] Backend production builds include the generated Prisma runtime in `apps/backend/dist`
- [x] Next.js 16.3 development tooling is current, with cross-session Turbopack filesystem persistence disabled after recurring stale CSS and HMR restores
- [x] Prisma CLI reads `DATABASE_URL_UNPOOLED` and sets no shadow database URL (2026-10-27; the Docker build and a CI run were not executed)
- [ ] Confirm or update that address whenever the host joins a different network
- [ ] Treat LAN reachability as verified only after probing the exact endpoint from the intended client

---

## 9. Risks & Mitigations

| Risk                                                                  | Mitigation                                                                                                 |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| The committed private address becomes stale                           | Re-discover the Windows LAN address after network changes and update the allowlist intentionally           |
| The allowlist is mistaken for firewall configuration                  | Diagnose the Next.js, WSL2, Windows firewall, and LAN-client boundaries separately                         |
| A broad development origin weakens local safeguards                   | Keep the allowlist restricted to exact required origins                                                    |
| Local, CI, Docker, and deployment use different Node majors           | Keep all repository runtime declarations synchronized and confirm the deployment build log                 |
| Turbopack restores stale compiler output between development sessions | Disable `turbopackFileSystemCacheForDev`; accept slower warm starts while retaining in-memory Fast Refresh |
| A Prisma CLI run through the pooled URL leaves an advisory lock held   | Use `DATABASE_URL_UNPOOLED`. If P1002 appears, find the idle session that holds Prisma's advisory lock in `pg_locks` and terminate only that session |

---

## 10. History & Decisions

- **Changelog:** [changelog.md](changelog.md)
- **Architecture decisions:** [adr/](adr/)
