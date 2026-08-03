# Development Environment Changelog

> Chronological implementation and documentation history for the development environment. Add new entries at the top.

---

## 2026-07-31

### Explicit Next.js LAN Development Origin

- **Problem:** Opening the WSL2-hosted frontend through the Windows host LAN address required Next.js to recognize that development origin, while no architecture domain documented the repository-owned part of the network path.
- **Solution:**
  1. **Narrow app allowlist — `apps/frontend/next.config.ts`**: Added `192.168.1.65` to `allowedDevOrigins` for the Windows host address used by the current local network.
  2. **Environment ownership — `docs/architecture/development-environment/README.md`**: Separates the Next.js allowlist from external WSL2 networking and Windows firewall responsibilities and records that the private address can become stale.
  3. **Architecture routing — `docs/architecture/README.md`**: Registers the development-environment domain for future local-access changes.
- **Outcome:** The repository now records both the current Next.js LAN-origin configuration and the boundaries that still require host-side setup and endpoint verification.
