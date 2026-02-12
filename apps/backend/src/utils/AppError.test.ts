import { describe, it, expect } from 'vitest';
import { AppError } from './AppError';
import { ErrorCode } from 'shared';

describe('AppError', () => {
  it('should create an error with all properties', () => {
    const error = new AppError(
      'Test error message',
      ErrorCode.VALIDATION_ERROR,
      400,
      { field: 'email' }
    );

    expect(error.message).toBe('Test error message');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.details).toEqual({ field: 'email' });
    expect(error.name).toBe('AppError');
  });

  it('should use default values when not provided', () => {
    const error = new AppError('Simple error');

    expect(error.message).toBe('Simple error');
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.details).toBeUndefined();
  });

  it('should be an instance of Error', () => {
    const error = new AppError('Test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should capture stack trace', () => {
    const error = new AppError('Stack test');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Stack test');
  });

  it('should handle various error codes', () => {
    const notFoundError = new AppError('Not found', ErrorCode.NOT_FOUND, 404);
    expect(notFoundError.statusCode).toBe(404);
    expect(notFoundError.errorCode).toBe(ErrorCode.NOT_FOUND);

    const authError = new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    expect(authError.statusCode).toBe(401);
    expect(authError.errorCode).toBe(ErrorCode.UNAUTHORIZED);
  });
});
