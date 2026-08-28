import type { Request, Response, NextFunction } from 'express';
import { analyzeGithubRepositories } from '../services/github-analysis.service';
import {
  createInstallationAccessToken,
  exchangeCodeForToken,
  fetchGithubRepos,
  getGithubAuthUrl,
  getGithubConnection,
  getGitHubUser,
  saveGitHubConnection,
  verifyGithubUserCanAccessInstallation,
  verifyOAuthState,
} from '../services/github.service';
import { mapGitHubConnectionToResponse } from '../mappers/github.mapper';
import type { ClerkLocals, GitHubConnectionLocals } from '../types/locals';
import type { AnalyzeGithubReposRequestBody } from '../schemas/github.schema';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import { successResponse } from '../utils/response';
import { logger } from '../lib/logger';

/**
 * Returns the GitHub App installation URL for the client to redirect to.
 * A JSON response (instead of a server-side redirect) lets the frontend
 * surface connection-precondition failures as a normal error, not a raw page.
 */
export async function initiateGithubAuth(
  req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) {
  try {
    const { clerkUserId } = res.locals;
    const authUrl = await getGithubAuthUrl(clerkUserId);
    return successResponse(res, { authUrl }, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * Completes the combined GitHub App installation and user-authorization callback.
 *
 * Inputs arrive through GitHub callback query parameters and the authenticated
 * Clerk user in response locals. The handler consumes the single-use state,
 * verifies that the GitHub user can access the supplied installation, creates
 * and persists an installation token, and redirects to onboarding. Failures are
 * logged internally without exposing provider details in the browser redirect.
 */
export async function handleGithubCallback(
  req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) {
  try {
    const { installation_id, state, code } = req.query;
    const { clerkUserId } = res.locals;

    if (
      typeof code !== 'string' ||
      typeof state !== 'string' ||
      typeof installation_id !== 'string'
    ) {
      throw new AppError('Invalid GitHub callback', ErrorCode.BAD_REQUEST, 400);
    }
    // Verify the OAuth state to prevent CSRF attacks
    await verifyOAuthState(state as string, clerkUserId);

    const userAccessToken = await exchangeCodeForToken(code);

    await verifyGithubUserCanAccessInstallation({
      userAccessToken: userAccessToken.access_token,
      installationId: installation_id as string,
    });

    const { token, expires_at } = await createInstallationAccessToken(
      installation_id as string,
    );

    await saveGitHubConnection({
      userId: clerkUserId,
      installationAccessToken: token,
      installationAccessTokenExpiresAt: new Date(expires_at),
      installationId: installation_id as string,
    });

    res.redirect(
      `${env.FRONTEND_URL}/onboarding?method=github&status=connected`,
    );
  } catch (error: unknown) {
    logger.error({ err: error }, 'GitHub App callback failed');
    res.redirect(`${env.FRONTEND_URL}/onboarding?method=github&status=error`);
  }
}

export async function getGithubRepos(
  req: Request,
  res: Response<any, GitHubConnectionLocals>,
  next: NextFunction,
) {
  try {
    const { githubConnection } = res.locals;
    const repos = await fetchGithubRepos(
      githubConnection.installationAccessToken,
    );
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
      accessToken: githubConnection.installationAccessToken,
      repoIds,
    });
    return successResponse(res, { result }, 200);
  } catch (error) {
    next(error);
  }
}
