import { prisma } from '../lib';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import jwt from 'jsonwebtoken';
import {
  ErrorCode,
  GitHubTokenResponse,
  GitHubUser,
  SaveGitHubConnectionInput,
  GitHubTokenErrorResponse,
  GitHubRepo,
  GitHubConnection,
} from 'shared';
import {
  FetchGithubCommitsInput,
  FetchGithubPullRequestsInput,
  FetchRepoFileInput,
  GitHubCommit,
  GitHubPullRequest,
  DetectRepoTechStackInput,
} from '../types/github';

/**
 * Generates the GitHub OAuth authorization URL
 * Scopes:
 * - repo: For deep extraction (commits, PRs, package.json)
 * - read:user: For profile mapping
 */
export function getGithubAuthUrl(userId: string): string {
  // Generate a signed JWT as the state parameter for CSRF protection
  const state = jwt.sign(
    {
      userId,
      timestamp: Date.now(),
      purpose: 'github_oauth',
    },
    env.JWT_SECRET,
    { expiresIn: '10m' }, // State expires in 10 minutes
  );

  const rootUrl = 'https://github.com/login/oauth/authorize';
  const options = {
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_REDIRECT_URI,
    scope: 'repo read:user',
    state,
  };

  const queryString = new URLSearchParams(options).toString();
  const fullUrl = `${rootUrl}?${queryString}`;

  return fullUrl;
}

/**
 * Verifies the OAuth state parameter to prevent CSRF attacks
 * @param state - The state JWT from GitHub callback
 * @param expectedUserId - The user ID that should match the state
 * @throws AppError if state is invalid or expired
 */
export function verifyOAuthState(state: string, expectedUserId: string): void {
  try {
    const decoded = jwt.verify(state, env.JWT_SECRET) as {
      userId: string;
      timestamp: number;
      purpose: string;
    };

    // Verify the purpose matches
    if (decoded.purpose !== 'github_oauth') {
      throw new AppError('Invalid state purpose', ErrorCode.UNAUTHORIZED, 401);
    }

    // Verify the userId matches the authenticated user
    if (decoded.userId !== expectedUserId) {
      throw new AppError(
        'State userId mismatch - possible CSRF attack',
        ErrorCode.UNAUTHORIZED,
        401,
      );
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(
        'OAuth state expired - please try again',
        ErrorCode.UNAUTHORIZED,
        401,
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(
        'Invalid OAuth state - possible CSRF attack',
        ErrorCode.UNAUTHORIZED,
        401,
      );
    }
    throw error;
  }
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
 * Fetches a specific file from a GitHub repository
 * Useful for detecting tech stack (package.json, requirements.txt, etc.)
 * @param input - Access token, owner, repo name, and file path
 * @returns File content as string, or null if not found
 */
export async function fetchRepoFile(
  input: FetchRepoFileInput,
): Promise<string | null> {
  const { accessToken, owner, repo, path } = input;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );

  // File not found is expected for some tech stack files
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new AppError(
      `Failed to fetch GitHub file: ${response.statusText}`,
      ErrorCode.GITHUB_FILE_FETCH_FAILED,
      502,
    );
  }

  const data = (await response.json()) as { content: string; encoding: string };

  // GitHub returns base64-encoded content
  if (data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  return data.content;
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

  if (!response.ok) return null;
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
