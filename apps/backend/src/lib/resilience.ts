import {
  retry,
  circuitBreaker,
  timeout,
  wrap,
  handleAll,
  CircuitState,
  ExponentialBackoff,
  IPolicy,
  SamplingBreaker,
  TimeoutStrategy,
} from 'cockatiel';
import { logger } from './logger';

/**
 * Retry policy with exponential backoff
 * - 3 attempts maximum
 * - Initial delay: 100ms
 * - Max delay: 2000ms
 * - Backoff multiplier: 2
 */
export const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({
    initialDelay: 100,
    maxDelay: 2000,
  }),
});

/**
 * Circuit breaker policy for external services
 * - Opens when 50% of requests fail in a 10-second window
 * - Requires at least 5 requests before opening
 * - Half-opens after 30 seconds to test if service recovered
 */
export const circuitBreakerPolicy = circuitBreaker(handleAll, {
  halfOpenAfter: 30 * 1000, // 30 seconds
  breaker: new SamplingBreaker({
    // Opens circuit if 50% of requests fail
    threshold: 0.5,
    // Look at requests in last 10 seconds
    duration: 10 * 1000,
    // Require at least 5 requests before making a decision
    minimumRps: 5,
  }),
});

/**
 * Timeout policy for external API calls
 * - 30 seconds timeout
 */
export const timeoutPolicy = timeout(30 * 1000, TimeoutStrategy.Aggressive);

/**
 * Combined resilience policy for GitHub API calls
 * Combines timeout -> retry -> circuit breaker
 */
export const githubApiPolicy = wrap(
  timeoutPolicy,
  retryPolicy,
  circuitBreakerPolicy,
);

/**
 * Combined resilience policy for OpenAI API calls
 * Uses longer timeout due to streaming nature
 */
export const openaiApiPolicy = wrap(
  timeout(60 * 1000, TimeoutStrategy.Aggressive),
  retryPolicy,
  circuitBreakerPolicy,
);

/**
 * Generic resilience policy for other external services
 */
export const genericApiPolicy = wrap(
  timeoutPolicy,
  retryPolicy,
  circuitBreakerPolicy,
);

// Event listeners for circuit breaker monitoring
circuitBreakerPolicy.onBreak((data) => {
  logger.warn({ data }, 'Circuit breaker opened - too many failures detected');
});

circuitBreakerPolicy.onReset((data) => {
  logger.info({ data }, 'Circuit breaker closed - service recovered');
});

circuitBreakerPolicy.onHalfOpen((data) => {
  logger.info({ data }, 'Circuit breaker half-open - testing service recovery');
});

// Event listeners for retry policy monitoring
retryPolicy.onRetry((data) => {
  logger.warn({ data }, 'Retry policy - retrying...');
});

retryPolicy.onSuccess((data) => {
  logger.info({ data }, 'Retry policy - successful');
});

retryPolicy.onFailure((data) => {
  logger.error({ data }, 'Retry policy - failed');
});

/**
 * Helper function to execute a function with a specific policy
 * @param policy The resilience policy to use
 * @param fn The function to execute
 * @param context Optional context for logging
 */
export async function executeWithPolicy<T>(
  policy: IPolicy,
  fn: () => Promise<T>,
  context?: string,
): Promise<T> {
  try {
    return await policy.execute(fn);
  } catch (error) {
    if (context) {
      logger.error({ error, context }, 'Resilience policy execution failed');
    }
    throw error;
  }
}

/**
 * Check if circuit breaker is currently open
 */
export function isCircuitBreakerOpen(): boolean {
  return circuitBreakerPolicy.state === CircuitState.Open;
}
