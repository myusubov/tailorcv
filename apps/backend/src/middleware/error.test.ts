import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from './error';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';
import { ErrorCode } from 'shared';
import type { Request, Response, NextFunction } from 'express';

// Mock the env module
vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}));

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));
    mockReq = {};
    mockRes = {
      status: statusMock as any,
      json: jsonMock,
    };
    mockNext = vi.fn();
  });

  describe('AppError handling', () => {
    it('should handle AppError with correct status and message', () => {
      const error = new AppError('User not found', ErrorCode.NOT_FOUND, 404);
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'User not found',
            code: ErrorCode.NOT_FOUND,
          }),
        })
      );
    });

    it('should include error details when provided', () => {
      const error = new AppError('Validation failed', ErrorCode.VALIDATION_ERROR, 400, { field: 'email' });
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: { field: 'email' },
          }),
        })
      );
    });
  });

  describe('ZodError handling', () => {
    it('should handle ZodError with 400 status', () => {
      const zodError = new ZodError([
        {
          code: 'too_small',
          minimum: 1,
          inclusive: true,
          message: 'String must contain at least 1 character(s)',
          path: ['name'],
          origin: 'string',
        } as any,
      ]);

      errorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Validation Error',
            code: ErrorCode.VALIDATION_ERROR,
          }),
        })
      );
    });
  });

  describe('Clerk error handling', () => {
    it('should handle Clerk-related errors', () => {
      const clerkError = new Error('Clerk authentication failed');
      
      errorHandler(clerkError, mockReq as Request, mockRes as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Authentication Error',
            code: ErrorCode.UNAUTHORIZED,
          }),
        })
      );
    });
  });

  describe('Unknown error handling', () => {
    it('should handle unknown errors with 500 status', () => {
      const unknownError = new Error('Something unexpected happened');
      
      errorHandler(unknownError, mockReq as Request, mockRes as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.INTERNAL_ERROR,
          }),
        })
      );
    });
  });
});
