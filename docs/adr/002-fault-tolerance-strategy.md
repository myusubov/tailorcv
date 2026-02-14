# ADR 002: Backend Fault Tolerance and Resilience Strategy

## Status

Accepted

## Context

The TailorCV backend relies heavily on external third-party services, specifically the GitHub API (for repository and metadata extraction) and OpenAI (for AI-powered resume coaching). These external dependencies introduce several risks:

1. **Unreliability:** Network issues or service outages can cause requests to fail.
2. **Resource Exhaustion:** Hanging requests to slow external services can clog the Node.js event loop and exhaust memory/connection pools.
3. **Cascading Failures:** A failure in a downstream service (like OpenAI) can propagate upwards, making the entire TailorCV platform unresponsive.
4. **Abuse:** Without rate limiting, the backend is vulnerable to DDoS attacks or excessive costs from expensive AI API calls.

## Decision

We have implemented a multi-layered fault tolerance and resilience strategy using industry-standard patterns:

### 1. Resilience Policies (via Cockatiel)

We introduced a centralized resilience layer in `apps/backend/src/lib/resilience.ts` using the `cockatiel` library. All external API calls are wrapped in a combined policy:

- **Retry Policy:** 3 attempts with exponential backoff and **decorrelated jitter** to handle transient network glitches and prevent "Thundering Herds."
- **Isolated Circuit Breakers:** Each external service (GitHub, OpenAI) has its own dedicated circuit breaker instance. This prevents a failure in one service from tripping the safety fuse for others.
- **Bulkhead Pattern:** Implemented a bulkhead for OpenAI calls (10 concurrent slots, 20 queue slots) to prevent slow AI responses from exhausting server resources and impacting unrelated routes.
- **Timeout Policy:** Hard limits (30s for GitHub, 60s for OpenAI) to prevent hanging connections.

### 2. Centralized Resilience Error Mapping

To maintain clean controllers and a consistent API contract, we implemented a global error mapping strategy:

- **Contextual Errors:** The `executeWithPolicy` helper attaches a context string (e.g., 'GitHub') to thrown errors.
- **Universal Translator:** A `handleResilienceError` utility maps low-level infrastructure errors to domain-specific `AppError` instances with precise status codes (e.g., `429 SYSTEM_BUSY`, `503 CIRCUIT_BROKEN`).
- **Middleware Integration:** The global `errorHandler` automatically detects these errors and formats them, ensuring consistent error responses across standard JSON and SSE streaming routes.

### 3. API Rate Limiting

Implemented `express-rate-limit` with a Redis store (`rate-limit-redis`) to protect the perimeter:

- **Global Limit:** 100 requests / 15 mins.
- **Service Specific Limits:** Stricter limits for expensive routes like `/ai/chat` (20 / 15 mins) and `/auth/github` (10 / 15 mins).

### 3. Graceful Shutdown

The Express server now handles `SIGTERM` and `SIGINT` signals. It stops accepting new connections and ensures that Prisma and Redis clients disconnect cleanly before the process exits.

### 4. Robust Health Checks

The `/health` endpoint was upgraded from a static response to a dependency-aware check. It now pings the Database and Redis, returning a `503 Service Unavailable` if critical dependencies are unreachable.

### 5. Streaming Recovery & Auto-Closure (Added Feb 14)

To prevent data loss during network jitter or OpenAI timeouts:
- **Auto-Closure Logic**: The parsing logic handles truncated JSON blocks by automatically appending missing delimiters (`}` / `]`) if the stream ends abruptly.
- **Resilient Persistence**: The frontend attempts to parse every partial "done" or "error" signal, ensuring any generated resume edit is recovered and saved locally even if the socket closes prematurely.

## Consequences

### Positive

- **Improved Stability:** The system is now "self-healing" against minor network issues.
- **Resource Protection:** Circuit breakers and timeouts prevent the backend from becoming unresponsive during external outages.
- **Better Observability:** Resilience events (like circuit breaks) are logged, providing clear signals for debugging.
- **Cost Control:** Rate limiting prevents accidental or malicious over-usage of paid APIs.

### Negative

- **Complexity:** Developers must now be aware of resilience policies and wrap external service calls correctly.
- **Testing Overhead:** Testing circuit breaker transitions and retry logic requires more sophisticated mock setups.

## References

- [Cockatiel Documentation](https://github.com/connor-baer/cockatiel)
- [Microsoft Resilience Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/category/resiliency)
