import type {
  DetectedAreaTechnology,
  DetectedProjectArea,
} from './project-structure-analyzer.types';
import { normalizePath } from './project-structure-path-utils';
import type {
  AreaCandidate,
  DetectedAreaName,
} from './project-structure-detected-areas.types';

const AREA_CONFIDENCE_MAX_SCORE = 6;
export const MIN_AREA_SCORE = 3;

/**
 * Builds the shared candidate-map key `${name}::${normalizePath(path)}::${primaryTech}`.
 * Including the primary technology keeps two detectors' claims on the same
 * area name and owner path as separate entries (e.g. Next.js and React) until
 * `reconcileCandidates` resolves them.
 */
function areaKey({
  name,
  path,
  primaryTech,
}: {
  name: DetectedAreaName;
  path: string;
  primaryTech: DetectedAreaTechnology;
}): string {
  return `${name}::${normalizePath({ path })}::${primaryTech}`;
}

function confidenceFromScore({ score }: { score: number }): number {
  return Math.round(Math.min(score / AREA_CONFIDENCE_MAX_SCORE, 1) * 100) / 100;
}

/**
 * Returns whether the shared candidate map already holds a candidate for the
 * area name at the normalized owner path, whatever its primary technology.
 * Matches by key prefix (`${name}::${normalizePath(path)}::`) because callers
 * do not know which technology claimed the owner; the trailing delimiter keeps
 * `apps/web` from matching `apps/web-admin`. Read-only.
 */
export function hasAreaCandidate({
  candidates,
  name,
  path,
}: {
  candidates: Map<string, AreaCandidate>;
  name: DetectedAreaName;
  path: string;
}): boolean {
  const keysArray = Array.from(candidates.keys());
  const prefix = `${name}::${normalizePath({ path })}::`;
  return keysArray.some((key) => key.startsWith(prefix));
}

/**
 * Adds score and concrete path evidence to a detected-area candidate.
 * The candidate is identified by area name, owner path, and `primaryTechnology`,
 * so a different primary technology on the same owner path creates a separate
 * candidate instead of accumulating onto the existing one.
 * Empty evidence is ignored so emitted areas always remain evidence-backed.
 */
export function addAreaScore({
  candidates,
  name,
  path,
  score,
  evidence,
  primaryTechnology,
  relatedTechnologies,
}: {
  candidates: Map<string, AreaCandidate>;
  name: DetectedAreaName;
  path: string;
  score: number;
  evidence: string[];
  primaryTechnology: DetectedAreaTechnology;
  relatedTechnologies: DetectedAreaTechnology[];
}): void {
  if (evidence.length === 0) return;

  const key = areaKey({ name, path, primaryTech: primaryTechnology });
  const candidate =
    candidates.get(key) ??
    ({
      name,
      path,
      score: 0,
      evidence: new Set<string>(),
      inferredTechnologies: {
        primary: primaryTechnology,
        related: new Set(
          relatedTechnologies.filter(
            (technology) => technology !== primaryTechnology,
          ),
        ),
      },
    } satisfies AreaCandidate);

  candidate.score += score;
  evidence.forEach((pathEvidence) => candidate.evidence.add(pathEvidence));
  relatedTechnologies.forEach((technology) => {
    if (technology !== candidate.inferredTechnologies.primary) {
      candidate.inferredTechnologies.related.add(technology);
    }
  });
  candidates.set(key, candidate);
}

/**
 * Converts scored internal candidates into public detected-area results.
 * Weak candidates are filtered out and evidence paths are sorted for stable output.
 */
export function toDetectedProjectAreas({
  candidates,
}: {
  candidates: AreaCandidate[];
}): DetectedProjectArea[] {
  return candidates
    .filter((candidate) => candidate.score >= MIN_AREA_SCORE)
    .map((candidate) => ({
      name: candidate.name,
      path: candidate.path,
      confidence: confidenceFromScore({ score: candidate.score }),
      evidence: [...candidate.evidence].sort((a, b) => a.localeCompare(b)),
      inferredTechnologies: {
        primary: candidate.inferredTechnologies.primary,
        related: [...candidate.inferredTechnologies.related].sort((a, b) =>
          a.localeCompare(b),
        ),
      },
    }));
}
