import { env } from '../config/env';

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
    redirect_uri: `http://localhost:${env.PORT}/api/v1/auth/github/callback`,
    scope: 'repo read:user',
    state: 'github_initial_connection', // In production, this should be a generated nonce
  };

  const queryString = new URLSearchParams(options).toString();
  return `${rootUrl}?${queryString}`;
}

/**
 * Scaffold for exchanging the temporary code for an access token.
 * To be implemented in the next phase.
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  // TODO: Implement OAuth token exchange
  console.log('Exchanging code for token:', code);
  return 'scaffold_token';
}
