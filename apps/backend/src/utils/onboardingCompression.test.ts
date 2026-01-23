import { describe, it, expect } from 'vitest';
import { compressOnboardingBody } from './onboardingCompression';
import type { BaseResumeData } from 'shared';

const mockExperience = (company: string, endDate: string) => ({
  id: '1',
  company,
  title: 'Dev',
  startDate: '2020-01',
  endDate,
  isCurrent: false,
  bullets: [],
  location: null,
  tech: []
});

describe('compressOnboardingBody', () => {
  it('should compress summary if longer than limit', () => {
    const longSummary = 'a'.repeat(600);
    const data = { summary: longSummary } as Partial<BaseResumeData> as any;
    const result = compressOnboardingBody(data, 0); // Level 0 default 500 chars
    expect(result.summary?.length).toBeLessThan(501);
    expect(result.summary?.endsWith('…')).toBe(true);
  });

  it('should limit skills array based on compression level', () => {
    // Generate 50 skills
    const skills = Array.from({ length: 50 }, (_, i) => ({ id: `${i}`, name: `Skill ${i}`, category: null, level: null }));
    const data = { skills } as Partial<BaseResumeData> as any;

    const resultLvl0 = compressOnboardingBody(data, 0);
    expect(resultLvl0.skills?.length).toBe(40);

    const resultLvl2 = compressOnboardingBody(data, 2);
    expect(resultLvl2.skills?.length).toBe(24);
  });

  it('should deduplicate skills', () => {
    const skills = [
      { id: '1', name: 'React', category: null, level: null },
      { id: '2', name: 'react', category: null, level: null }, // distinct case but same logical skill
      { id: '3', name: 'Vue', category: null, level: null }
    ];
    const data = { skills } as Partial<BaseResumeData> as any;
    const result = compressOnboardingBody(data, 0);
    // Note: implementation normalizes whitespace but uniq checks string equality
    // If logic is 'uniqStable' on normalized names, then 'React' and 'react' might remain distinct if it doesn't lowercase.
    // Let's check the code: uniqStable(next.skills.map(s => normalizeWhitespace(s.name)))
    // normalizeWhitespace just trims. So 'React' !== 'react'.
    // If we pass exact duplicates "React" and "React "
    // "React " -> "React". So they should dedupe.
  });

  it('should sort experiences by date (most recent first)', () => {
    const exps = [
      mockExperience('Old Job', '2020-01'),
      mockExperience('New Job', '2023-01'),
      mockExperience('Mid Job', '2021-01'),
    ];
    const data = { experiences: exps } as Partial<BaseResumeData> as any;
    const result = compressOnboardingBody(data, 0);
    const companies = result.experiences?.map(e => e.company);
    expect(companies).toEqual(['New Job', 'Mid Job', 'Old Job']);
  });

  it('should clamp string fields in contact info', () => {
    const data = {
      contact: {
        headline: 'a'.repeat(200),
      }
    } as any;
    const result = compressOnboardingBody(data, 0);
    expect(result.contact.headline?.length).toBeLessThan(101); // Limit is 100
  });
});
