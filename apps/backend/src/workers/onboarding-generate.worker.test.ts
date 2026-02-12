import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from 'shared';

// Mock dependencies using vi.hoisted
const { mockPrisma, mockLogger, mockGenerateOnboarding, mockGenerateFromAboutMe, mockPublishJobUpdate } = vi.hoisted(() => ({
  mockPrisma: {
    onboardingJob: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  mockGenerateOnboarding: vi.fn(),
  mockGenerateFromAboutMe: vi.fn(),
  mockPublishJobUpdate: vi.fn(),
}));

vi.mock('../lib', () => ({
  prisma: mockPrisma,
}));

vi.mock('../lib/logger', () => ({
  logger: mockLogger,
}));

vi.mock('../services/onboarding.service', () => ({
  generateOnboarding: mockGenerateOnboarding,
  generateFromAboutMe: mockGenerateFromAboutMe,
  generateFromGithub: vi.fn(),
}));

vi.mock('../services/job-notifier.service', () => ({
  publishJobUpdate: mockPublishJobUpdate,
}));

// Import after mocks
import workerProcessor from './onboarding-generate.worker';
import { AppError } from '../utils/AppError';

describe('Onboarding Generate Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockJob = (jobId: string) => ({
    data: { jobId },
  });

  describe('Job Processing', () => {
    it('should skip processing if job not found', async () => {
      mockPrisma.onboardingJob.findUnique.mockResolvedValue(null);

      await workerProcessor(createMockJob('nonexistent') as any);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: 'nonexistent' }),
        expect.stringContaining('not found')
      );
      expect(mockPrisma.onboardingJob.update).not.toHaveBeenCalled();
    });

    it('should process form-type job and call generateOnboarding', async () => {
      const mockDbJob = {
        id: 'job-123',
        userId: 'user-1',
        payload: {
          _type: 'form',
          version: 1,
          contact: { firstName: 'John' },
        },
      };

      mockPrisma.onboardingJob.findUnique.mockResolvedValue(mockDbJob);
      mockPrisma.onboardingJob.update.mockResolvedValue({
        ...mockDbJob,
        status: 'RUNNING',
      });

      mockGenerateOnboarding.mockResolvedValue({
        baseResumeId: 'resume-123',
        data: {},
        rawAiResponse: {},
      });

      await workerProcessor(createMockJob('job-123') as any);

      expect(mockGenerateOnboarding).toHaveBeenCalledWith({
        clerkUserId: 'user-1',
        body: expect.objectContaining({ _type: 'form' }),
      });
    });

    it('should process about-me type job and call generateFromAboutMe', async () => {
      const mockDbJob = {
        id: 'job-456',
        userId: 'user-2',
        payload: {
          _type: 'about-me',
          text: 'I am a software engineer...',
        },
      };

      mockPrisma.onboardingJob.findUnique.mockResolvedValue(mockDbJob);
      mockPrisma.onboardingJob.update.mockResolvedValue({
        ...mockDbJob,
        status: 'RUNNING',
      });

      mockGenerateFromAboutMe.mockResolvedValue({
        baseResumeId: 'resume-456',
        data: {},
        rawAiResponse: {},
      });

      await workerProcessor(createMockJob('job-456') as any);

      expect(mockGenerateFromAboutMe).toHaveBeenCalledWith({
        clerkUserId: 'user-2',
        text: 'I am a software engineer...',
      });
    });

    it('should update job status to RUNNING on start', async () => {
      const mockDbJob = {
        id: 'job-789',
        userId: 'user-3',
        payload: { _type: 'about-me', text: 'Test' },
      };

      mockPrisma.onboardingJob.findUnique.mockResolvedValue(mockDbJob);
      mockPrisma.onboardingJob.update.mockResolvedValue({ ...mockDbJob, status: 'RUNNING' });
      mockGenerateFromAboutMe.mockResolvedValue({ baseResumeId: 'r-1' });

      await workerProcessor(createMockJob('job-789') as any);

      expect(mockPrisma.onboardingJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'RUNNING',
            stage: 'CALLING_AI',
          }),
        })
      );
    });

    it('should update job status to SUCCEEDED on completion', async () => {
      const mockDbJob = {
        id: 'job-success',
        userId: 'user-1',
        payload: { _type: 'about-me', text: 'Test' },
      };

      mockPrisma.onboardingJob.findUnique.mockResolvedValue(mockDbJob);
      mockPrisma.onboardingJob.update.mockResolvedValue({ ...mockDbJob });
      mockGenerateFromAboutMe.mockResolvedValue({
        baseResumeId: 'resume-abc',
        rawAiResponse: { some: 'data' },
      });

      await workerProcessor(createMockJob('job-success') as any);

      // Last update should be SUCCEEDED
      const lastCall = mockPrisma.onboardingJob.update.mock.calls.slice(-1)[0];
      expect(lastCall[0].data).toMatchObject({
        status: 'SUCCEEDED',
        stage: 'DONE',
        progressPct: 100,
      });
    });

    it('should publish job updates via SSE', async () => {
      const mockDbJob = {
        id: 'job-sse',
        userId: 'user-1',
        payload: { _type: 'about-me', text: 'Test' },
      };

      mockPrisma.onboardingJob.findUnique.mockResolvedValue(mockDbJob);
      mockPrisma.onboardingJob.update.mockResolvedValue({ ...mockDbJob });
      mockGenerateFromAboutMe.mockResolvedValue({ baseResumeId: 'r-1' });

      await workerProcessor(createMockJob('job-sse') as any);

      expect(mockPublishJobUpdate).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should update job to FAILED on error', async () => {
      const mockDbJob = {
        id: 'job-fail',
        userId: 'user-1',
        payload: { _type: 'about-me', text: 'Test' },
      };

      mockPrisma.onboardingJob.findUnique.mockResolvedValue(mockDbJob);
      mockPrisma.onboardingJob.update.mockResolvedValue({ ...mockDbJob });
      mockGenerateFromAboutMe.mockRejectedValue(
        new AppError('AI failed', ErrorCode.AI_GENERATION_ERROR, 500)
      );

      await expect(
        workerProcessor(createMockJob('job-fail') as any)
      ).rejects.toThrow();

      // Check that job was updated to FAILED
      const failedCall = mockPrisma.onboardingJob.update.mock.calls.find(
        call => call[0].data?.status === 'FAILED'
      );
      expect(failedCall).toBeDefined();
      expect(failedCall?.[0].data?.error).toMatchObject({
        code: ErrorCode.AI_GENERATION_ERROR,
      });
    });

    it('should log error on failure', async () => {
      const mockDbJob = {
        id: 'job-error-log',
        userId: 'user-1',
        payload: { _type: 'about-me', text: 'Test' },
      };

      mockPrisma.onboardingJob.findUnique.mockResolvedValue(mockDbJob);
      mockPrisma.onboardingJob.update.mockResolvedValue({ ...mockDbJob });
      mockGenerateFromAboutMe.mockRejectedValue(new Error('Network timeout'));

      await expect(
        workerProcessor(createMockJob('job-error-log') as any)
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should re-throw error for BullMQ retry logic', async () => {
      const mockDbJob = {
        id: 'job-rethrow',
        userId: 'user-1',
        payload: { _type: 'about-me', text: 'Test' },
      };

      mockPrisma.onboardingJob.findUnique.mockResolvedValue(mockDbJob);
      mockPrisma.onboardingJob.update.mockResolvedValue({ ...mockDbJob });

      const originalError = new Error('Should be re-thrown');
      mockGenerateFromAboutMe.mockRejectedValue(originalError);

      await expect(
        workerProcessor(createMockJob('job-rethrow') as any)
      ).rejects.toThrow('Should be re-thrown');
    });
  });
});
