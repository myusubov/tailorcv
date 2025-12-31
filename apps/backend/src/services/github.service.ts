import { prisma } from 'src/lib';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import {
  ErrorCode,
  GitHubTokenResponse,
  GitHubUser,
  SaveGitHubConnectionInput,
  GitHubTokenErrorResponse,
  GitHubRepo,
  GitHubConnection,
} from 'shared';

/**
 * Generates the GitHub OAuth authorization URL
 * Scopes:
 * - repo: For deep extraction (commits, PRs, package.json)
 * - read:user: For profile mapping
 */
export function getGithubAuthUrl(): string {
  const rootUrl = 'https://github.com/login/oauth/authorize';
  const options = {
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_REDIRECT_URI,
    scope: 'repo read:user',
    state: 'github_initial_connection', // In production, this should be a generated nonce
  };

  const queryString = new URLSearchParams(options).toString();
  return `${rootUrl}?${queryString}`;
}

/**
 * Exchanges the temporary authorization code for a permanent access token.
 * Endpoint: POST https://github.com/login/oauth/access_token
 */
export async function exchangeCodeForToken(
  code: string,
): Promise<GitHubTokenResponse> {
  // UNCOMMENT THE LINE BELOW TO TEST FRONTEND ERROR TOASTS
  /*    throw new AppError(
    `GitHub token exchange failed`,
    ErrorCode.GITHUB_TOKEN_EXCHANGE_FAILED,
    502
  ); */

  const tokenUrl = 'https://github.com/login/oauth/access_token';

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    client_secret: env.GITHUB_CLIENT_SECRET,
    code,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new AppError(
      `GitHub token exchange failed: ${response.statusText}`,
      ErrorCode.GITHUB_TOKEN_EXCHANGE_FAILED,
      502,
    );
  }

  const data = (await response.json()) as GitHubTokenErrorResponse;

  if (data.error) {
    throw new AppError(
      data.error_description || data.error,
      ErrorCode.GITHUB_OAUTH_ERROR,
      400,
    );
  }

  return {
    access_token: data.access_token!,
    scope: data.scope!,
    token_type: data.token_type!,
  };
}

/**
 * Fetches the authenticated user's GitHub profile.
 * Endpoint: GET https://api.github.com/user
 */
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  /*   throw new AppError(
    `Failed to fetch GitHub user`,
    ErrorCode.GITHUB_USER_FETCH_FAILED,
    502
  ); */
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new AppError(
      `Failed to fetch GitHub user: ${response.statusText}`,
      ErrorCode.GITHUB_USER_FETCH_FAILED,
      502,
    );
  }

  return response.json() as Promise<GitHubUser>;
}

export async function saveGitHubConnection(input: SaveGitHubConnectionInput) {
  /*   throw new AppError(
    `Failed to save GitHub connection`,
    ErrorCode.GITHUB_CONNECTION_SAVE_FAILED,
    502
  ); */
  const {
    userId,
    accessToken,
    githubUserId,
    githubUsername,
    githubAvatarUrl,
    scope,
  } = input;

  return await prisma.gitHubConnection.upsert({
    where: { userId },
    update: {
      accessToken,
      githubUserId,
      githubUsername,
      githubAvatarUrl,
      scopes: scope,
    },
    create: {
      userId,
      accessToken,
      githubUserId,
      githubUsername,
      githubAvatarUrl,
      scopes: scope,
    },
  });
}

export async function fetchGithubRepos(
  accessToken: string,
): Promise<GitHubRepo[]> {
  const response = await fetch(
    'https://api.github.com/user/repos?sort=updated&visibility=all',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!response.ok) {
    throw new AppError(
      `Failed to fetch GitHub repos: ${response.statusText}`,
      ErrorCode.GITHUB_REPOS_FETCH_FAILED,
      502,
    );
  }

  return response.json() as Promise<GitHubRepo[]>;
}

export async function getGithubConnection(
  userId: string,
): Promise<GitHubConnection | null> {
  /*   throw new AppError(
    `Failed to fetch GitHub connection`,
    ErrorCode.GITHUB_CONNECTION_FETCH_FAILED,
    502
  ); */
  const githubConnection = await prisma.gitHubConnection.findUnique({
    where: { userId },
  });
  if (!githubConnection) {
    throw new AppError(
      `Failed to fetch GitHub connection`,
      ErrorCode.GITHUB_CONNECTION_FETCH_FAILED,
      502,
    );
  }
  return githubConnection;
}
