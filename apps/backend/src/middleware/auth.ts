import type { RequestHandler } from 'express';
import { getAuth, requireAuth } from '@clerk/express';
import { ErrorCode } from 'shared';
import { AppError } from '../utils/AppError';

import type { ClerkLocals } from '../types/locals';
import { env } from '../config/env';
import { prisma } from '../lib';

export const requireClerkAuth: RequestHandler = (req, res, next) => {
  if (env.NODE_ENV === 'development' && env.DEV_AUTH_BYPASS) {
    const userIdHeader = req.header('x-dev-user-id');
    const userId = (userIdHeader && userIdHeader.trim()) || 'dev_user';

    (res.locals as ClerkLocals).clerkUserId = userId;

    // Ensure the user exists in DB so FK constraints don't fail during local dev.
    prisma.user
      .upsert({
        where: { clerkUserId: userId },
        create: {
          clerkUserId: userId,
          email: `${userId}@dev.local`,
          firstName: 'Dev',
          lastName: 'User',
        },
        update: {},
      })
      .then(() => next())
      .catch(next);

    return;
  }

  requireAuth()(req, res, (err?: any) => {
    if (err) return next(err);

    const { userId } = getAuth(req);
    if (!userId) {
      return next(new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401));
    }

    (res.locals as ClerkLocals).clerkUserId = userId;
    next();
  });
};
