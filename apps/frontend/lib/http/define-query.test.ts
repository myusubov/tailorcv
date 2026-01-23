import { describe, it, expect } from 'vitest';
import { ApiRequestError } from './define-query';

describe('API Request Error', () => {
  describe('ApiRequestError', () => {
    it('should create error with all properties', () => {
      const error = new ApiRequestError(404, 'NOT_FOUND', 'Resource not found', { id: '123' });

      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.details).toEqual({ id: '123' });
      expect(error.name).toBe('ApiRequestError');
    });

    it('should extend Error class', () => {
      const error = new ApiRequestError(500, 'INTERNAL_ERROR', 'Server error');
      expect(error).toBeInstanceOf(Error);
    });

    it('should work without details', () => {
      const error = new ApiRequestError(400, 'BAD_REQUEST', 'Invalid input');
      expect(error.details).toBeUndefined();
    });

    it('should preserve error message in stack trace', () => {
      const error = new ApiRequestError(403, 'FORBIDDEN', 'Access denied');
      expect(error.stack).toContain('Access denied');
    });
  });
});
