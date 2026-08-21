import type { RequestHandler } from 'express';
import { ErrorCode } from 'shared';

import {
  getGithubConnection,
  getValidInstallationToken,
} from '../services/github.service';
import type { ClerkLocals, GitHubConnectionLocals } from '../types/locals';
import { AppError } from '../utils/AppError';

/**
 * Requires the authenticated Clerk user to have a saved GitHub connection.
 * This middleware must run after requireClerkAuth because it reads res.locals.clerkUserId.
 * On success, it attaches the GitHub connection to res.locals for downstream handlers.
 */
export const requireGithubConnection: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const { clerkUserId } = res.locals as ClerkLocals;
    const githubConnection = await getGithubConnection(clerkUserId);

    if (!githubConnection) {
      throw new AppError(
        'GitHub connection is required',
        ErrorCode.GITHUB_CONNECTION_REQUIRED,
        401,
      );
    }

    const validConnection = await getValidInstallationToken(githubConnection);

    (res.locals as GitHubConnectionLocals).githubConnection = validConnection;
    next();
  } catch (error) {
    next(error);
  }
};
