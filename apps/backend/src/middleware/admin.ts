import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import { env } from '../config/env';

/**
 * Middleware to restrict access to admin users only
 * Checks if the authenticated user's ID is in the ADMIN_USER_IDS list
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);

  if (!userId) {
    throw new AppError('Authentication required', ErrorCode.UNAUTHORIZED, 401);
  }

  // Get admin user IDs from environment variable
  const adminUserIds = env.ADMIN_USER_IDS?.split(',') || [];

  if (!adminUserIds.includes(userId)) {
    throw new AppError('Admin access required', ErrorCode.FORBIDDEN, 403);
  }

  next();
}
