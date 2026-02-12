import { describe, it, expect } from 'vitest';
import { onboardingSchema } from './onboarding';

describe('Onboarding Schema', () => {
  const validContactData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    headline: null,
    phone: null,
    location: null,
    websiteUrl: null,
    linkedinUrl: null,
    githubUrl: null,
  };

  const validResumeData = {
    version: 1,
    contact: validContactData,
    summary: 'Test summary',
    skills: [],
    experiences: [],
    projects: [],
    education: [],
  };

  it('should accept valid onboarding data', () => {
    const result = onboardingSchema.safeParse(validResumeData);
    expect(result.success).toBe(true);
  });

  it('should require contact information', () => {
    const result = onboardingSchema.safeParse({
      ...validResumeData,
      contact: undefined,
    });
    expect(result.success).toBe(false);
  });

  it('should require version', () => {
    const result = onboardingSchema.safeParse({
      ...validResumeData,
      version: undefined,
    });
    expect(result.success).toBe(false);
  });

  it('should allow optional summary', () => {
    const result = onboardingSchema.safeParse({
      ...validResumeData,
      summary: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty experiences array', () => {
    const result = onboardingSchema.safeParse({
      ...validResumeData,
      experiences: [],
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty skills array', () => {
    const result = onboardingSchema.safeParse({
      ...validResumeData,
      skills: [],
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty education array', () => {
    const result = onboardingSchema.safeParse({
      ...validResumeData,
      education: [],
    });
    expect(result.success).toBe(true);
  });
});
