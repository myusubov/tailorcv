import { ErrorCode } from 'shared';

import { githubApiPolicy } from '../../lib/resilience';
import { AppError } from '../../utils/AppError';
import type { GitHubTreeApiResponse } from '../../utils/github-utils';

/**
 * Fetches a repository's recursive Git tree from GitHub.
 * This returns paths and metadata only; it does not fetch file contents.
 */
export async function fetchRepositoryTree({
  accessToken,
  owner,
  repo,
  treeRef,
}: {
  accessToken: string;
  owner: string;
  repo: string;
  treeRef: string;
}): Promise<GitHubTreeApiResponse> {
  const response = await githubApiPolicy.execute(async () => {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeRef}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!res.ok) {
      throw new AppError(
        `Failed to fetch GitHub repository tree: ${res.statusText}`,
        ErrorCode.GITHUB_FILE_FETCH_FAILED,
        502,
      );
    }

    return res;
  });

  return (await response.json()) as GitHubTreeApiResponse;
}
