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

- **Retry Policy:** 3 attempts with exponential backoff to handle transient network glitches.
- **Circuit Breaker:** Trips if 50% of requests fail in a 10s window. This prevents the system from repeatedly hitting a known-down service, allowing it to "fail fast" and recover.
- **Timeout Policy:** Hard limits (30s for GitHub, 60s for OpenAI) to prevent hanging connections.

### 2. API Rate Limiting

Implemented `express-rate-limit` with a Redis store (`rate-limit-redis`) to protect the perimeter:

- **Global Limit:** 100 requests / 15 mins.
- **Service Specific Limits:** Stricter limits for expensive routes like `/ai/chat` (20 / 15 mins) and `/auth/github` (10 / 15 mins).

### 3. Graceful Shutdown

The Express server now handles `SIGTERM` and `SIGINT` signals. It stops accepting new connections and ensures that Prisma and Redis clients disconnect cleanly before the process exits.

### 4. Robust Health Checks

The `/health` endpoint was upgraded from a static response to a dependency-aware check. It now pings the Database and Redis, returning a `503 Service Unavailable` if critical dependencies are unreachable.

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
