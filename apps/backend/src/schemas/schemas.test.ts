import { describe, it, expect } from 'vitest';
import {
  resumeIdParamsSchema,
  createBaseResumeBodySchema,
  updateBaseResumeBodySchema,
} from './resumes.schema';
import { onboardingGithubBodySchema } from './onboarding-generate.schema';
import { aiExtractionResponseSchema } from './ai-extraction.schema';

describe('Backend Schemas', () => {
  describe('resumeIdParamsSchema', () => {
    it('should accept valid ID', () => {
      const result = resumeIdParamsSchema.safeParse({ id: 'resume-123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty ID', () => {
      const result = resumeIdParamsSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from ID', () => {
      const result = resumeIdParamsSchema.safeParse({ id: '  abc  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('abc');
      }
    });
  });

  describe('createBaseResumeBodySchema', () => {
    it('should accept valid resume data', () => {
      const validData = {
        name: 'My Resume',
        data: {
          version: 1,
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
      };
      const result = createBaseResumeBodySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow optional name', () => {
      const dataWithoutName = {
        data: {
          version: 1,
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
          summary: null,
          skills: [],
          experiences: [],
          projects: [],
          education: [],
        },
      };
      const result = createBaseResumeBodySchema.safeParse(dataWithoutName);
      expect(result.success).toBe(true);
    });
  });

  describe('updateBaseResumeBodySchema', () => {
    it('should accept name update only', () => {
      const result = updateBaseResumeBodySchema.safeParse({ name: 'New Name' });
      expect(result.success).toBe(true);
    });

    it('should accept data update only', () => {
      const result = updateBaseResumeBodySchema.safeParse({ data: { summary: 'Updated' } });
      expect(result.success).toBe(true);
    });

    it('should reject empty update', () => {
      const result = updateBaseResumeBodySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject unknown fields (strict mode)', () => {
      const result = updateBaseResumeBodySchema.safeParse({
        name: 'Test',
        unknownField: 'value',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('onboardingGithubBodySchema', () => {
    it('should accept valid repository IDs', () => {
      const result = onboardingGithubBodySchema.safeParse({
        repositoryIds: ['repo-1', 'repo-2'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = onboardingGithubBodySchema.safeParse({
        repositoryIds: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 5 repositories', () => {
      const result = onboardingGithubBodySchema.safeParse({
        repositoryIds: ['1', '2', '3', '4', '5', '6'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty string IDs', () => {
      const result = onboardingGithubBodySchema.safeParse({
        repositoryIds: ['valid', ''],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('aiExtractionResponseSchema', () => {
    it('should accept valid extraction response', () => {
      const validResponse = {
        _isDataSufficient: true,
        _insufficientReason: '',
        data: {
          version: 1,
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
          summary: 'Extracted summary',
          skills: [],
          experiences: [],
          projects: [],
          education: [],
        },
      };
      const result = aiExtractionResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should accept insufficient data response', () => {
      const insufficientResponse = {
        _isDataSufficient: false,
        _insufficientReason: 'Missing work experience details',
        data: {
          version: 1,
          contact: {
            firstName: 'Partial',
            lastName: 'Data',
            email: 'partial@test.com',
            headline: null,
            phone: null,
            location: null,
            websiteUrl: null,
            linkedinUrl: null,
            githubUrl: null,
          },
          summary: null,
          skills: [],
          experiences: [],
          projects: [],
          education: [],
        },
      };
      const result = aiExtractionResponseSchema.safeParse(insufficientResponse);
      expect(result.success).toBe(true);
    });
  });
});
