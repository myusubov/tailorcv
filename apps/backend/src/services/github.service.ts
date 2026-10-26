import { logger, prisma } from '../lib';
import { env } from '../config/env';
import { createOctokit } from '../lib/octokit';
import { AppError } from '../utils/AppError';
import type { GitHubTreeApiResponse } from '../utils/github-utils';
import {
  ErrorCode,
  GitHubTokenResponse,
  GitHubUser,
  SaveGitHubConnectionInput,
  GitHubTokenErrorResponse,
  GitHubRepo,
  GitHubConnection,
  CreateInstallationAccessTokenResponse,
} from 'shared';
import {
  FetchGithubCommitsInput,
  FetchGithubPullRequestsInput,
  FetchRepoFileInput,
  FetchRepositoryTreeInput,
  GitHubCommit,
  GitHubPullRequest,
  DetectRepoTechStackInput,
  VerifyGithubUserCanAccessInstallationInput,
} from '../types/github';
import { randomBytes } from 'node:crypto';
import { redisClient } from '../lib/redis';
import jwt from 'jsonwebtoken';
import { RequestError } from '@octokit/request-error';

/**
 * Generates the GitHub OAuth authorization URL
 * Scopes:
 * - repo: For deep extraction (commits, PRs, package.json)
 * - read:user: For profile mapping
 */
export async function getGithubAuthUrl(userId: string): Promise<string> {
  const state = randomBytes(32).toString('base64url');

  await redisClient.set(`github_oauth_state:${state}`, userId, 'EX', 900); // Expires in 15 minutes

  const url = new URL(
    `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`,
  );

  url.searchParams.set('state', state);

  return url.toString();
}

/**
 * Verifies the OAuth state parameter to prevent CSRF attacks.
 * Atomically retrieves and deletes the state key from Redis.
 *
 * @param state - The state string from GitHub callback
 * @param expectedUserId - The Clerk user ID that should match the state
 * @throws AppError if state is missing, expired, or user ID does not match
 */
export async function verifyOAuthState(
  state: string,
  expectedUserId: string,
): Promise<void> {
  const storedUserId = await redisClient.getdel(`github_oauth_state:${state}`);

  if (!storedUserId) {
    throw new AppError(
      'OAuth state expired or invalid - please try again',
      ErrorCode.UNAUTHORIZED,
      401,
    );
  }

  if (storedUserId !== expectedUserId) {
    throw new AppError(
      'State userId mismatch - possible CSRF attack',
      ErrorCode.UNAUTHORIZED,
      401,
    );
  }
}

/**
 * Exchanges the temporary authorization code for a permanent access token.
 * Endpoint: POST https://github.com/login/oauth/access_token
 */
export async function exchangeCodeForToken(
  code: string,
): Promise<GitHubTokenResponse> {
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

  if (!data.access_token) {
    throw new AppError(
      'GitHub token exchange returned no access token',
      ErrorCode.INVALID_RESPONSE,
      502,
    );
  }

  return {
    access_token: data.access_token,
    scope: data.scope ?? '',
    token_type: data.token_type ?? 'bearer',
  };
}

export async function verifyGithubUserCanAccessInstallation({
  userAccessToken,
  installationId,
}: VerifyGithubUserCanAccessInstallationInput): Promise<void> {
  const response = await fetch(
    `https://api.github.com/user/installations/${installationId}/repositories?per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
    },
  );

  if (response.status === 403 || response.status === 404) {
    throw new AppError(
      'GitHub installation does not belong to this user',
      ErrorCode.UNAUTHORIZED,
      401,
    );
  }

  if (!response.ok) {
    throw new AppError(
      'Could not verify GitHub installation',
      ErrorCode.GITHUB_OAUTH_ERROR,
      502,
    );
  }
}

// GitHub rejects an App JWT whose `exp` is more than 10 minutes ahead of
// *its* clock. Stay well under that cap so local clock drift can't push the
// token over it. The JWT is used immediately, so a shorter life costs nothing.
const JWT_IAT_BACKDATE_SECONDS = 60; // GitHub's recommended drift guard for iat
const JWT_LIFETIME_SECONDS = 540;

/**
 * Signs a fresh App-level JWT for GitHub App requests, such as an installation
 * lookup or token request.
 */
function signGithubAppJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: env.GITHUB_APP_ID,
      iat: now - JWT_IAT_BACKDATE_SECONDS,
      exp: now + JWT_LIFETIME_SECONDS,
    },
    env.GITHUB_APP_PRIVATE_KEY,
    {
      algorithm: 'RS256',
    },
  );
}

/**
 * Creates a short-lived installation token for the selected GitHub App installation.
 * GitHub failures are thrown as Octokit errors and translated by the error middleware.
 */
export async function createInstallationAccessToken(
  installationId: string,
): Promise<CreateInstallationAccessTokenResponse> {
  // The client sends a JWT-shaped token as a bearer token, so the app JWT
  // authenticates this call.
  const { data } = await createOctokit(
    signGithubAppJwt(),
  ).rest.apps.createInstallationAccessToken({
    installation_id: Number(installationId),
  });

  if (typeof data.token !== 'string' || data.token.length === 0) {
    throw new AppError(
      'GitHub returned an invalid installation access token',
      ErrorCode.INVALID_RESPONSE,
      502,
    );
  }

  return data;
}

/**
 * Returns the connection with an installation token valid for more than five minutes,
 * refreshing and persisting a new token when needed.
 * Throws `GITHUB_APP_SUSPENDED` when a refresh finds the installation suspended.
 */
export async function getValidInstallationToken(
  githubConnection: GitHubConnection,
): Promise<GitHubConnection> {
  const now = new Date();
  const tokenExpiresAt = new Date(
    githubConnection.installationAccessTokenExpiresAt,
  );

  if (Number.isNaN(tokenExpiresAt.getTime())) {
    throw new AppError(
      'Invalid GitHub token expiration date',
      ErrorCode.INVALID_RESPONSE,
      500,
    );
  }

  // 5 minute buffer to account for clock skew and network latency
  const refreshBufferMs = 5 * 60 * 1000;
  const shouldRefresh =
    tokenExpiresAt.getTime() - now.getTime() <= refreshBufferMs;

  if (shouldRefresh) {
    const { data: installation } = await createOctokit(
      signGithubAppJwt(),
    ).rest.apps.getInstallation({
      installation_id: Number(githubConnection.installationId),
    });

    if (installation.suspended_at) {
      throw new AppError(
        'The GitHub app installation is suspended',
        ErrorCode.GITHUB_APP_SUSPENDED,
        403,
      );
    }

    const { expires_at, token } = await createInstallationAccessToken(
      githubConnection.installationId,
    );
    githubConnection.installationAccessToken = token;
    githubConnection.installationAccessTokenExpiresAt = new Date(expires_at);

    await prisma.gitHubConnection.update({
      where: { userId: githubConnection.userId },
      data: {
        installationAccessToken: githubConnection.installationAccessToken,
        installationAccessTokenExpiresAt:
          githubConnection.installationAccessTokenExpiresAt,
      },
    });
  }

  return githubConnection;
}

/**
 * Fetches the authenticated user's GitHub profile.
 * Endpoint: GET https://api.github.com/user
 */
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
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
  const {
    userId,
    installationAccessToken,
    installationAccessTokenExpiresAt,
    installationId,
  } = input;

  return await prisma.gitHubConnection.upsert({
    where: { userId },
    update: {
      installationAccessToken,
      installationAccessTokenExpiresAt,
      installationId,
    },
    create: {
      userId,
      installationAccessToken,
      installationAccessTokenExpiresAt,
      installationId,
    },
  });
}

/**
 * Returns the first 100 repositories the installation can access.
 * Pagination is deferred, so repositories beyond the first page are not listed.
 */
export async function fetchGithubRepos(accessToken: string) {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });

  return data.repositories;
}

/**
 * Fetches a repository's recursive Git tree from GitHub.
 * This returns paths and metadata only; it does not fetch file contents.
 */
export async function fetchRepositoryTree({
  accessToken,
  owner,
  repo,
  treeRef,
}: FetchRepositoryTreeInput): Promise<GitHubTreeApiResponse> {
  const octokit = createOctokit(accessToken);
  return (
    await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: treeRef,
      recursive: '1',
    })
  ).data as GitHubTreeApiResponse;
}

export async function getGithubConnection(
  userId: string,
): Promise<GitHubConnection | null> {
  return await prisma.gitHubConnection.findUnique({
    where: { userId },
  });
}

/**
 * Fetches commits from a GitHub repository
 * @param input - Access token, owner, repo name, and optional limit
 * @returns Array of commits with author, message, and metadata
 */
export async function fetchRepoCommits(
  input: FetchGithubCommitsInput,
): Promise<GitHubCommit[]> {
  const { accessToken, owner, repo, limit = 100 } = input;
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );
  if (!response.ok) {
    throw new AppError(
      `Failed to fetch GitHub commits: ${response.statusText}`,
      ErrorCode.GITHUB_COMMITS_FETCH_FAILED,
      502,
    );
  }

  return (await response.json()) as GitHubCommit[];
}

/**
 * Fetches pull requests from a GitHub repository
 * @param input - Access token, owner, repo name, and optional limit
 * @returns Array of PRs with title, body, status, and metadata
 */
export async function fetchRepoPullRequests(
  input: FetchGithubPullRequestsInput,
): Promise<GitHubPullRequest[]> {
  const { accessToken, owner, repo, limit = 50 } = input;
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?per_page=${limit}&state=all`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );
  if (!response.ok) {
    throw new AppError(
      `Failed to fetch GitHub pull requests: ${response.statusText}`,
      ErrorCode.GITHUB_PULL_REQUESTS_FETCH_FAILED,
      502,
    );
  }

  return (await response.json()) as GitHubPullRequest[];
}

/**
 * Returns the raw text of a repository file.
 * Returns null for a 404 and when GitHub answers with something other than file text,
 * such as a directory. Any other GitHub failure is rethrown as Octokit's `RequestError`.
 */
export async function fetchRepoFile(
  input: FetchRepoFileInput,
): Promise<string | null> {
  const octokit = createOctokit(input.accessToken);

  try {
    const response = await octokit.rest.repos.getContent({
      owner: input.owner,
      repo: input.repo,
      path: input.path,
      mediaType: {
        format: 'raw',
      },
    });
    return typeof response.data === 'string' ? response.data : null;
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetches the README content for a repository
 * Uses the efficient /readme endpoint which handles finding the correct file
 * @param input - Access token, owner, and repo name
 * @returns Decoded README content or null if not found
 */
export async function fetchRepoReadme(input: {
  accessToken: string;
  owner: string;
  repo: string;
}): Promise<string | null> {
  const { accessToken, owner, repo } = input;
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.raw', // Request raw content directly
      },
    },
  );
  // No readme is normal
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new AppError(
      `Failed to fetch GitHub readme: ${response.statusText}`,
      ErrorCode.GITHUB_FILE_FETCH_FAILED,
      502,
    );
  }

  return await response.text();
}

/**
 * Detects tech stack from a repository by analyzing config files
 * @param input - Access token, owner, and repo name
 * @returns Array of detected technologies
 */
export async function detectRepoTechStack(
  input: DetectRepoTechStackInput,
): Promise<string[]> {
  const { accessToken, owner, repo } = input;
  const techStack: string[] = [];

  try {
    // Try package.json (Node.js/JavaScript)
    const packageJson = await fetchRepoFile({
      accessToken,
      owner,
      repo,
      path: 'package.json',
    });
    if (packageJson) {
      try {
        const parsed = JSON.parse(packageJson);
        const deps = { ...parsed.dependencies, ...parsed.devDependencies };

        if (deps.react) techStack.push('React');
        if (deps.next) techStack.push('Next.js');
        if (deps.vue) techStack.push('Vue');
        if (deps.angular) techStack.push('Angular');
        if (deps.express) techStack.push('Express');
        if (deps.nestjs || deps['@nestjs/core']) techStack.push('NestJS');
        if (deps.typescript) techStack.push('TypeScript');
        if (deps.tailwindcss) techStack.push('Tailwind CSS');
        if (deps.prisma || deps['@prisma/client']) techStack.push('Prisma');
        if (deps.graphql) techStack.push('GraphQL');
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Try requirements.txt (Python)
    const requirementsTxt = await fetchRepoFile({
      accessToken,
      owner,
      repo,
      path: 'requirements.txt',
    });
    if (requirementsTxt) {
      techStack.push('Python');
      if (requirementsTxt.toLowerCase().includes('django'))
        techStack.push('Django');
      if (requirementsTxt.toLowerCase().includes('flask'))
        techStack.push('Flask');
      if (requirementsTxt.toLowerCase().includes('fastapi'))
        techStack.push('FastAPI');
    }

    // Try Gemfile (Ruby)
    const gemfile = await fetchRepoFile({
      accessToken,
      owner,
      repo,
      path: 'Gemfile',
    });
    if (gemfile) {
      techStack.push('Ruby');
      if (gemfile.includes('rails')) techStack.push('Rails');
    }

    // Try go.mod (Go)
    const goMod = await fetchRepoFile({
      accessToken,
      owner,
      repo,
      path: 'go.mod',
    });
    if (goMod) {
      techStack.push('Go');
    }

    // Try Cargo.toml (Rust)
    const cargoToml = await fetchRepoFile({
      accessToken,
      owner,
      repo,
      path: 'Cargo.toml',
    });
    if (cargoToml) {
      techStack.push('Rust');
    }

    // Try pom.xml or build.gradle (Java)
    const pomXml = await fetchRepoFile({
      accessToken,
      owner,
      repo,
      path: 'pom.xml',
    });
    const buildGradle = await fetchRepoFile({
      accessToken,
      owner,
      repo,
      path: 'build.gradle',
    });
    if (pomXml || buildGradle) {
      techStack.push('Java');
      if (pomXml?.includes('spring')) techStack.push('Spring');
    }

    // Try composer.json (PHP)
    const composerJson = await fetchRepoFile({
      accessToken,
      owner,
      repo,
      path: 'composer.json',
    });
    if (composerJson) {
      techStack.push('PHP');
      if (composerJson.includes('laravel')) techStack.push('Laravel');
    }
  } catch (error) {
    // If any error occurs, return what we have so far
    console.error('Error detecting tech stack:', error);
  }

  // Remove duplicates and return
  return [...new Set(techStack)];
}
