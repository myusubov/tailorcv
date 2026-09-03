import { ErrorCode, type GitHubRepo } from 'shared';

import { AppError } from '../utils/AppError';
import { fetchRepositoryTree } from './github-analysis/github-tree-fetcher';
import {
  normalizeTreeEntries,
  splitRepositoryFullName,
} from '../utils/github-utils';
import { analyzeProjectStructure } from './github-analysis/project-structure/project-structure-analyzer';
import { fetchGithubRepos } from './github.service';
import type {
  AnalyzeGithubRepositoriesInput,
  AnalyzeGithubRepositoriesOutput,
} from '../types/github';

/**
 * Runs the temporary GitHub project-structure analysis flow for selected repositories.
 * It fetches each repository's tree, analyzes project structure, and returns each
 * repository's summary and detected areas for manual testing.
 */
export async function analyzeGithubRepositories({
  clerkUserId,
  accessToken,
  repoIds,
}: AnalyzeGithubRepositoriesInput) {
  const { repositories: repos } = await fetchGithubRepos(accessToken);

  const selectedRepos = repos.filter((repo) => repoIds.includes(repo.id));

  if (selectedRepos.length !== repoIds.length) {
    throw new AppError(
      'One or more selected repositories were not found',
      ErrorCode.BAD_REQUEST,
      400,
    );
  }

  const summaries = await Promise.all(
    selectedRepos.map(async (repo) => {
      const repoFullName = repo.full_name;
      const { owner, repo: repoName } = splitRepositoryFullName(repoFullName);
      const { tree, truncated } = await fetchRepositoryTree({
        accessToken,
        owner,
        repo: repoName,
        treeRef: repo.default_branch ?? 'HEAD',
      });
      const entries = normalizeTreeEntries({ entries: tree });
      const analysis = analyzeProjectStructure({
        repository: {
          id: repo.id,
          repositoryFullName: repo.full_name,
        },
        entries,
        isTruncated: truncated,
      });

      const { summary, detectedAreas } = analysis;

      return { summary, detectedAreas };
    }),
  );

  return summaries;
}
