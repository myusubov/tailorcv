import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from 'shared';

// Mock dependencies using vi.hoisted
const { mockPrisma, mockOpenAI, mockEnv, mockLogger } = vi.hoisted(() => ({
  mockPrisma: {
    baseResume: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
  mockOpenAI: {
    chat: {
      completions: {
        parse: vi.fn(),
      },
    },
  },
  mockEnv: {
    OPENAI_ONBOARDING_SYSTEM_PROMPT: 'You are a resume assistant.',
  },
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../lib', () => ({
  prisma: mockPrisma,
  logger: mockLogger,
}));

vi.mock('../lib/openai', () => ({
  openai: mockOpenAI,
}));

vi.mock('../config/env', () => ({
  env: mockEnv,
}));

// Mock zodResponseFormat to prevent Zod v4 JSON Schema conversion errors
vi.mock('openai/helpers/zod', () => ({
  zodResponseFormat: vi.fn(() => ({ type: 'json_schema', json_schema: {} })),
}));

// Import after mocks
import {
  getOnboardingStatus,
  generateOnboarding,
  generateFromAboutMe,
} from './onboarding.service';
import { AppError } from '../utils/AppError';

describe('Onboarding Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validContactData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    headline: null,
    phone: null,
    location: null,
    websiteUrl: null,
    linkedinUrl: null,
    githubUrl: null,
  };

  const validResumeData = {
    version: 1 as const,
    contact: validContactData,
    summary: 'Test summary',
    skills: [],
    experiences: [],
    projects: [],
    education: [],
  };

  describe('getOnboardingStatus', () => {
    it('should return hasBaseResume true when resume exists', async () => {
      mockPrisma.baseResume.findFirst.mockResolvedValue({ id: 'resume-123' });

      const result = await getOnboardingStatus({ clerkUserId: 'user-1' });

      expect(result.hasBaseResume).toBe(true);
      expect(result.latestBaseResumeId).toBe('resume-123');
    });

    it('should return hasBaseResume false when no resume exists', async () => {
      mockPrisma.baseResume.findFirst.mockResolvedValue(null);

      const result = await getOnboardingStatus({ clerkUserId: 'user-1' });

      expect(result.hasBaseResume).toBe(false);
      expect(result.latestBaseResumeId).toBeNull();
    });

    it('should query with correct user ID', async () => {
      mockPrisma.baseResume.findFirst.mockResolvedValue(null);

      await getOnboardingStatus({ clerkUserId: 'specific-user-id' });

      expect(mockPrisma.baseResume.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'specific-user-id' },
        })
      );
    });
  });

  describe('generateOnboarding', () => {
    it('should generate resume from form data successfully', async () => {
      mockOpenAI.chat.completions.parse.mockResolvedValue({
        choices: [{
          message: { parsed: validResumeData },
          finish_reason: 'stop',
        }],
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
      });

      mockPrisma.baseResume.create.mockResolvedValue({
        id: 'new-resume-123',
        data: validResumeData,
      });

      const result = await generateOnboarding({
        clerkUserId: 'user-1',
        body: validResumeData,
      });

      expect(result.baseResumeId).toBe('new-resume-123');
      expect(result.data).toBeDefined();
      expect(mockOpenAI.chat.completions.parse).toHaveBeenCalled();
    });

    it('should throw AppError when AI returns null', async () => {
      mockOpenAI.chat.completions.parse.mockResolvedValue({
        choices: [{
          message: { parsed: null, refusal: 'Content policy' },
          finish_reason: 'stop',
        }],
      });

      await expect(
        generateOnboarding({
          clerkUserId: 'user-1',
          body: validResumeData,
        })
      ).rejects.toThrow(AppError);

      await expect(
        generateOnboarding({
          clerkUserId: 'user-1',
          body: validResumeData,
        })
      ).rejects.toMatchObject({
        errorCode: ErrorCode.AI_GENERATION_ERROR,
      });
    });

    it('should enrich data with user profile from database', async () => {
      mockOpenAI.chat.completions.parse.mockResolvedValue({
        choices: [{
          message: {
            parsed: {
              ...validResumeData,
              contact: { ...validContactData, firstName: 'AI', lastName: 'Generated' },
            },
          },
          finish_reason: 'stop',
        }],
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        firstName: 'Database',
        lastName: 'User',
        email: 'db@test.com',
      });

      mockPrisma.baseResume.create.mockImplementation(({ data }) => 
        Promise.resolve({ id: 'resume-1', ...data })
      );

      const result = await generateOnboarding({
        clerkUserId: 'user-1',
        body: validResumeData,
      });

      // Should use database values over AI values
      expect(result.data.contact.firstName).toBe('Database');
      expect(result.data.contact.lastName).toBe('User');
      expect(result.data.contact.email).toBe('db@test.com');
    });

    it('should call OpenAI with correct model', async () => {
      mockOpenAI.chat.completions.parse.mockResolvedValue({
        choices: [{
          message: { parsed: validResumeData },
          finish_reason: 'stop',
        }],
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.baseResume.create.mockResolvedValue({ id: 'r-1' });

      await generateOnboarding({
        clerkUserId: 'user-1',
        body: validResumeData,
      });

      expect(mockOpenAI.chat.completions.parse).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0,
        })
      );
    });
  });

  describe('generateFromAboutMe', () => {
    it('should extract resume data from raw text', async () => {
      mockOpenAI.chat.completions.parse.mockResolvedValue({
        choices: [{
          message: {
            parsed: {
              _isDataSufficient: true,
              _insufficientReason: '',
              data: validResumeData,
            },
          },
          finish_reason: 'stop',
        }],
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
      });

      mockPrisma.baseResume.create.mockResolvedValue({
        id: 'extracted-resume-123',
      });

      const result = await generateFromAboutMe({
        clerkUserId: 'user-1',
        text: 'I am a software engineer with 5 years of experience...',
      });

      expect(result.baseResumeId).toBe('extracted-resume-123');
      expect(mockOpenAI.chat.completions.parse).toHaveBeenCalled();
    });

    it('should throw AppError when AI returns no parsed response', async () => {
      mockOpenAI.chat.completions.parse.mockResolvedValue({
        choices: [{
          message: { parsed: null },
          finish_reason: 'stop',
        }],
      });

      await expect(
        generateFromAboutMe({
          clerkUserId: 'user-1',
          text: 'Some resume text',
        })
      ).rejects.toThrow(AppError);
    });

    it('should truncate text to 30000 characters for token safety', async () => {
      const longText = 'a'.repeat(50000);

      mockOpenAI.chat.completions.parse.mockResolvedValue({
        choices: [{
          message: {
            parsed: {
              _isDataSufficient: true,
              _insufficientReason: '',
              data: validResumeData,
            },
          },
          finish_reason: 'stop',
        }],
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.baseResume.create.mockResolvedValue({ id: 'r-1' });

      await generateFromAboutMe({
        clerkUserId: 'user-1',
        text: longText,
      });

      // The prompt should contain truncated text
      const callArgs = mockOpenAI.chat.completions.parse.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content.length).toBeLessThan(50000);
    });

    it('should proceed even when AI marks data as insufficient', async () => {
      mockOpenAI.chat.completions.parse.mockResolvedValue({
        choices: [{
          message: {
            parsed: {
              _isDataSufficient: false,
              _insufficientReason: 'Missing work experience',
              data: validResumeData,
            },
          },
          finish_reason: 'stop',
        }],
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.baseResume.create.mockResolvedValue({ id: 'draft-resume' });

      const result = await generateFromAboutMe({
        clerkUserId: 'user-1',
        text: 'Minimal resume text',
      });

      // Should still create resume even with insufficient data
      expect(result.baseResumeId).toBe('draft-resume');
      expect(mockPrisma.baseResume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRAFT',
          }),
        })
      );
    });

    it('should create resume with DRAFT status', async () => {
      mockOpenAI.chat.completions.parse.mockResolvedValue({
        choices: [{
          message: {
            parsed: {
              _isDataSufficient: true,
              _insufficientReason: '',
              data: validResumeData,
            },
          },
          finish_reason: 'stop',
        }],
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.baseResume.create.mockResolvedValue({ id: 'r-1' });

      await generateFromAboutMe({
        clerkUserId: 'user-1',
        text: 'Resume text',
      });

      expect(mockPrisma.baseResume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRAFT',
            name: 'Initial Resume (Draft)',
          }),
        })
      );
    });
  });
});
