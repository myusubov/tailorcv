import type { Request, Response, NextFunction } from 'express';
import {
  exchangeCodeForToken,
  fetchGithubRepos,
  getGithubAuthUrl,
  getGithubConnection,
  getGitHubUser,
  saveGitHubConnection,
} from '../services/github.service';
import { ClerkLocals } from 'src/types/locals';
import { env } from 'src/config/env';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import { successResponse } from 'src/utils/response';

/**
 * Initiates the GitHub OAuth flow by redirecting to GitHub
 */
export async function initiateGithubAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authUrl = getGithubAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the callback from GitHub after authorization
 */
export async function handleGithubCallback(
  req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) {
  try {
    // TODO: Verify state
    const { code, state } = req.query;
    const { clerkUserId } = res.locals;

    if (!code) {
      throw new AppError(
        'Missing authorization code',
        ErrorCode.BAD_REQUEST,
        400,
      );
    }

    const tokenResponse = await exchangeCodeForToken(code as string);
    const githubUser = await getGitHubUser(tokenResponse.access_token);
    await saveGitHubConnection({
      userId: clerkUserId,
      accessToken: tokenResponse.access_token,
      githubUserId: githubUser.id,
      githubUsername: githubUser.login,
      githubAvatarUrl: githubUser.avatar_url,
      scope: tokenResponse.scope,
    });

    res.redirect(
      `${env.FRONTEND_URL}/onboarding?method=github&status=connected`,
    );
  } catch (error: any) {
    const errorMessage = error.message || 'connection_failed';
    res.redirect(
      `${env.FRONTEND_URL}/onboarding?method=github&status=error&message=${encodeURIComponent(errorMessage)}`,
    );
  }
}

export async function getGithubRepos(
  req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) {
  try {
    const { clerkUserId } = res.locals;
    const githubConnection = await getGithubConnection(clerkUserId);
    const repos = await fetchGithubRepos(githubConnection!.accessToken);
    return successResponse(res, repos, 200);
  } catch (error) {
    next(error);
  }
}

export async function fetchGithubConnection(
  req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) {
  try {
    const { clerkUserId } = res.locals;
    const githubConnection = await getGithubConnection(clerkUserId);
    return successResponse(res, githubConnection, 200);
  } catch (error) {
    next(error);
  }
}
