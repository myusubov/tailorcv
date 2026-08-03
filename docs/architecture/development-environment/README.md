# Development Environment: Local Frontend Network Access

> This domain documents repository-owned configuration that affects how the Next.js development server is reached from Windows-hosted tools and other LAN devices while the project runs inside WSL2.

---

## 1. Core Philosophy

| Pillar                     | Description                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Repository boundary**    | Document only app-owned development configuration here; Windows firewall and WSL networking remain external host state.   |
| **Exact origin allowlist** | Next.js development origins are explicit and narrow instead of allowing arbitrary remote hosts.                           |
| **Environment awareness**  | A private LAN address is not stable across networks and must be re-discovered before the allowlist is treated as current. |

No durable ADR currently constrains this domain.

---

## 2. Architecture Overview

```text
LAN browser
  -> Windows private-network firewall
  -> WSL2 mirrored networking
  -> Next.js development server
  -> allowedDevOrigins in apps/frontend/next.config.ts
```

---

## 3. Key Files & Entry Points

| File                             | Purpose                                                                          | When to Read                                               |
| -------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/frontend/next.config.ts`   | Owns the Next.js development-origin allowlist and frontend runtime configuration | Changing the host address used to open the development app |
| `.wslconfig` on the Windows host | Owns WSL2 networking behavior outside this repository                            | Diagnosing Windows-to-WSL or LAN-to-WSL reachability       |

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

---

## 7. Integration Points

| Domain           | Relationship                                                        | Key Interface                                           |
| ---------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| Frontend         | Next.js decides whether development-origin requests are accepted    | `allowedDevOrigins` in `apps/frontend/next.config.ts`   |
| Windows/WSL host | Host networking and firewall decide whether traffic reaches Next.js | WSL2 networking mode and private-profile firewall rules |

---

## 8. Implementation Status

- [x] Current Windows LAN address is represented in `allowedDevOrigins`
- [ ] Confirm or update that address whenever the host joins a different network
- [ ] Treat LAN reachability as verified only after probing the exact endpoint from the intended client

---

## 9. Risks & Mitigations

| Risk                                                 | Mitigation                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| The committed private address becomes stale          | Re-discover the Windows LAN address after network changes and update the allowlist intentionally |
| The allowlist is mistaken for firewall configuration | Diagnose the Next.js, WSL2, Windows firewall, and LAN-client boundaries separately               |
| A broad development origin weakens local safeguards  | Keep the allowlist restricted to exact required origins                                          |

---

## 10. History & Decisions

- **Changelog:** [changelog.md](changelog.md)
- **Architecture decisions:** [adr/](adr/)
