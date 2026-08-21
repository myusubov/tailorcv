import type { GitHubConnection, GitHubConnectionResponse } from 'shared';

/**
 * Maps the stored GitHub connection model to the client-safe API response DTO.
 *
 * This mapper intentionally allowlists fields so OAuth tokens and internal
 * backend-only identifiers cannot leak into browser responses.
 */
export function mapGitHubConnectionToResponse({
  githubConnection,
}: {
  githubConnection: GitHubConnection;
}): GitHubConnectionResponse {
  return {
    id: githubConnection.id,
    createdAt: githubConnection.createdAt,
    updatedAt: githubConnection.updatedAt,
  };
}
