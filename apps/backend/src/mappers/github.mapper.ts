import type {
  GitHubConnection,
  GitHubConnectionResponse,
  GitHubRepo,
} from 'shared';

import type { GithubRepositoryMetadata } from '../types/github';

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

/**
 * Maps a GitHub repository listing item to the metadata the analysis response
 * carries beside the path-only analyzer output.
 *
 * `topics` is optional in the GitHub payload, so it defaults to an empty list.
 */
export function mapGitHubRepoToMetadata(
  repo: GitHubRepo,
): GithubRepositoryMetadata {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    htmlUrl: repo.html_url,
    topics: repo.topics ?? [],
    isFork: repo.fork,
    language: repo.language,
  };
}
