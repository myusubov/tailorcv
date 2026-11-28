import { ErrorCode } from 'shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateMany, findFirst, tx, transaction } = vi.hoisted(() => {
  const tx = {
    resume: { updateMany: vi.fn() },
    skillGroup: { createMany: vi.fn() },
    project: { createMany: vi.fn() },
    user: { updateMany: vi.fn() },
  };
  return {
    updateMany: vi.fn(),
    findFirst: vi.fn(),
    tx,
    transaction: vi.fn((run: (client: typeof tx) => Promise<boolean>) =>
      run(tx),
    ),
  };
});

// The real prisma client needs a database; these tests only check the query it is given.
vi.mock('../lib', () => ({
  prisma: { resume: { updateMany, findFirst }, $transaction: transaction },
  logger: {},
}));

import type { GeneratedResumeContent } from '../types/resume-content';
import {
  markResumeFailed,
  resetFailedResume,
  saveAnalyzedRepoIds,
  saveFailedRepoNames,
  saveResumeContent,
  getResumeIdForUser,
} from './resume.service';

const input = {
  resumeId: 'resume-1',
  failureReason: ErrorCode.SERVICE_UNAVAILABLE,
};

describe('markResumeFailed', () => {
  beforeEach(() => {
    updateMany.mockReset();
  });

  it('only updates a resume that is still GENERATING', async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await markResumeFailed(input);

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'resume-1', status: 'GENERATING' },
      data: { status: 'FAILED', failureReason: 'SERVICE_UNAVAILABLE' },
    });
  });

  it('returns true when the resume was marked failed', async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await expect(markResumeFailed(input)).resolves.toBe(true);
  });

  it('returns false without throwing when no resume matched', async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(markResumeFailed(input)).resolves.toBe(false);
  });
});

describe('saveFailedRepoNames', () => {
  beforeEach(() => {
    updateMany.mockReset();
  });

  it('only updates a resume that is still GENERATING', async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await saveFailedRepoNames({
      resumeId: 'resume-1',
      failedRepoNames: ['api', 'web'],
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'resume-1', status: 'GENERATING' },
      data: { failedRepoNames: ['api', 'web'] },
    });
  });

  it('returns false when no resume matched', async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(
      saveFailedRepoNames({ resumeId: 'resume-1', failedRepoNames: ['api'] }),
    ).resolves.toBe(false);
  });
});

describe('saveAnalyzedRepoIds', () => {
  beforeEach(() => {
    updateMany.mockReset();
  });

  it('only updates a resume that is still GENERATING', async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await saveAnalyzedRepoIds({
      resumeId: 'resume-1',
      analyzedRepoIds: ['101', '202'],
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'resume-1', status: 'GENERATING' },
      data: { analyzedRepoIds: ['101', '202'] },
    });
  });

  it('does not throw when no resume matched', async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(
      saveAnalyzedRepoIds({ resumeId: 'resume-1', analyzedRepoIds: ['101'] }),
    ).resolves.toBeUndefined();
  });
});

describe('resetFailedResume', () => {
  const resetInput = { resumeId: 'resume-1', userId: 'user-1' };

  beforeEach(() => {
    updateMany.mockReset();
  });

  it('only resets a resume of this user that failed with SERVICE_UNAVAILABLE or GITHUB_REPO_ANALYSIS_FAILED', async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await resetFailedResume(resetInput);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: 'resume-1',
        userId: 'user-1',
        status: 'FAILED',
        failureReason: {
          in: ['SERVICE_UNAVAILABLE', 'GITHUB_REPO_ANALYSIS_FAILED'],
        },
      },
      data: { status: 'GENERATING', failureReason: null },
    });
  });

  it('returns true when the resume was reset', async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await expect(resetFailedResume(resetInput)).resolves.toBe(true);
  });

  it('returns false without throwing when no resume matched', async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(resetFailedResume(resetInput)).resolves.toBe(false);
  });
});

describe('saveResumeContent', () => {
  const content: GeneratedResumeContent = {
    headline: 'Backend Developer, TypeScript',
    summary: 'Built a queue worker.',
    skillGroups: [
      { title: 'Languages', skills: ['TypeScript', 'SQL'] },
      { title: 'Backend', skills: ['Express'] },
    ],
    projects: [
      {
        repoId: 11,
        name: 'queue-worker',
        repoUrl: 'https://github.com/owner/queue-worker',
        description: 'A BullMQ worker',
        tools: ['BullMQ', 'Redis'],
        bullets: [
          { text: 'Built the worker', evidence: ['src/worker.ts'] },
          { text: 'Added retries', evidence: ['src/retry.ts'] },
        ],
      },
      {
        repoId: 12,
        name: 'web-app',
        repoUrl: 'https://github.com/owner/web-app',
        description: 'A Next.js app',
        tools: ['Next.js'],
        bullets: [{ text: 'Built the page', evidence: ['app/page.tsx'] }],
      },
    ],
  };
  const input = { resumeId: 'resume-1', userId: 'user-1', content };

  beforeEach(() => {
    transaction.mockClear();
    updateMany.mockReset();
    tx.resume.updateMany.mockReset().mockResolvedValue({ count: 1 });
    tx.skillGroup.createMany.mockReset().mockResolvedValue({ count: 0 });
    tx.project.createMany.mockReset().mockResolvedValue({ count: 0 });
    tx.user.updateMany.mockReset().mockResolvedValue({ count: 1 });
  });

  it('writes the headline and summary and sets READY only on a GENERATING resume', async () => {
    await saveResumeContent(input);

    expect(tx.resume.updateMany).toHaveBeenCalledWith({
      where: { id: 'resume-1', status: 'GENERATING' },
      data: {
        headline: 'Backend Developer, TypeScript',
        summary: 'Built a queue worker.',
        status: 'READY',
      },
    });
  });

  it('saves the skill groups in the order the model wrote them', async () => {
    await saveResumeContent(input);

    expect(tx.skillGroup.createMany).toHaveBeenCalledWith({
      data: [
        {
          resumeId: 'resume-1',
          title: 'Languages',
          skills: ['TypeScript', 'SQL'],
          position: 0,
        },
        {
          resumeId: 'resume-1',
          title: 'Backend',
          skills: ['Express'],
          position: 1,
        },
      ],
    });
  });

  it('saves the projects in order with the bullet text only, without the evidence paths', async () => {
    await saveResumeContent(input);

    expect(tx.project.createMany).toHaveBeenCalledWith({
      data: [
        {
          resumeId: 'resume-1',
          name: 'queue-worker',
          description: 'A BullMQ worker',
          tools: ['BullMQ', 'Redis'],
          bullets: ['Built the worker', 'Added retries'],
          repoUrl: 'https://github.com/owner/queue-worker',
          position: 0,
        },
        {
          resumeId: 'resume-1',
          name: 'web-app',
          description: 'A Next.js app',
          tools: ['Next.js'],
          bullets: ['Built the page'],
          repoUrl: 'https://github.com/owner/web-app',
          position: 1,
        },
      ],
    });
  });

  it('sets onboardingCompletedAt only for a user whose onboardingCompletedAt is still empty', async () => {
    await saveResumeContent(input);

    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { clerkUserId: 'user-1', onboardingCompletedAt: null },
      data: { onboardingCompletedAt: expect.any(Date) },
    });
  });

  it('returns true after saving', async () => {
    await expect(saveResumeContent(input)).resolves.toBe(true);
  });

  it('runs every write inside one transaction, not on the plain client', async () => {
    await saveResumeContent(input);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(updateMany).not.toHaveBeenCalled();
  });

  describe('when the resume is no longer GENERATING', () => {
    beforeEach(() => {
      tx.resume.updateMany.mockResolvedValue({ count: 0 });
    });

    it('returns false', async () => {
      await expect(saveResumeContent(input)).resolves.toBe(false);
    });

    it('saves no skill groups or projects and does not complete onboarding', async () => {
      await saveResumeContent(input);

      expect(tx.skillGroup.createMany).not.toHaveBeenCalled();
      expect(tx.project.createMany).not.toHaveBeenCalled();
      expect(tx.user.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('when a write fails', () => {
    it('rejects and does not complete onboarding when saving the projects fails', async () => {
      tx.project.createMany.mockRejectedValue(new Error('insert failed'));

      await expect(saveResumeContent(input)).rejects.toThrow('insert failed');
      expect(tx.user.updateMany).not.toHaveBeenCalled();
    });

    it('rejects when saving the skill groups fails, before any project is written', async () => {
      tx.skillGroup.createMany.mockRejectedValue(new Error('insert failed'));

      await expect(saveResumeContent(input)).rejects.toThrow('insert failed');
      expect(tx.project.createMany).not.toHaveBeenCalled();
    });
  });
});

describe('getResumeIdForUser', () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  const input = { userId: 'user-1', resumeId: 'resume-1' };

  it("looks the resume up by id and user, so another user's resume is never found", async () => {
    findFirst.mockResolvedValue({ id: 'resume-1' });

    await getResumeIdForUser(input);

    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'resume-1', userId: 'user-1' },
      }),
    );
  });

  it('selects only the id of the resume', async () => {
    findFirst.mockResolvedValue({ id: 'resume-1' });

    await getResumeIdForUser(input);

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
        },
      }),
    );
  });
});
