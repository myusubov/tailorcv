import { describe, expect, it } from 'vitest';
import {
  addAreaScore,
  hasAreaCandidate,
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

describe('hasAreaCandidate', () => {
  const claim = ({
    candidates,
    name,
    path,
    primaryTechnology,
  }: {
    candidates: Map<string, AreaCandidate>;
    name: 'Frontend app' | 'Backend API';
    path: string;
    primaryTechnology: 'React' | 'Next.js' | 'Vue' | 'NestJS';
  }) =>
    addAreaScore({
      candidates,
      name,
      path,
      score: 3,
      evidence: ['evidence'],
      primaryTechnology,
      relatedTechnologies: [primaryTechnology],
    });

  it('is true whatever primary technology claimed the area and owner path', () => {
    const candidates = new Map<string, AreaCandidate>();
    claim({
      candidates,
      name: 'Frontend app',
      path: '.',
      primaryTechnology: 'React',
    });

    expect(
      hasAreaCandidate({ candidates, name: 'Frontend app', path: '.' }),
    ).toBe(true);

    const other = new Map<string, AreaCandidate>();
    claim({
      candidates: other,
      name: 'Frontend app',
      path: '.',
      primaryTechnology: 'Vue',
    });

    expect(
      hasAreaCandidate({ candidates: other, name: 'Frontend app', path: '.' }),
    ).toBe(true);
  });

  it('is false for an empty map', () => {
    expect(
      hasAreaCandidate({
        candidates: new Map<string, AreaCandidate>(),
        name: 'Frontend app',
        path: '.',
      }),
    ).toBe(false);
  });

  it('is false when the claim is on a different area name', () => {
    const candidates = new Map<string, AreaCandidate>();
    claim({
      candidates,
      name: 'Backend API',
      path: '.',
      primaryTechnology: 'NestJS',
    });

    expect(
      hasAreaCandidate({ candidates, name: 'Frontend app', path: '.' }),
    ).toBe(false);
  });

  it('does not treat a sibling owner sharing a path prefix as the same owner', () => {
    const candidates = new Map<string, AreaCandidate>();
    claim({
      candidates,
      name: 'Frontend app',
      path: 'apps/web-admin',
      primaryTechnology: 'React',
    });

    expect(
      hasAreaCandidate({ candidates, name: 'Frontend app', path: 'apps/web' }),
    ).toBe(false);
  });

  it('normalizes the queried path (case and separators) before matching the stored key', () => {
    const candidates = new Map<string, AreaCandidate>();
    claim({
      candidates,
      name: 'Frontend app',
      path: 'apps/web',
      primaryTechnology: 'Next.js',
    });

    expect(
      hasAreaCandidate({
        candidates,
        name: 'Frontend app',
        path: 'Apps\\Web',
      }),
    ).toBe(true);
  });
});
