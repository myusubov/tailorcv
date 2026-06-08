import type { DetectedProjectArea } from './project-structure-analyzer.types';
import { normalizePath } from './project-structure-path-utils';
import type {
  AreaCandidate,
  DetectedAreaName,
} from './project-structure-detected-areas.types';

const AREA_CONFIDENCE_MAX_SCORE = 6;
export const MIN_AREA_SCORE = 3;

function areaKey({
  name,
  path,
}: {
  name: DetectedAreaName;
  path: string;
}): string {
  return `${name}::${normalizePath({ path })}`;
}

function confidenceFromScore({ score }: { score: number }): number {
  return Math.round(Math.min(score / AREA_CONFIDENCE_MAX_SCORE, 1) * 100) / 100;
}

/**
 * Returns whether the shared candidate map already contains the normalized
 * area name and owner path.
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
  return candidates.has(areaKey({ name, path }));
}

/**
 * Adds score and concrete path evidence to a detected-area candidate.
 * Empty evidence is ignored so emitted areas always remain evidence-backed.
 */
export function addAreaScore({
  candidates,
  name,
  path,
  score,
  evidence,
}: {
  candidates: Map<string, AreaCandidate>;
  name: DetectedAreaName;
  path: string;
  score: number;
  evidence: string[];
}): void {
  if (evidence.length === 0) return;

  const key = areaKey({ name, path });
  const candidate =
    candidates.get(key) ??
    ({
      name,
      path,
      score: 0,
      evidence: new Set<string>(),
    } satisfies AreaCandidate);

  candidate.score += score;
  evidence.forEach((pathEvidence) => candidate.evidence.add(pathEvidence));
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
    }));
}
