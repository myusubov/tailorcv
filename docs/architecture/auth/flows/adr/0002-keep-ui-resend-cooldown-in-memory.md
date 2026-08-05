# ADR 0002: Keep UI Resend Cooldown In Memory

- **Status:** Accepted
- **Date:** 2026-08-04
- **Domain:** `docs/architecture/auth/flows/`
- **Related changelog entry:** [In-Memory Forgot-Password Resend Cooldown](../changelog.md#in-memory-forgot-password-resend-cooldown)
- **Supersedes:** [ADR 0001: Use Session Storage For UI Resend Cooldown](0001-use-session-storage-for-ui-resend-cooldown.md)

---

## Context

The forgot-password route owns an in-memory sequence from email entry through
code verification and new-password submission. Reloading the route resets that
sequence to email entry. Restoring only a resend timestamp from session storage
therefore preserves a timer without preserving the Clerk reset attempt or the
verification screen that consumes it.

The cooldown exists to prevent accidental repeated clicks and explain when the
interface will allow another request. It cannot provide abuse prevention because
all browser state is user-controlled, while Clerk already owns authoritative
server-side resend limits.

## Decision

Keep one absolute resend-availability timestamp and its derived remaining seconds
in `useForgotPasswordFlow()` React state. Start the cooldown only after Clerk
confirms the initial code or a resend was sent, recalculate it every second, and
clear it on expiry. Do not read or write browser storage for this state.

Reject resend calls while the timestamp remains in the future or another resend
is pending. Successful resends renew the full cooldown; failed resends leave the
cooldown inactive so the user can retry. The verification view receives only
`remainingSeconds`, `isResending`, and the resend callback needed to render and
enforce its UI state. Reloading deliberately restarts both the local flow and its
cooldown; Clerk remains authoritative across reloads.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| In-memory absolute timestamp | Matches the mounted flow lifecycle, keeps countdown arithmetic stable, and adds no partial restoration state; reload discards the UI cooldown. |
| Absolute timestamp in `sessionStorage` | Restores the timer within a tab but not the Clerk attempt or verification step, creating storage validation and cleanup work for an incomplete recovery state. |
| Persist the complete recovery flow or add a continuation route | Could make refresh recovery coherent, but requires a broader Clerk-attempt restoration design that the current single-route flow does not need. |
| Backend or Redis cooldown | Would provide an authoritative application limit, but duplicates Clerk's existing server-side responsibility for a UI-feedback requirement. |

## Consequences

- The mounted verification flow displays an accurate countdown derived from one absolute timestamp.
- Reloading or leaving the route discards the local cooldown together with the rest of the local recovery flow.
- A user can discard browser cooldown state, so no documentation or enforcement may treat it as a security boundary.
- Failed resends do not impose a new local wait, while successful and in-flight requests disable duplicate actions.
- Hook tests own timer and request-state behavior; reset-view tests own disabled, countdown, pending, and available UI states.

## References

- `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.ts`
- `apps/frontend/app/components/auth/forgot-password/use-forgot-password-flow.test.tsx`
- `apps/frontend/app/components/auth/forgot-password/reset-password-view.tsx`
- `apps/frontend/app/components/auth/forgot-password/forgot-password-reset.test.tsx`
- `docs/architecture/auth/flows/README.md`
- `docs/architecture/auth/flows/changelog.md`
