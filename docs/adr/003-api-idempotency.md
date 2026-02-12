# ADR 003: API Idempotency Strategy

## Status
Accepted

## Context
The introduction of a **Retry Policy** (ADR 002) in the backend introduces the risk of **Side Effect Duplication**. If a request to an expensive or state-changing service (like OpenAI or Database writes) succeeds but the network fails before the response reaches the backend, the retry policy will trigger a second call.

Without idempotency:
1. **Double Billing:** We might pay for the same AI generation twice.
2. **Data Corruption:** Duplicate messages or records might be created in the database.
3. **Race Conditions:** Rapid clicking by users could trigger multiple simultaneous processes for the same action.

## Decision
We implemented a robust idempotency layer using **Redis** to ensure that "Non-Idempotent" operations (primarily POST requests) are only processed once.

### 1. Idempotency Middleware
A new middleware in `apps/backend/src/middleware/idempotency.ts` handles the lifecycle of a request:
- **Key Extraction:** It looks for a unique `x-idempotency-key` (UUID) provided by the frontend.
- **Atomic Locking:** Uses Redis to set a key status to `processing`. If the key already exists as `processing`, it returns a `409 Conflict`.
- **Cached Replay:** If the status is `completed`, it flags the request as a "replay," allowing the controller to return the previously successful result without re-executing logic.

### 2. Type-Safe Integration
We extended Express types in `apps/backend/src/types/express.ts` to provide a clean, typed API for controllers:
- `req.isIdempotentReplay`: Boolean flag to detect retries.
- `res.markIdempotentCompleted()`: Helper to commit the success state to Redis after database operations are finished.

### 3. Frontend Key Generation
The `AIChatProvider` in the frontend generates a fresh UUID for every new message sent and persists it through potential request retries.

## Consequences
### Positive
- **Safe Retries:** We can safely use aggressive retry policies without fear of duplicate data or costs.
- **Resource Protection:** Prevents "double-processing" of expensive AI tasks.
- **UX Stability:** Users won't see duplicate messages if their connection is unstable.

### Negative
- **Redis Dependency:** Idempotency requires a functional Redis instance (already used for rate limiting).
- **Frontend Complexity:** The frontend must now manage and send unique keys for state-changing requests.
- **Slight Latency:** Every POST request now incurs a small Redis RTT (Round Trip Time) check.

## References
- [IETF Idempotency-Key Header Specification](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-03)
- [Stripe API Idempotency Guide](https://stripe.com/docs/api/idempotency)
- [apps/backend/src/middleware/idempotency.ts](apps/backend/src/middleware/idempotency.ts)
