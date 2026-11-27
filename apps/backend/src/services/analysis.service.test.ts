import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

// The real prisma client needs a database; these tests only check the query it is given.
vi.mock('../lib', () => ({
  prisma: { analysis: { findMany } },
}));

import { getStoredAnalyses } from './analysis.service';

describe('getStoredAnalyses', () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it('looks up the analyses of the given repository ids for the given user', async () => {
    findMany.mockResolvedValue([]);

    await getStoredAnalyses({ userId: 'user-1', repoIds: ['101', '202'] });

    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', githubRepoId: { in: ['101', '202'] } },
    });
  });

  it('rebuilds each summary from the stored data and file contents', async () => {
    findMany.mockResolvedValue([
      {
        id: 'row-1',
        userId: 'user-1',
        githubRepoId: '101',
        repoFullName: 'octo/api',
        data: {
          repository: { id: 101, fullName: 'octo/api' },
          languages: ['TypeScript'],
        },
        fileContents: [{ path: 'src/index.ts', content: 'export {}' }],
      },
    ]);

    await expect(
      getStoredAnalyses({ userId: 'user-1', repoIds: ['101'] }),
    ).resolves.toEqual([
      {
        repository: { id: 101, fullName: 'octo/api' },
        languages: ['TypeScript'],
        candidateFileContents: [{ path: 'src/index.ts', content: 'export {}' }],
      },
    ]);
  });

  it('returns one summary per stored row', async () => {
    findMany.mockResolvedValue([
      { data: { repository: { id: 101 } }, fileContents: [] },
      { data: { repository: { id: 202 } }, fileContents: [] },
    ]);

    const result = await getStoredAnalyses({
      userId: 'user-1',
      repoIds: ['101', '202'],
    });

    expect(result).toHaveLength(2);
  });

  it('returns an empty list when nothing is stored', async () => {
    findMany.mockResolvedValue([]);

    await expect(
      getStoredAnalyses({ userId: 'user-1', repoIds: ['101'] }),
    ).resolves.toEqual([]);
  });
});
