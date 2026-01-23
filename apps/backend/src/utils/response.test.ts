import { describe, it, expect, vi, beforeEach } from 'vitest';
import { successResponse, errorResponse, paginatedResponse } from './response';
import type { Response } from 'express';

describe('Response Utilities', () => {
  let mockRes: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));
    mockRes = {
      status: statusMock as any,
      json: jsonMock,
    };
  });

  describe('successResponse', () => {
    it('should return 200 status by default', () => {
      successResponse(mockRes as Response, { id: 1 });
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return custom status code', () => {
      successResponse(mockRes as Response, { id: 1 }, 201);
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should include success flag and data', () => {
      const data = { name: 'Test', value: 42 };
      successResponse(mockRes as Response, data);
      
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: data,
          meta: expect.objectContaining({
            timestamp: expect.any(String),
          }),
        })
      );
    });

    it('should include ISO timestamp in meta', () => {
      successResponse(mockRes as Response, {});
      const response = jsonMock.mock.calls[0][0];
      expect(new Date(response.meta.timestamp).toISOString()).toBe(response.meta.timestamp);
    });
  });

  describe('errorResponse', () => {
    it('should return 400 status by default', () => {
      errorResponse(mockRes as Response, 'Error message');
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return custom status code', () => {
      errorResponse(mockRes as Response, 'Not found', 404);
      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should include error details', () => {
      errorResponse(mockRes as Response, 'Validation failed', 400, 'VALIDATION_ERROR', { field: 'email' });
      
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: { field: 'email' },
          },
        })
      );
    });
  });

  describe('paginatedResponse', () => {
    it('should calculate pagination correctly', () => {
      const data = [{ id: 1 }, { id: 2 }];
      paginatedResponse(mockRes as Response, data, 1, 10, 25);
      
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: data,
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNext: true,
            hasPrev: false,
          },
        })
      );
    });

    it('should detect last page correctly', () => {
      paginatedResponse(mockRes as Response, [], 3, 10, 25);
      
      const response = jsonMock.mock.calls[0][0];
      expect(response.pagination.hasNext).toBe(false);
      expect(response.pagination.hasPrev).toBe(true);
    });

    it('should handle single page', () => {
      paginatedResponse(mockRes as Response, [{ id: 1 }], 1, 10, 5);
      
      const response = jsonMock.mock.calls[0][0];
      expect(response.pagination.totalPages).toBe(1);
      expect(response.pagination.hasNext).toBe(false);
      expect(response.pagination.hasPrev).toBe(false);
    });
  });
});
