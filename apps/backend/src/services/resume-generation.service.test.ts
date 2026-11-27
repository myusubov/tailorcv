import { ApiError } from '@google/genai';
import { ErrorCode } from 'shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Prisma } from '../../prisma/generated/client/client.js';
import { AppError } from '../utils/AppError';

const mocks = vi.hoisted(() => ({
  queueAdd: vi.fn(),
  queueRemove: vi.fn(),
  getResumeByIdForWorker: vi.fn(),
  getResumeIdForUser: vi.fn(),
  resetFailedResume: vi.fn(),
  saveAnalyzedRepoIds: vi.fn(),
  getStoredAnalyses: vi.fn(),
  markResumeFailed: vi.fn(),
  saveFailedRepoNames: vi.fn(),
  saveResumeContent: vi.fn(),
  getGithubConnection: vi.fn(),
  getValidInstallationToken: vi.fn(),
  analyzeGithubRepositories: vi.fn(),
  storeAnalyses: vi.fn(),
  generateResumeContent: vi.fn(),
}));

vi.mock('../lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));
vi.mock('../lib/resume-queue', () => ({
  resumeGenerationQueue: { add: mocks.queueAdd, remove: mocks.queueRemove },
}));
vi.mock('./github.service', () => ({
  getGithubConnection: mocks.getGithubConnection,
  getValidInstallationToken: mocks.getValidInstallationToken,
}));
vi.mock('./resume.service', () => ({
  getResumeByIdForWorker: mocks.getResumeByIdForWorker,
  getResumeIdForUser: mocks.getResumeIdForUser,
  resetFailedResume: mocks.resetFailedResume,
  saveAnalyzedRepoIds: mocks.saveAnalyzedRepoIds,
  markResumeFailed: mocks.markResumeFailed,
  saveFailedRepoNames: mocks.saveFailedRepoNames,
  saveResumeContent: mocks.saveResumeContent,
}));
vi.mock('./github-analysis.service', () => ({
  analyzeGithubRepositories: mocks.analyzeGithubRepositories,
}));
vi.mock('./analysis.service', () => ({
  storeAnalyses: mocks.storeAnalyses,
  getStoredAnalyses: mocks.getStoredAnalyses,
}));
vi.mock('./resume-ai.service', () => ({
  generateResumeContent: mocks.generateResumeContent,
}));

import {
  enqueueResumeGeneration,
  failResumeGeneration,
  generateResume,
  retryResumeGeneration,
} from './resume-generation.service';

const summaries = [
  { marker: 'summary-101', repository: { id: 101 } },
  { marker: 'summary-202', repository: { id: 202 } },
];
const content = { headline: 'Generated headline' };

describe('enqueueResumeGeneration', () => {
  beforeEach(() => {
    mocks.queueAdd.mockReset().mockResolvedValue(undefined);
  });

  it('queues a job whose payload is only the resume id', async () => {
    await enqueueResumeGeneration({ resumeId: 'resume-1' });

    expect(mocks.queueAdd).toHaveBeenCalledTimes(1);
    expect(mocks.queueAdd.mock.calls[0][1]).toEqual({ resumeId: 'resume-1' });
  });

  it('uses the resume id as the job id so the same resume is not queued twice', async () => {
    await enqueueResumeGeneration({ resumeId: 'resume-1' });

    expect(mocks.queueAdd.mock.calls[0][2]).toMatchObject({
      jobId: 'resume-1',
    });
  });

  it('allows 3 attempts with exponential backoff from 5 seconds', async () => {
    await enqueueResumeGeneration({ resumeId: 'resume-1' });

    expect(mocks.queueAdd.mock.calls[0][2]).toMatchObject({
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  });

  it('rejects when the queue rejects, for example when Redis is down', async () => {
    mocks.queueAdd.mockRejectedValue(new Error('Stream is not writeable'));

    await expect(
      enqueueResumeGeneration({ resumeId: 'resume-1' }),
    ).rejects.toThrow('Stream is not writeable');
  });
});

describe('generateResume', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getResumeByIdForWorker.mockResolvedValue({
      id: 'resume-1',
      status: 'GENERATING',
      userId: 'user-1',
      sourceRepoIds: ['101', '202'],
      analyzedRepoIds: [],
    });
    mocks.getGithubConnection.mockResolvedValue({ id: 'connection-1' });
    mocks.getValidInstallationToken.mockResolvedValue({
      installationAccessToken: 'token-1',
    });
    mocks.analyzeGithubRepositories.mockResolvedValue({
      summaries,
      failedRepoIds: [],
      failedRepoNames: [],
    });
    mocks.storeAnalyses.mockResolvedValue(undefined);
    mocks.getStoredAnalyses.mockResolvedValue([]);
    mocks.saveAnalyzedRepoIds.mockResolvedValue(undefined);
    mocks.generateResumeContent.mockResolvedValue(content);
    mocks.saveResumeContent.mockResolvedValue(true);
    mocks.markResumeFailed.mockResolvedValue(true);
    mocks.saveFailedRepoNames.mockResolvedValue(true);
  });

  describe('when there is nothing to generate', () => {
    it('skips a resume that does not exist', async () => {
      mocks.getResumeByIdForWorker.mockResolvedValue(null);

      await expect(generateResume('resume-1')).resolves.toBeUndefined();

      expect(mocks.getGithubConnection).not.toHaveBeenCalled();
      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
    });

    it.each(['READY', 'FAILED'])(
      'skips a resume that is already %s',
      async (status) => {
        mocks.getResumeByIdForWorker.mockResolvedValue({
          id: 'resume-1',
          status,
          userId: 'user-1',
          sourceRepoIds: ['101'],
        });

        await expect(generateResume('resume-1')).resolves.toBeUndefined();

        expect(mocks.analyzeGithubRepositories).not.toHaveBeenCalled();
        expect(mocks.generateResumeContent).not.toHaveBeenCalled();
        expect(mocks.saveResumeContent).not.toHaveBeenCalled();
        expect(mocks.markResumeFailed).not.toHaveBeenCalled();
      },
    );
  });

  describe('when GitHub access is lost after Analyze', () => {
    it('marks the resume FAILED with GITHUB_CONNECTION_REQUIRED when there is no connection', async () => {
      mocks.getGithubConnection.mockResolvedValue(null);

      await expect(generateResume('resume-1')).resolves.toBeUndefined();

      expect(mocks.markResumeFailed).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        failureReason: ErrorCode.GITHUB_CONNECTION_REQUIRED,
      });
      expect(mocks.analyzeGithubRepositories).not.toHaveBeenCalled();
      expect(mocks.generateResumeContent).not.toHaveBeenCalled();
    });

    it('marks the resume FAILED with GITHUB_APP_SUSPENDED when the app is suspended', async () => {
      mocks.getValidInstallationToken.mockRejectedValue(
        new AppError('Suspended', ErrorCode.GITHUB_APP_SUSPENDED, 403),
      );

      await expect(generateResume('resume-1')).resolves.toBeUndefined();

      expect(mocks.markResumeFailed).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        failureReason: ErrorCode.GITHUB_APP_SUSPENDED,
      });
      expect(mocks.analyzeGithubRepositories).not.toHaveBeenCalled();
    });

    it('rethrows any other AppError from the token refresh so the job is retried', async () => {
      const error = new AppError(
        'GitHub is down',
        ErrorCode.SERVICE_UNAVAILABLE,
        503,
      );
      mocks.getValidInstallationToken.mockRejectedValue(error);

      await expect(generateResume('resume-1')).rejects.toBe(error);

      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
    });

    it('rethrows an unexpected error from the token refresh so the job is retried', async () => {
      const error = new Error('socket hang up');
      mocks.getValidInstallationToken.mockRejectedValue(error);

      await expect(generateResume('resume-1')).rejects.toBe(error);

      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
    });
  });

  describe('repository analysis', () => {
    it('analyzes the source repositories as numbers with the refreshed token', async () => {
      await generateResume('resume-1');

      expect(mocks.analyzeGithubRepositories).toHaveBeenCalledWith({
        clerkUserId: 'user-1',
        repoIds: [101, 202],
        accessToken: 'token-1',
      });
    });

    it('marks the resume FAILED with GITHUB_REPO_ANALYSIS_FAILED when every repository fails', async () => {
      mocks.analyzeGithubRepositories.mockResolvedValue({
        summaries: [],
        failedRepoIds: [101, 202],
        failedRepoNames: ['api', 'web'],
      });

      await expect(generateResume('resume-1')).resolves.toBeUndefined();

      expect(mocks.markResumeFailed).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        failureReason: ErrorCode.GITHUB_REPO_ANALYSIS_FAILED,
      });
      expect(mocks.generateResumeContent).not.toHaveBeenCalled();
    });

    it('marks the resume FAILED when its only repository fails', async () => {
      mocks.getResumeByIdForWorker.mockResolvedValue({
        id: 'resume-1',
        status: 'GENERATING',
        userId: 'user-1',
        sourceRepoIds: ['101'],
        analyzedRepoIds: [],
      });
      mocks.analyzeGithubRepositories.mockResolvedValue({
        summaries: [],
        failedRepoIds: [101],
        failedRepoNames: ['api'],
      });

      await generateResume('resume-1');

      expect(mocks.markResumeFailed).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        failureReason: ErrorCode.GITHUB_REPO_ANALYSIS_FAILED,
      });
    });

    it('continues with the repositories that succeeded and saves the names of the failed ones', async () => {
      mocks.analyzeGithubRepositories.mockResolvedValue({
        summaries: [summaries[0]],
        failedRepoIds: [202],
        failedRepoNames: ['web'],
      });

      await generateResume('resume-1');

      expect(mocks.saveFailedRepoNames).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        failedRepoNames: ['web'],
      });
      expect(mocks.storeAnalyses).toHaveBeenCalledWith({
        userId: 'user-1',
        summaries: [summaries[0]],
      });
      expect(mocks.generateResumeContent).toHaveBeenCalledWith({
        repositories: [summaries[0]],
      });
      expect(mocks.saveResumeContent).toHaveBeenCalledTimes(1);
      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
    });

    it('saves an empty list of failed repository names when none failed', async () => {
      await generateResume('resume-1');

      expect(mocks.saveFailedRepoNames).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        failedRepoNames: [],
      });
    });

    it('does not look up stored analyses when the resume has none saved', async () => {
      await generateResume('resume-1');

      expect(mocks.getStoredAnalyses).not.toHaveBeenCalled();
      expect(mocks.analyzeGithubRepositories).toHaveBeenCalledTimes(1);
    });

    it('saves the ids of the analyzed repositories', async () => {
      await generateResume('resume-1');

      expect(mocks.saveAnalyzedRepoIds).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        analyzedRepoIds: ['101', '202'],
      });
    });

    it('saves only the ids of the repositories that were analyzed', async () => {
      mocks.analyzeGithubRepositories.mockResolvedValue({
        summaries: [summaries[0]],
        failedRepoIds: [202],
        failedRepoNames: ['web'],
      });

      await generateResume('resume-1');

      expect(mocks.saveAnalyzedRepoIds).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        analyzedRepoIds: ['101'],
      });
    });

    it('saves the analyzed repository ids only after the analyses are stored', async () => {
      await generateResume('resume-1');

      expect(mocks.storeAnalyses.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.saveAnalyzedRepoIds.mock.invocationCallOrder[0],
      );
    });

    it('does not save the analyzed repository ids when storing the analyses fails', async () => {
      mocks.storeAnalyses.mockRejectedValue(new Error('database unavailable'));

      await generateResume('resume-1').catch(() => undefined);

      expect(mocks.saveAnalyzedRepoIds).not.toHaveBeenCalled();
    });

    it('rethrows a failure to save the failed names after the analyses were still stored', async () => {
      const error = new Error('database unavailable');
      mocks.saveFailedRepoNames.mockRejectedValue(error);

      await expect(generateResume('resume-1')).rejects.toBe(error);

      expect(mocks.storeAnalyses).toHaveBeenCalledTimes(1);
      expect(mocks.generateResumeContent).not.toHaveBeenCalled();
    });

    it('rethrows a failure to save the analyzed ids and does not call Gemini', async () => {
      const error = new Error('database unavailable');
      mocks.saveAnalyzedRepoIds.mockRejectedValue(error);

      await expect(generateResume('resume-1')).rejects.toBe(error);

      expect(mocks.generateResumeContent).not.toHaveBeenCalled();
    });

    it('rethrows an error from storing the analyses and does not call Gemini', async () => {
      const error = new Error('database unavailable');
      mocks.storeAnalyses.mockRejectedValue(error);

      await expect(generateResume('resume-1')).rejects.toBe(error);

      expect(mocks.generateResumeContent).not.toHaveBeenCalled();
      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
    });
  });

  describe('when the resume has stored analyses', () => {
    beforeEach(() => {
      mocks.getResumeByIdForWorker.mockResolvedValue({
        id: 'resume-1',
        status: 'GENERATING',
        userId: 'user-1',
        sourceRepoIds: ['101', '202'],
        analyzedRepoIds: ['101', '202'],
      });
      mocks.getStoredAnalyses.mockResolvedValue(summaries);
    });

    it('loads the stored analyses of the saved repository ids for the same user', async () => {
      await generateResume('resume-1');

      expect(mocks.getStoredAnalyses).toHaveBeenCalledWith({
        userId: 'user-1',
        repoIds: ['101', '202'],
      });
    });

    it('reuses them without analyzing or storing anything', async () => {
      await generateResume('resume-1');

      expect(mocks.analyzeGithubRepositories).not.toHaveBeenCalled();
      expect(mocks.storeAnalyses).not.toHaveBeenCalled();
      expect(mocks.saveAnalyzedRepoIds).not.toHaveBeenCalled();
    });

    it('does not check the GitHub connection or refresh the token', async () => {
      await generateResume('resume-1');

      expect(mocks.getGithubConnection).not.toHaveBeenCalled();
      expect(mocks.getValidInstallationToken).not.toHaveBeenCalled();
    });

    it('still generates the resume when the GitHub connection is gone', async () => {
      mocks.getGithubConnection.mockResolvedValue(null);

      await generateResume('resume-1');

      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
      expect(mocks.saveResumeContent).toHaveBeenCalledTimes(1);
    });

    it('checks the GitHub connection when it has to analyze again', async () => {
      mocks.getStoredAnalyses.mockResolvedValue([summaries[0]]);
      mocks.getGithubConnection.mockResolvedValue(null);

      await generateResume('resume-1');

      expect(mocks.markResumeFailed).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        failureReason: ErrorCode.GITHUB_CONNECTION_REQUIRED,
      });
      expect(mocks.analyzeGithubRepositories).not.toHaveBeenCalled();
    });

    it('leaves the saved failed repository names untouched', async () => {
      await generateResume('resume-1');

      expect(mocks.saveFailedRepoNames).not.toHaveBeenCalled();
    });

    it('gives Gemini the stored analyses and saves what it returns', async () => {
      await generateResume('resume-1');

      expect(mocks.generateResumeContent).toHaveBeenCalledWith({
        repositories: summaries,
      });
      expect(mocks.saveResumeContent).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        userId: 'user-1',
        content,
      });
    });

    it('analyzes the repositories again when a stored analysis is missing', async () => {
      mocks.getStoredAnalyses.mockResolvedValue([summaries[0]]);

      await generateResume('resume-1');

      expect(mocks.analyzeGithubRepositories).toHaveBeenCalledWith({
        clerkUserId: 'user-1',
        repoIds: [101, 202],
        accessToken: 'token-1',
      });
      expect(mocks.storeAnalyses).toHaveBeenCalledTimes(1);
      expect(mocks.generateResumeContent).toHaveBeenCalledWith({
        repositories: summaries,
      });
    });
  });

  describe('when the Gemini step fails', () => {
    it.each([400, 401, 403, 404])(
      'marks the resume FAILED with INTERNAL_ERROR for a Gemini %i, which a retry cannot fix',
      async (status) => {
        mocks.generateResumeContent.mockRejectedValue(
          new ApiError({ message: 'Rejected', status }),
        );

        await expect(generateResume('resume-1')).resolves.toBeUndefined();

        expect(mocks.markResumeFailed).toHaveBeenCalledWith({
          resumeId: 'resume-1',
          failureReason: ErrorCode.INTERNAL_ERROR,
        });
        expect(mocks.saveResumeContent).not.toHaveBeenCalled();
      },
    );

    it.each([408, 429, 500, 503, 504])(
      'marks the resume FAILED with SERVICE_UNAVAILABLE for a Gemini %i',
      async (status) => {
        mocks.generateResumeContent.mockRejectedValue(
          new ApiError({ message: 'Try later', status }),
        );

        await expect(generateResume('resume-1')).resolves.toBeUndefined();

        expect(mocks.markResumeFailed).toHaveBeenCalledWith({
          resumeId: 'resume-1',
          failureReason: ErrorCode.SERVICE_UNAVAILABLE,
        });
        expect(mocks.saveResumeContent).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['a bad reply that is not JSON', new SyntaxError('Unexpected token')],
      ['a network error', new TypeError('fetch failed')],
    ])(
      'marks the resume FAILED with SERVICE_UNAVAILABLE for %s',
      async (_name, error) => {
        mocks.generateResumeContent.mockRejectedValue(error);

        await expect(generateResume('resume-1')).resolves.toBeUndefined();

        expect(mocks.markResumeFailed).toHaveBeenCalledWith({
          resumeId: 'resume-1',
          failureReason: ErrorCode.SERVICE_UNAVAILABLE,
        });
      },
    );

    it('keeps the stored analyses so a retry does not analyze the repositories again', async () => {
      mocks.generateResumeContent.mockRejectedValue(
        new ApiError({ message: 'Overloaded', status: 503 }),
      );

      await generateResume('resume-1');

      expect(mocks.storeAnalyses).toHaveBeenCalledTimes(1);
    });
  });

  describe('when generation succeeds', () => {
    it('gives Gemini the analyzed repositories and saves what it returns', async () => {
      await generateResume('resume-1');

      expect(mocks.generateResumeContent).toHaveBeenCalledWith({
        repositories: summaries,
      });
      expect(mocks.saveResumeContent).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        userId: 'user-1',
        content,
      });
    });

    it('stores the analyses before it asks Gemini', async () => {
      await generateResume('resume-1');

      expect(mocks.storeAnalyses.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.generateResumeContent.mock.invocationCallOrder[0],
      );
    });

    it('does not mark the resume failed', async () => {
      await generateResume('resume-1');

      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
    });

    it('resolves without marking it failed when the resume is no longer GENERATING at save time', async () => {
      mocks.saveResumeContent.mockResolvedValue(false);

      await expect(generateResume('resume-1')).resolves.toBeUndefined();

      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
    });

    it('rethrows a save error so the job is retried, without marking the resume failed', async () => {
      const error = new Error('transaction rolled back');
      mocks.saveResumeContent.mockRejectedValue(error);

      await expect(generateResume('resume-1')).rejects.toBe(error);

      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
    });
  });
});

describe('failResumeGeneration', () => {
  beforeEach(() => {
    mocks.markResumeFailed.mockReset().mockResolvedValue(true);
  });

  function makePrismaError(code: string) {
    return new Prisma.PrismaClientKnownRequestError('Prisma failed', {
      code,
      clientVersion: 'test',
    });
  }

  it('uses the error code of an AppError as the failure reason', async () => {
    await failResumeGeneration({
      resumeId: 'resume-1',
      error: new AppError('Nope', ErrorCode.GITHUB_APP_SUSPENDED, 403),
    });

    expect(mocks.markResumeFailed).toHaveBeenCalledWith({
      resumeId: 'resume-1',
      failureReason: ErrorCode.GITHUB_APP_SUSPENDED,
    });
  });

  it.each(['P1001', 'P1008', 'P1017', 'P2037'])(
    'uses SERVICE_UNAVAILABLE for the database connection error %s',
    async (code) => {
      await failResumeGeneration({
        resumeId: 'resume-1',
        error: makePrismaError(code),
      });

      expect(mocks.markResumeFailed).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        failureReason: ErrorCode.SERVICE_UNAVAILABLE,
      });
    },
  );

  it('uses INTERNAL_ERROR for a Prisma error that is not a connection error', async () => {
    await failResumeGeneration({
      resumeId: 'resume-1',
      error: makePrismaError('P2002'),
    });

    expect(mocks.markResumeFailed).toHaveBeenCalledWith({
      resumeId: 'resume-1',
      failureReason: ErrorCode.INTERNAL_ERROR,
    });
  });

  it.each([
    ['an Error', new Error('boom')],
    ['a thrown string', 'boom'],
    ['undefined', undefined],
  ])('uses INTERNAL_ERROR for %s', async (_name, error) => {
    await failResumeGeneration({ resumeId: 'resume-1', error });

    expect(mocks.markResumeFailed).toHaveBeenCalledWith({
      resumeId: 'resume-1',
      failureReason: ErrorCode.INTERNAL_ERROR,
    });
  });

  it('never stores the raw error message on the resume', async () => {
    await failResumeGeneration({
      resumeId: 'resume-1',
      error: new Error('password=hunter2 in connection string'),
    });

    expect(JSON.stringify(mocks.markResumeFailed.mock.calls)).not.toContain(
      'hunter2',
    );
  });
});

describe('retryResumeGeneration', () => {
  const input = { resumeId: 'resume-1', userId: 'user-1' };

  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getResumeIdForUser.mockResolvedValue({ id: 'resume-1' });
    mocks.resetFailedResume.mockResolvedValue(true);
    mocks.queueRemove.mockResolvedValue(1);
    mocks.queueAdd.mockResolvedValue(undefined);
    mocks.markResumeFailed.mockResolvedValue(true);
  });

  describe('when the resume can be retried', () => {
    it('returns the resume id', async () => {
      await expect(retryResumeGeneration(input)).resolves.toEqual({
        id: 'resume-1',
      });
    });

    it('looks up and resets the resume for the same user', async () => {
      await retryResumeGeneration(input);

      expect(mocks.getResumeIdForUser).toHaveBeenCalledWith(input);
      expect(mocks.resetFailedResume).toHaveBeenCalledWith(input);
    });

    it('removes the old job and adds a new one for the resume', async () => {
      await retryResumeGeneration(input);

      expect(mocks.queueRemove).toHaveBeenCalledWith('resume-1');
      expect(mocks.queueAdd).toHaveBeenCalledTimes(1);
      expect(mocks.queueAdd.mock.calls[0][1]).toEqual({ resumeId: 'resume-1' });
    });

    it('resets the resume, then removes the old job, then adds the new one', async () => {
      await retryResumeGeneration(input);

      const resetOrder = mocks.resetFailedResume.mock.invocationCallOrder[0];
      const removeOrder = mocks.queueRemove.mock.invocationCallOrder[0];
      const addOrder = mocks.queueAdd.mock.invocationCallOrder[0];
      expect(resetOrder).toBeLessThan(removeOrder);
      expect(removeOrder).toBeLessThan(addOrder);
    });

    it('does not mark the resume failed', async () => {
      await retryResumeGeneration(input);

      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
    });
  });

  describe('when the user has no such resume', () => {
    beforeEach(() => {
      mocks.getResumeIdForUser.mockResolvedValue(null);
    });

    it('throws a 404 NOT_FOUND', async () => {
      await expect(retryResumeGeneration(input)).rejects.toMatchObject({
        errorCode: ErrorCode.NOT_FOUND,
        statusCode: 404,
      });
    });

    it('changes nothing', async () => {
      await retryResumeGeneration(input).catch(() => undefined);

      expect(mocks.resetFailedResume).not.toHaveBeenCalled();
      expect(mocks.queueRemove).not.toHaveBeenCalled();
      expect(mocks.queueAdd).not.toHaveBeenCalled();
    });
  });

  describe('when the resume is not in a retryable state', () => {
    beforeEach(() => {
      mocks.resetFailedResume.mockResolvedValue(false);
    });

    it('throws a 409 RESUME_NOT_RETRYABLE', async () => {
      await expect(retryResumeGeneration(input)).rejects.toMatchObject({
        errorCode: ErrorCode.RESUME_NOT_RETRYABLE,
        statusCode: 409,
      });
    });

    it('does not touch the queue or mark the resume failed', async () => {
      await retryResumeGeneration(input).catch(() => undefined);

      expect(mocks.queueRemove).not.toHaveBeenCalled();
      expect(mocks.queueAdd).not.toHaveBeenCalled();
      expect(mocks.markResumeFailed).not.toHaveBeenCalled();
    });
  });

  describe.each([
    ['removing the old job', () => mocks.queueRemove],
    ['adding the new job', () => mocks.queueAdd],
  ])('when %s fails', (_name, getFailingMock) => {
    beforeEach(() => {
      getFailingMock().mockRejectedValue(new Error('Stream is not writeable'));
    });

    it('throws a 503 SERVICE_UNAVAILABLE', async () => {
      await expect(retryResumeGeneration(input)).rejects.toMatchObject({
        errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503,
      });
    });

    it('marks the resume failed again with SERVICE_UNAVAILABLE', async () => {
      await retryResumeGeneration(input).catch(() => undefined);

      expect(mocks.markResumeFailed).toHaveBeenCalledWith({
        resumeId: 'resume-1',
        failureReason: ErrorCode.SERVICE_UNAVAILABLE,
      });
    });
  });

  it('does not add a new job when removing the old one fails', async () => {
    mocks.queueRemove.mockRejectedValue(new Error('Stream is not writeable'));

    await retryResumeGeneration(input).catch(() => undefined);

    expect(mocks.queueAdd).not.toHaveBeenCalled();
  });
});
