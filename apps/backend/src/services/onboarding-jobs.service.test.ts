import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from 'shared';

// Mock prisma client using vi.hoisted to ensure proper initialization order
const { mockPrismaOnboardingJob } = vi.hoisted(() => ({
  mockPrismaOnboardingJob: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock('../lib', () => ({
  prisma: {
    onboardingJob: mockPrismaOnboardingJob,
  },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock queue
vi.mock('../lib/queue', () => ({
  addJob: vi.fn().mockResolvedValue({}),
}));

// Import after mocks are set up
import {
  startOnboardingJob,
  startOnboardingAboutMeJob,
  startOnboardingGithubJob,
  getOnboardingJob,
} from './onboarding-jobs.service';
import { AppError } from '../utils/AppError';

describe('Onboarding Jobs Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startOnboardingJob', () => {
    it('should create a job and return jobId', async () => {
      const mockJobId = 'job-123';
      mockPrismaOnboardingJob.create.mockResolvedValue({ id: mockJobId });

      const result = await startOnboardingJob({
        clerkUserId: 'user-1',
        body: {
          version: 1 as const,
          contact: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            headline: null,
            phone: null,
            location: null,
            websiteUrl: null,
            linkedinUrl: null,
            githubUrl: null,
          },
          summary: 'Test summary',
          skills: [],
          experiences: [],
          projects: [],
          education: [],
        },
      });

      expect(result.jobId).toBe(mockJobId);
      expect(mockPrismaOnboardingJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            status: 'QUEUED',
            stage: 'QUEUED',
            progressPct: 0,
          }),
        })
      );
    });
  });

  describe('startOnboardingAboutMeJob', () => {
    it('should create a job with about-me type', async () => {
      const mockJobId = 'job-456';
      mockPrismaOnboardingJob.create.mockResolvedValue({ id: mockJobId });

      const result = await startOnboardingAboutMeJob({
        clerkUserId: 'user-1',
        text: 'I am a software engineer with 5 years of experience...',
      });

      expect(result.jobId).toBe(mockJobId);
      expect(mockPrismaOnboardingJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              _type: 'about-me',
              text: expect.any(String),
            }),
          }),
        })
      );
    });
  });

  describe('startOnboardingGithubJob', () => {
    it('should create a job with github type', async () => {
      const mockJobId = 'job-789';
      mockPrismaOnboardingJob.create.mockResolvedValue({ id: mockJobId });

      const result = await startOnboardingGithubJob({
        clerkUserId: 'user-1',
        repositoryIds: ['repo-1', 'repo-2'],
      });

      expect(result.jobId).toBe(mockJobId);
      expect(mockPrismaOnboardingJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              _type: 'github',
              repositoryIds: ['repo-1', 'repo-2'],
            }),
          }),
        })
      );
    });
  });

  describe('getOnboardingJob', () => {
    it('should return job details when found', async () => {
      const mockJob = {
        id: 'job-123',
        status: 'COMPLETED',
        stage: 'DONE',
        progressPct: 100,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        resultBaseResumeId: 'resume-1',
        error: null,
        rawAiResponse: null,
      };
      mockPrismaOnboardingJob.findFirst.mockResolvedValue(mockJob);

      const result = await getOnboardingJob({
        clerkUserId: 'user-1',
        jobId: 'job-123',
      });

      expect(result.id).toBe('job-123');
      expect(result.status).toBe('COMPLETED');
      expect(result.progressPct).toBe(100);
      expect(result.resultBaseResumeId).toBe('resume-1');
    });

    it('should throw AppError when job not found', async () => {
      mockPrismaOnboardingJob.findFirst.mockResolvedValue(null);

      await expect(
        getOnboardingJob({
          clerkUserId: 'user-1',
          jobId: 'nonexistent',
        })
      ).rejects.toThrow(AppError);

      await expect(
        getOnboardingJob({
          clerkUserId: 'user-1',
          jobId: 'nonexistent',
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        errorCode: ErrorCode.NOT_FOUND,
      });
    });

    it('should include error details when job failed', async () => {
      const mockJob = {
        id: 'job-failed',
        status: 'FAILED',
        stage: 'AI_GENERATION',
        progressPct: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        resultBaseResumeId: null,
        error: { message: 'AI generation failed', code: 'AI_ERROR' },
        rawAiResponse: null,
      };
      mockPrismaOnboardingJob.findFirst.mockResolvedValue(mockJob);

      const result = await getOnboardingJob({
        clerkUserId: 'user-1',
        jobId: 'job-failed',
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toEqual({ message: 'AI generation failed', code: 'AI_ERROR' });
    });
  });
});
