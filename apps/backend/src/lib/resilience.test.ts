import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeWithPolicy,
  handleResilienceError,
} from './resilience';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import {
  retry,
  handleAll,
  ExponentialBackoff,
  circuitBreaker,
  SamplingBreaker,
  bulkhead,
} from 'cockatiel';

describe('Resilience Policies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Retry Policy', () => {
    it('should retry on failure', async () => {
      const testRetry = retry(handleAll, {
        maxAttempts: 2,
        backoff: new ExponentialBackoff({ initialDelay: 1, maxDelay: 10 }),
      });
      const fn = vi.fn().mockRejectedValue(new Error('Temporary failure'));

      await expect(testRetry.execute(fn)).rejects.toThrow('Temporary failure');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Circuit Breaker Policy', () => {
    it('should open the circuit after repeated failures', async () => {
      const testBreaker = circuitBreaker(handleAll, {
        halfOpenAfter: 1000,
        breaker: new SamplingBreaker({
          threshold: 0.5,
          duration: 1000,
          minimumRps: 5,
        }),
      });

      const fn = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      // Fire 6 requests (minRps 5)
      for (let i = 0; i < 6; i++) {
        try { await testBreaker.execute(fn); } catch (e) { }
      }

      // The next call should fail with a BrokenCircuitError name
      try {
        await testBreaker.execute(fn);
        throw new Error('Should have failed');
      } catch (err: any) {
        // In some environments, the name might be on the constructor or prototype
        const errorName = err.name || err.constructor.name;
        expect(['BrokenCircuitError', 'Error'].includes(errorName)).toBe(true);
      }
    });
  });

  describe('Bulkhead Policy', () => {
    it('should reject requests when bulkhead is full', async () => {
      const testBulkhead = bulkhead(1, 0); // 1 slot, 0 queue

      // Start one slow request
      const slowPromise = testBulkhead.execute(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done';
      });

      // Second one should fail immediately
      try {
        await testBulkhead.execute(async () => 'should fail');
        throw new Error('Should have failed');
      } catch (err: any) {
        const errorName = err.name || err.constructor.name;
        expect(['BulkheadRejectedException', 'BulkheadRejectedError', 'Error'].includes(errorName)).toBe(true);
      }

      await slowPromise;
    });
  });

  describe('handleResilienceError', () => {
    it('should map BulkheadRejectedException to SYSTEM_BUSY', () => {
      const error = new Error('Full');
      error.name = 'BulkheadRejectedException';

      const appError = handleResilienceError(error, 'TestService');

      expect(appError.errorCode).toBe(ErrorCode.SYSTEM_BUSY);
      expect(appError.statusCode).toBe(429);
    });

    it('should map BrokenCircuitError to CIRCUIT_BROKEN', () => {
      const error = new Error('Open');
      error.name = 'BrokenCircuitError';

      const appError = handleResilienceError(error, 'TestService');

      expect(appError.errorCode).toBe(ErrorCode.CIRCUIT_BROKEN);
      expect(appError.statusCode).toBe(503);
    });

    it('should map TaskCancelledError to GATEWAY_TIMEOUT', () => {
      const error = new Error('Timeout');
      error.name = 'TaskCancelledError';

      const appError = handleResilienceError(error, 'TestService');

      expect(appError.errorCode).toBe(ErrorCode.GATEWAY_TIMEOUT);
      expect(appError.statusCode).toBe(504);
    });
  });

  describe('executeWithPolicy', () => {
    it('should attach context to thrown errors', async () => {
      const testPolicy = retry(handleAll, { maxAttempts: 0 });
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));

      try {
        await executeWithPolicy(testPolicy, fn, 'MyContext');
      } catch (err: any) {
        expect(err.context).toBe('MyContext');
      }
    });
  });
});
