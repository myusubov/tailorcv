import { describe, expect, it } from 'vitest';
import {
  addAreaScore,
  toDetectedProjectAreas,
} from './project-structure-detected-area-candidates';
import type { AreaCandidate } from './project-structure-detected-areas.types';

describe('detected area candidates', () => {
  it('preserves the first primary technology and deduplicates related technologies', () => {
    const candidates = new Map<string, AreaCandidate>();

    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: '.',
      score: 3,
      evidence: ['next.config.ts'],
      primaryTechnology: 'Next.js',
      relatedTechnologies: ['Next.js', 'React'],
    });
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: '.',
      score: 1,
      evidence: ['app/page.tsx'],
      primaryTechnology: 'React',
      relatedTechnologies: ['React'],
    });

    expect(
      toDetectedProjectAreas({ candidates: [...candidates.values()] }),
    ).toEqual([
      {
        name: 'Frontend app',
        path: '.',
        confidence: 0.67,
        evidence: ['app/page.tsx', 'next.config.ts'],
        inferredTechnologies: {
          primary: 'Next.js',
          related: ['React'],
        },
      },
    ]);
  });
});
