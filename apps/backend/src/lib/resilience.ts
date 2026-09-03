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
  bulkhead,
} from 'cockatiel';
import { logger } from './logger';
import { ErrorCode } from 'shared';
import { AppError } from '../utils/AppError';

/**
 * Factory for creating retry policies with exponential backoff and jitter.
 * Cockatiel v3+ includes decorrelated jitter by default in ExponentialBackoff.
 */
const createRetryPolicy = (name: string) => {
  const policy = retry(handleAll, {
    maxAttempts: 3,
    backoff: new ExponentialBackoff({
      initialDelay: 100,
      maxDelay: 2000,
    }),
  });

  policy.onRetry((data) => {
    logger.warn({ data, service: name }, 'Retry policy - retrying...');
  });

  policy.onSuccess((data) => {
    logger.info({ data, service: name }, 'Retry policy - successful');
  });

  policy.onFailure((data) => {
    logger.error({ data, service: name }, 'Retry policy - failed');
  });

  return policy;
};

/**
 * Factory for creating circuit breaker policies.
 * Isolated instances prevent failures in one service from affecting others.
 */
const createCircuitBreakerPolicy = (name: string) => {
  const policy = circuitBreaker(handleAll, {
    halfOpenAfter: 30 * 1000, // 30 seconds
    breaker: new SamplingBreaker({
      threshold: 0.5,
      duration: 10 * 1000,
      minimumRps: 5,
    }),
  });

  policy.onBreak((data) => {
    logger.warn(
      { data, service: name },
      'Circuit breaker opened - too many failures detected',
    );
  });

  policy.onReset((data) => {
    logger.info(
      { data, service: name },
      'Circuit breaker closed - service recovered',
    );
  });

  policy.onHalfOpen((data) => {
    logger.info(
      { data, service: name },
      'Circuit breaker half-open - testing service recovery',
    );
  });

  return policy;
};

/**
 * Timeout policy for external API calls (30 seconds)
 */
export const timeoutPolicy = timeout(30 * 1000, TimeoutStrategy.Aggressive);

/**
 * OpenAI specific bulkhead to limit concurrent expensive calls.
 * Prevents resource exhaustion.
 */
const openaiBulkhead = bulkhead(10, 20); // 10 concurrent, 20 in queue

/**
 * Combined resilience policy for OpenAI API calls.
 * Includes bulkhead and longer timeout.
 */
const openaiRetry = createRetryPolicy('openai');
const openaiBreaker = createCircuitBreakerPolicy('openai');

export const openaiApiPolicy = wrap(
  openaiBulkhead,
  timeout(60 * 1000, TimeoutStrategy.Aggressive),
  openaiRetry,
  openaiBreaker,
);

/**
 * Generic resilience policy for other external services.
 */
const genericRetry = createRetryPolicy('generic');
const genericBreaker = createCircuitBreakerPolicy('generic');

export const genericApiPolicy = wrap(
  timeoutPolicy,
  genericRetry,
  genericBreaker,
);

/**
 * Helper function to execute a function with a specific policy.
 */
export async function executeWithPolicy<T>(
  policy: IPolicy,
  fn: () => Promise<T>,
  context?: string,
): Promise<T> {
  try {
    return await policy.execute(fn);
  } catch (error: any) {
    if (context) {
      logger.error(
        { err: error, context },
        'Resilience policy execution failed',
      );
      // Attach context to the error object so the global middleware can use it
      error.context = context;
    }
    throw error;
  }
}

/**
 * Maps resilience-related errors (cockatiel) to AppError.
 * @param err The error to map
 * @param context Context string for the error message (e.g., 'AI Chat')
 */
export function handleResilienceError(err: any, context: string): AppError {
  if (err.name === 'BulkheadRejectedException') {
    return new AppError(
      `The ${context} service is currently busy. Please try again in a few seconds.`,
      ErrorCode.SYSTEM_BUSY,
      429,
    );
  }

  if (err.name === 'BrokenCircuitError') {
    return new AppError(
      `The ${context} service is temporarily unavailable due to high failure rates.`,
      ErrorCode.CIRCUIT_BROKEN,
      503,
    );
  }

  if (err.name === 'TaskCancelledError') {
    return new AppError(
      `The request to ${context} timed out.`,
      ErrorCode.GATEWAY_TIMEOUT,
      504,
    );
  }

  if (err instanceof AppError) {
    return err;
  }

  return new AppError(
    err.message || 'An unexpected error occurred',
    ErrorCode.INTERNAL_ERROR,
    500,
  );
}

/**
 * Check if a specific circuit breaker is open.
 * Note: Since we now have isolated breakers, we check the one provided.
 */
export function isCircuitBreakerOpen(policy: any): boolean {
  // This is a simplified check; in a real app you might want to track breaker states differently
  return policy.state === CircuitState.Open;
}
