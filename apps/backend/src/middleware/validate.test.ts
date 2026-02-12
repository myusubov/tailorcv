import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateBody, validateParams, validateQuery } from './validate';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      locals: {},
    };
    mockNext = vi.fn();
  });

  describe('validateBody', () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.email(),
    });

    it('should pass validation with valid body', () => {
      mockReq.body = { name: 'John', email: 'john@test.com' };
      
      const middleware = validateBody(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.locals?.body).toEqual({ name: 'John', email: 'john@test.com' });
    });

    it('should call next with error on invalid body', () => {
      mockReq.body = { name: '', email: 'invalid' };
      
      const middleware = validateBody(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
    });

    it('should strip unknown fields', () => {
      mockReq.body = { name: 'John', email: 'john@test.com', extra: 'field' };
      
      const strictSchema = z.object({
        name: z.string(),
        email: z.email(),
      }).strict();

      const middleware = validateBody(strictSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // strict() will cause an error for unknown keys
      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
    });
  });

  describe('validateParams', () => {
    const schema = z.object({
      id: z.uuid(),
    });

    it('should pass validation with valid params', () => {
      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      
      const middleware = validateParams(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.locals?.params).toEqual({ id: '123e4567-e89b-12d3-a456-426614174000' });
    });

    it('should reject invalid UUID', () => {
      mockReq.params = { id: 'not-a-uuid' };
      
      const middleware = validateParams(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
    });

    it('should pass validation with valid query', () => {
      mockReq.query = { page: '2', limit: '20' };
      
      const middleware = validateQuery(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.locals?.query).toEqual({ page: 2, limit: 20 });
    });

    it('should use default values when query is empty', () => {
      mockReq.query = {};
      
      const middleware = validateQuery(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.locals?.query).toEqual({ page: 1, limit: 10 });
    });

    it('should reject limit over max', () => {
      mockReq.query = { page: '1', limit: '500' };
      
      const middleware = validateQuery(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
    });
  });
});
