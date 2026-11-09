import type { RequestHandler } from 'express';
import { getAuth } from '@clerk/express';
import { ErrorCode } from 'shared';
import { AppError } from '../utils/AppError';

import type { ClerkLocals } from '../types/locals';

/**
 * Stores the signed-in Clerk user id in `res.locals.clerkUserId`, or forwards a 401 `UNAUTHORIZED` error.
 *
 * Reads the session instead of using Clerk's `requireAuth()`, which redirects an
 * unauthenticated request and so never produces the error the frontend reacts to.
 * Requires `clerkMiddleware()` to have run earlier; otherwise `getAuth` throws.
 */
export const requireClerkAuth: RequestHandler = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return next(new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401));
  }

  (res.locals as ClerkLocals).clerkUserId = userId;
  next();
};
