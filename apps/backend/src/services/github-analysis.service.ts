import { ErrorCode, type GitHubRepo } from 'shared';

import { logger } from '../lib/logger';
import { AppError } from '../utils/AppError';
import { fetchRepositoryTree } from './github-analysis/github-tree-fetcher';
import {
  normalizeTreeEntries,
  splitRepositoryFullName,
} from '../utils/github-utils';
import { analyzeProjectStructure } from './github-analysis/project-structure/project-structure-analyzer';
import { fetchGithubRepos, getGithubConnection } from './github.service';
import type {
  AnalyzeGithubRepositoriesInput,
  AnalyzeGithubRepositoriesOutput,
} from '../types/github';

interface GitHubRepoForAnalysis extends GitHubRepo {
  default_branch?: string;
}

/**
 * Runs the temporary GitHub project-structure analysis flow for selected repositories.
 * It fetches each repository tree, logs the summary, and returns summaries for manual testing.
 */
export async function analyzeGithubRepositories({
  clerkUserId,
  repoIds,
}: AnalyzeGithubRepositoriesInput): Promise<AnalyzeGithubRepositoriesOutput> {
  if (repoIds.length === 0 || repoIds.length > 3) {
    throw new AppError(
      'Select between 1 and 3 repositories to analyze',
      ErrorCode.BAD_REQUEST,
      400,
    );
  }

  const githubConnection = await getGithubConnection(clerkUserId);
  const repos = (await fetchGithubRepos(
    githubConnection!.accessToken,
  )) as GitHubRepoForAnalysis[];
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
      const { owner, repo: repoName } = splitRepositoryFullName({
        repositoryFullName: repo.full_name,
      });
      const tree = await fetchRepositoryTree({
        accessToken: githubConnection!.accessToken,
        owner,
        repo: repoName,
        treeRef: repo.default_branch ?? 'HEAD',
      });
      const entries = normalizeTreeEntries({ entries: tree.tree });
      const analysis = analyzeProjectStructure({
        repository: {
          id: repo.id,
          repositoryFullName: repo.full_name,
        },
        entries,
        isTruncated: tree.truncated,
      });

      logger.info(
        {
          clerkUserId,
          repositoryId: repo.id,
          repositoryFullName: repo.full_name,
          summary: analysis.summary,
        },
        'GitHub project structure summary',
      );

      return {
        repositoryId: repo.id,
        repositoryFullName: repo.full_name,
        ...analysis.summary,
      };
    }),
  );

  return { summaries };
}
