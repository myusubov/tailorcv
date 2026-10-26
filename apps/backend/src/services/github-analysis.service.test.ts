import { RequestError } from '@octokit/request-error';
import { ErrorCode } from 'shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The analyzer and the GitHub calls are replaced so these tests cover only how
// the service reacts to GitHub failures, not what the analyzer detects.
vi.mock('./github.service', () => ({
  fetchGithubRepos: vi.fn(),
  fetchRepoFile: vi.fn(),
  fetchRepositoryTree: vi.fn(),
}));
vi.mock('./github-analysis/project-structure/project-structure-analyzer', () => ({
  analyzeProjectStructure: vi.fn(),
}));
vi.mock('../lib/logger', () => ({ logger: { warn: vi.fn() } }));

import { analyzeProjectStructure } from './github-analysis/project-structure/project-structure-analyzer';
import { analyzeGithubRepositories } from './github-analysis.service';
import {
  fetchGithubRepos,
  fetchRepoFile,
  fetchRepositoryTree,
} from './github.service';

type InstallationRepo = Awaited<ReturnType<typeof fetchGithubRepos>>[number];
type Analysis = ReturnType<typeof analyzeProjectStructure>;

function createRepo({ id, name }: { id: number; name: string }) {
  return {
    id,
    name,
    full_name: `acme/${name}`,
    default_branch: 'main',
    description: null,
    html_url: `https://github.com/acme/${name}`,
    topics: [],
    fork: false,
    language: null,
  } as unknown as InstallationRepo;
}

function createRequestError(status: number): RequestError {
  const url = 'https://api.github.com/repos/acme/api/git/trees/main';
  return new RequestError('GitHub said no', status, {
    request: { method: 'GET', url, headers: {} },
    response: { status, url, headers: {}, data: {} },
  });
}

function createAnalysis(candidateFilesToInspect: string[]): Analysis {
  return {
    summary: {},
    detectedAreas: [],
    maturitySignals: {},
    architectureSignals: [],
    candidateFilesToInspect,
  } as unknown as Analysis;
}

const run = (repoIds: number[]) =>
  analyzeGithubRepositories({
    clerkUserId: 'user_1',
    accessToken: 'installation-token',
    repoIds,
  });

describe('analyzeGithubRepositories', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchRepositoryTree).mockResolvedValue({
      tree: [],
      truncated: false,
    } as Awaited<ReturnType<typeof fetchRepositoryTree>>);
    vi.mocked(analyzeProjectStructure).mockReturnValue(createAnalysis([]));
  });

  describe('selected repositories', () => {
    it('lists a selected id missing from the installation in failedRepoIds and still analyzes the rest', async () => {
      vi.mocked(fetchGithubRepos).mockResolvedValue([
        createRepo({ id: 1, name: 'api' }),
      ]);

      const result = await run([1, 99]);

      expect(result.failedRepoIds).toEqual([99]);
      expect(result.summaries.map((s) => s.repository.id)).toEqual([1]);
    });

    it('rejects with BAD_REQUEST 400 when none of the selected repositories is in the installation', async () => {
      vi.mocked(fetchGithubRepos).mockResolvedValue([
        createRepo({ id: 1, name: 'api' }),
      ]);

      await expect(run([98, 99])).rejects.toMatchObject({
        errorCode: ErrorCode.BAD_REQUEST,
        statusCode: 400,
      });
    });
  });

  describe('tree failures', () => {
    beforeEach(() => {
      vi.mocked(fetchGithubRepos).mockResolvedValue([
        createRepo({ id: 1, name: 'broken' }),
        createRepo({ id: 2, name: 'healthy' }),
      ]);
    });

    it.each([404, 409, 422])(
      'lists a repository whose tree answers %s in failedRepoIds and still returns the others',
      async (status) => {
        vi.mocked(fetchRepositoryTree).mockImplementation(async ({ repo }) => {
          if (repo === 'broken') throw createRequestError(status);
          return { tree: [], truncated: false } as Awaited<
            ReturnType<typeof fetchRepositoryTree>
          >;
        });

        const result = await run([1, 2]);

        expect(result.failedRepoIds).toEqual([1]);
        expect(result.summaries.map((s) => s.repository.id)).toEqual([2]);
      },
    );

    it.each([401, 403, 429, 500])(
      'rejects the whole call with the same error when a tree answers %s',
      async (status) => {
        const error = createRequestError(status);
        vi.mocked(fetchRepositoryTree).mockImplementation(async ({ repo }) => {
          if (repo === 'broken') throw error;
          return { tree: [], truncated: false } as Awaited<
            ReturnType<typeof fetchRepositoryTree>
          >;
        });

        await expect(run([1, 2])).rejects.toBe(error);
      },
    );

    it('rethrows an error that is not a GitHub request error', async () => {
      const error = new TypeError('socket closed');
      vi.mocked(fetchRepositoryTree).mockRejectedValue(error);

      await expect(run([1, 2])).rejects.toBe(error);
    });
  });

  describe('candidate files', () => {
    beforeEach(() => {
      vi.mocked(fetchGithubRepos).mockResolvedValue([
        createRepo({ id: 1, name: 'api' }),
      ]);
      vi.mocked(analyzeProjectStructure).mockReturnValue(
        createAnalysis(['README.md', 'package.json']),
      );
    });

    it('returns each candidate path with the text read for it, and null content for a file that is missing', async () => {
      vi.mocked(fetchRepoFile)
        .mockResolvedValueOnce('# acme api')
        .mockResolvedValueOnce(null);

      const result = await run([1]);

      expect(result.summaries[0].candidateFilesToInspect).toEqual([
        'README.md',
        'package.json',
      ]);
      expect(result.summaries[0].candidateFileContents).toEqual([
        { path: 'README.md', content: '# acme api' },
        { path: 'package.json', content: null },
      ]);
    });

    it('reads each candidate file with the installation token and the repository owner and name', async () => {
      vi.mocked(fetchRepoFile).mockResolvedValue('text');

      await run([1]);

      expect(fetchRepoFile).toHaveBeenCalledWith({
        accessToken: 'installation-token',
        owner: 'acme',
        repo: 'api',
        path: 'README.md',
      });
      expect(fetchRepoFile).toHaveBeenCalledWith({
        accessToken: 'installation-token',
        owner: 'acme',
        repo: 'api',
        path: 'package.json',
      });
    });

    it('rejects the whole call with the same error when reading a candidate file fails', async () => {
      const error = createRequestError(429);
      vi.mocked(fetchRepoFile)
        .mockResolvedValueOnce('# acme api')
        .mockRejectedValueOnce(error);

      await expect(run([1])).rejects.toBe(error);
    });
  });
});
