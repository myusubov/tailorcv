import type { Request, Response, NextFunction } from 'express';
import { analyzeGithubRepositories } from '../services/github-analysis.service';
import {
  exchangeCodeForToken,
  fetchGithubRepos,
  getGithubAuthUrl,
  getGithubConnection,
  getGitHubUser,
  saveGitHubConnection,
  verifyOAuthState,
} from '../services/github.service';
import { mapGitHubConnectionToResponse } from '../mappers/github.mapper';
import type { ClerkLocals, GitHubConnectionLocals } from '../types/locals';
import type { AnalyzeGithubReposRequestBody } from '../schemas/github.schema';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import { successResponse } from '../utils/response';
import { handleResilienceError } from '../lib/resilience';

/**
 * Initiates the GitHub OAuth flow by redirecting to GitHub
 */
export async function initiateGithubAuth(
  req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) {
  try {
    const { clerkUserId } = res.locals;
    const authUrl = getGithubAuthUrl(clerkUserId);
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
    const { code, state } = req.query;
    const { clerkUserId } = res.locals;

    if (!code || !state) {
      throw new AppError(
        'Missing authorization code or state',
        ErrorCode.BAD_REQUEST,
        400,
      );
    }

    // Verify the OAuth state to prevent CSRF attacks
    verifyOAuthState(state as string, clerkUserId);

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
  } catch (error: unknown) {
    const appError =
      error instanceof AppError
        ? error
        : handleResilienceError(error, 'GitHub');
    console.error('GitHub Callback Error:', error); // Log the real error
    const errorMessage = appError.errorCode.toLowerCase(); // Use the standardized error code
    res.redirect(
      `${env.FRONTEND_URL}/onboarding?method=github&status=error&message=${encodeURIComponent(errorMessage)}`,
    );
  }
}

export async function getGithubRepos(
  req: Request,
  res: Response<any, GitHubConnectionLocals>,
  next: NextFunction,
) {
  try {
    const { githubConnection } = res.locals;
    const repos = await fetchGithubRepos(githubConnection.accessToken);
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
    return successResponse(
      res,
      githubConnection
        ? mapGitHubConnectionToResponse({ githubConnection })
        : null,
      200,
    );
  } catch (error) {
    next(error);
  }
}

export async function analyzeGithubRepos(
  req: Request<unknown, unknown, AnalyzeGithubReposRequestBody>,
  res: Response<unknown, GitHubConnectionLocals>,
  next: NextFunction,
) {
  try {
    const { clerkUserId, githubConnection } = res.locals;
    const { repoIds } = req.body;
    const result = await analyzeGithubRepositories({
      clerkUserId,
      accessToken: githubConnection.accessToken,
      repoIds,
    });
    return successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}
