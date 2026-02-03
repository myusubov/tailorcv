import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { errorResponse } from '../utils/response';
import { ErrorCode } from 'shared';
import { env } from '../config/env';
import { Prisma } from '../../prisma/generated/client/client.js';
import { BrokenCircuitError, TaskCancelledError } from 'cockatiel';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log the error for debugging
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    return errorResponse(
      res,
      err.message,
      err.statusCode,
      err.errorCode,
      err.details,
    );
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return errorResponse(
      res,
      'Validation Error',
      400,
      ErrorCode.VALIDATION_ERROR,
      err.issues,
    );
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Foreign key constraint failed (e.g., user row missing)
    if (err.code === 'P2003') {
      const fieldName = (err.meta as any)?.field_name as string | undefined;
      if (fieldName?.toLowerCase().includes('userid')) {
        return errorResponse(
          res,
          'User not found in database (did Clerk webhook run?)',
          404,
          ErrorCode.USER_NOT_FOUND,
        );
      }
      return errorResponse(
        res,
        'Foreign key constraint failed',
        400,
        ErrorCode.BAD_REQUEST,
        err.meta,
      );
    }

    return errorResponse(
      res,
      'Database request failed',
      400,
      ErrorCode.BAD_REQUEST,
      { code: err.code, meta: err.meta },
    );
  }

  // Handle Clerk Authentication Errors (if any specific ones bubble up)
  if (err.message.includes('Clerk')) {
    return errorResponse(
      res,
      'Authentication Error',
      401,
      ErrorCode.UNAUTHORIZED,
    );
  }

  // Handle Circuit Breaker Errors (service temporarily unavailable)
  if (err instanceof BrokenCircuitError) {
    return errorResponse(
      res,
      'External service temporarily unavailable. Please try again later.',
      503,
      ErrorCode.SERVICE_UNAVAILABLE,
    );
  }

  // Handle Task Cancelled Errors (timeout)
  if (err instanceof TaskCancelledError) {
    return errorResponse(
      res,
      'Request timeout - the operation took too long to complete.',
      504,
      ErrorCode.GATEWAY_TIMEOUT,
    );
  }

  // Handle Unknown Errors
  const message =
    env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;

  return errorResponse(
    res,
    message,
    500,
    ErrorCode.INTERNAL_ERROR,
    env.NODE_ENV === 'development' ? err.stack : undefined,
  );
};
