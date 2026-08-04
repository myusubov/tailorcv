# ADR 0001: Use Session Storage For UI Resend Cooldown

- **Status:** Superseded
- **Date:** 2026-07-31
- **Domain:** `docs/architecture/auth/flows/`
- **Related changelog entry:** [Forgot-Password Resend Cooldown Groundwork](../changelog.md#forgot-password-resend-cooldown-groundwork)
- **Superseded by:** [ADR 0002: Keep UI Resend Cooldown In Memory](0002-keep-ui-resend-cooldown-in-memory.md)

---

## Context

The forgot-password verification screen needs to discourage accidental repeated
code requests, preserve the visible cooldown across a refresh, and avoid making
the user wait after an ordinary failed resend. This state improves the interface
but cannot provide security because browser storage and client code are under
the user's control. Clerk already owns authoritative server-side resend limits.

The state should be scoped to the active browser tab. Persisting it across tabs
or browser restarts would add cleanup and identity-matching complexity without
improving the intended short-lived recovery experience.

## Decision

Store one absolute resend-availability timestamp in `sessionStorage`, scoped to
the forgot-password flow. Derive remaining seconds from that timestamp rather
than persisting a mutable counter. Treat missing, invalid, expired, or
inaccessible storage as no client-side cooldown and let Clerk enforce any real
rate limit.

The UI cooldown starts only after Clerk confirms a code was sent. Ordinary
failures do not create a new local cooldown. The completed flow must renew the
timestamp after successful resends and clear it when the user changes email or
successfully leaves code verification.

## Considered Options

| Option                                 | Tradeoff                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Component state only                   | Simple, but refresh immediately loses the remaining cooldown and produces inconsistent feedback.                                                 |
| `localStorage`                         | Survives refresh, tabs, and browser restarts, but persists this short-lived flow state too broadly and requires more identity/lifecycle cleanup. |
| Backend or Redis cooldown              | Authoritative and tamper-resistant, but duplicates Clerk's rate-limit responsibility and overengineers a UI feedback mechanism.                  |
| Absolute timestamp in `sessionStorage` | Survives refresh within one tab, expires with the session, and keeps the UI boundary explicit, while remaining user-manipulable by design.       |

## Consequences

- Refresh restoration can calculate an accurate remaining duration without subtracting and persisting a counter every second.
- Closing the tab normally discards the stored UX state.
- Storage failure must fail open and must not turn a successful Clerk send into an application error.
- The client cooldown cannot be described or relied on as abuse prevention; Clerk remains authoritative.
- Resend disabling, successful-resend renewal, rate-limit feedback, and lifecycle cleanup still need end-to-end implementation and coverage.

## References

- `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`
- `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.test.tsx`
- `docs/architecture/auth/flows/README.md`
- `docs/architecture/auth/flows/changelog.md`
