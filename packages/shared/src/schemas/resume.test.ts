import { describe, expect, it } from 'vitest';

import { baseResumeDataSchema } from './resume';

function createResumeDataWithProjectDates({
  endDate,
  startDate,
}: {
  endDate: string;
  startDate: string;
}) {
  return {
    version: 1,
    contact: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      headline: '',
      email: 'ada@example.com',
      phone: '',
      location: '',
      websiteUrl: '',
      linkedinUrl: '',
      githubUrl: '',
    },
    summary: '',
    skills: [],
    experiences: [],
    projects: [
      {
        id: 'project-1',
        name: 'Compiler Notes',
        role: '',
        startDate,
        endDate,
        isCurrent: false,
        url: '',
        repoUrl: '',
        tech: [],
        bullets: [{ id: 'bullet-1', text: 'Built a working prototype.' }],
      },
    ],
    education: [],
    certifications: [],
    languages: [],
  };
}

describe('baseResumeDataSchema date fields', () => {
  it('accepts full selected dates for resume project ranges', () => {
    const result = baseResumeDataSchema.safeParse(
      createResumeDataWithProjectDates({
        startDate: '2026-04-20',
        endDate: '2026-05-12',
      }),
    );

    expect(result.success).toBe(true);
  });

  it('rejects impossible calendar dates', () => {
    const impossibleDates = ['2026-02-29', '2026-02-31', '2026-04-31'];

    for (const startDate of impossibleDates) {
      const result = baseResumeDataSchema.safeParse(
        createResumeDataWithProjectDates({
          startDate,
          endDate: '2026-05-12',
        }),
      );

      expect(result.success).toBe(false);
    }
  });

  it('accepts leap-day full dates when the year is valid', () => {
    const result = baseResumeDataSchema.safeParse(
      createResumeDataWithProjectDates({
        startDate: '2024-02-29',
        endDate: '2024-03-12',
      }),
    );

    expect(result.success).toBe(true);
  });
});
