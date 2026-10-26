import { RequestError } from '@octokit/request-error';
import { ErrorCode, type AnalyzedGithubRepository } from 'shared';

import { mapGitHubRepoToMetadata } from '../mappers/github.mapper';
import { AppError } from '../utils/AppError';
import {
  normalizeTreeEntries,
  splitRepositoryFullName,
  type GitHubTreeApiResponse,
} from '../utils/github-utils';
import { analyzeProjectStructure } from './github-analysis/project-structure/project-structure-analyzer';
import {
  fetchGithubRepos,
  fetchRepoFile,
  fetchRepositoryTree,
} from './github.service';
import { logger } from '../lib/logger';
import type {
  AnalyzeGithubRepositoriesInput,
  AnalyzeGithubRepositoriesOutput,
  CandidateFileContent,
  FetchRepoFileInput,
} from '../types/github';

// Result of analyzing one repository: the analysis, or just its ID when the
// repository's tree could not be fetched.
type RepositoryOutcome =
  | { ok: true; analysis: AnalyzedGithubRepository }
  | { ok: false; repoId: number };

/**
 * Analyzes the selected repositories and returns each one's metadata, structure
 * signals and candidate file contents. A repository missing from the installation
 * or whose tree GitHub rejects (404, 409, 422) goes to `failedRepoIds`; a 404 on a
 * candidate file gives null content. Any other GitHub failure rejects the whole call.
 */
export async function analyzeGithubRepositories({
  clerkUserId,
  accessToken,
  repoIds,
}: AnalyzeGithubRepositoriesInput): Promise<AnalyzeGithubRepositoriesOutput> {
  const repos = await fetchGithubRepos(accessToken);

  const selectedRepos = repos.filter((repo) => repoIds.includes(repo.id));

  // Some missing repos are reported in `failedRepoIds`, but with none left
  // there is nothing to analyze, so the request fails instead.
  if (selectedRepos.length === 0) {
    throw new AppError(
      'None of the selected repositories could be found. Please reselect your repositories and try again.',
      ErrorCode.BAD_REQUEST,
      400,
    );
  }

  const outcomes = await Promise.all(
    selectedRepos.map(async (repo): Promise<RepositoryOutcome> => {
      const repoFullName = repo.full_name;
      const { owner, repo: repoName } = splitRepositoryFullName(repoFullName);

      // Only the tree call is guarded, so a bug in the analysis below still
      // throws instead of being reported as a failed repository.
      let treeResponse: GitHubTreeApiResponse;
      try {
        treeResponse = await fetchRepositoryTree({
          accessToken,
          owner,
          repo: repoName,
          treeRef: repo.default_branch ?? 'HEAD',
        });
      } catch (err) {
        // 404 (access removed, default branch gone), 409 (empty repository) and
        // 422 are specific to this repository. Anything else affects every
        // repository or is not understood, so it is rethrown.
        if (err instanceof RequestError) {
          switch (err.status) {
            case 404:
            case 409:
            case 422:
              logger.warn(
                { err, owner, repo: repoName },
                'Skipping repository whose tree could not be fetched',
              );
              return { ok: false, repoId: repo.id };
          }
        }
        throw err;
      }

      const { tree, truncated } = treeResponse;
      const entries = normalizeTreeEntries(tree);
      const analysis = analyzeProjectStructure({
        repository: {
          id: repo.id,
          repositoryFullName: repo.full_name,
        },
        entries,
        isTruncated: truncated,
      });

      const {
        summary,
        detectedAreas,
        maturitySignals,
        architectureSignals,
        candidateFilesToInspect,
      } = analysis;

      const candidateFileContents = await Promise.all(
        candidateFilesToInspect.map(
          async (path): Promise<CandidateFileContent> => {
            const fetchInput: FetchRepoFileInput = {
              accessToken,
              owner,
              repo: repoName,
              path,
            };
              const content = await fetchRepoFile(fetchInput);
              return { path, content };
          },
        ),
      );

      return {
        ok: true,
        analysis: {
          repository: mapGitHubRepoToMetadata(repo),
          summary,
          detectedAreas,
          maturitySignals,
          architectureSignals,
          candidateFilesToInspect,
          candidateFileContents,
        },
      };
    }),
  );

  const summaries = outcomes.flatMap((outcome) =>
    outcome.ok ? [outcome.analysis] : [],
  );

  const missingRepoIds = repoIds.filter(
    (id) => !repos.some((repo) => repo.id === id),
  );
  const failedRepoIds = [
    ...missingRepoIds,
    ...outcomes.flatMap((outcome) => (outcome.ok ? [] : [outcome.repoId])),
  ];

  return { summaries, failedRepoIds };
}
