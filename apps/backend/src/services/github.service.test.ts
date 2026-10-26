import { RequestError } from '@octokit/request-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// github.service.ts imports these at load time; the real modules need a full
// environment, a database client and Redis, none of which this test is about.
vi.mock('../lib', () => ({ logger: {}, prisma: {} }));
vi.mock('../config/env', () => ({ env: {} }));
vi.mock('../lib/redis', () => ({ redisClient: {} }));
vi.mock('../lib/octokit', () => ({ createOctokit: vi.fn() }));

import { createOctokit } from '../lib/octokit';
import { fetchRepoFile } from './github.service';

const getContent = vi.fn();

const input = {
  accessToken: 'installation-token',
  owner: 'acme',
  repo: 'api',
  path: 'src/server.ts',
};

function createRequestError(status: number): RequestError {
  const url = 'https://api.github.com/repos/acme/api/contents/src%2Fserver.ts';
  return new RequestError('GitHub said no', status, {
    request: { method: 'GET', url, headers: {} },
    response: { status, url, headers: {}, data: {} },
  });
}

describe('fetchRepoFile', () => {
  beforeEach(() => {
    getContent.mockReset();
    vi.mocked(createOctokit).mockReturnValue({
      rest: { repos: { getContent } },
    } as unknown as ReturnType<typeof createOctokit>);
  });

  it('returns the file text GitHub sends', async () => {
    getContent.mockResolvedValue({ data: 'console.log("hi");' });

    await expect(fetchRepoFile(input)).resolves.toBe('console.log("hi");');
  });

  it('asks GitHub for the raw text of the given owner, repo and path using the given token', async () => {
    getContent.mockResolvedValue({ data: 'text' });

    await fetchRepoFile(input);

    expect(createOctokit).toHaveBeenCalledWith('installation-token');
    expect(getContent).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'api',
      path: 'src/server.ts',
      mediaType: { format: 'raw' },
    });
  });

  it('returns null when GitHub answers 404 for the file', async () => {
    getContent.mockRejectedValue(createRequestError(404));

    await expect(fetchRepoFile(input)).resolves.toBeNull();
  });

  it('returns null when GitHub answers with something other than file text', async () => {
    getContent.mockResolvedValue({ data: [{ type: 'file', name: 'a.ts' }] });

    await expect(fetchRepoFile(input)).resolves.toBeNull();
  });

  it.each([401, 403, 429, 500])(
    'rethrows the same error when GitHub answers %s',
    async (status) => {
      const error = createRequestError(status);
      getContent.mockRejectedValue(error);

      await expect(fetchRepoFile(input)).rejects.toBe(error);
    },
  );

  it('rethrows an error that is not a GitHub request error', async () => {
    const error = new TypeError('socket closed');
    getContent.mockRejectedValue(error);

    await expect(fetchRepoFile(input)).rejects.toBe(error);
  });
});
