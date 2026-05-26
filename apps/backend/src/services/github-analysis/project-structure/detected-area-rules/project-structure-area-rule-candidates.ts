import type { RepoTreeEntry } from '../project-structure-analyzer.types';
import { addAreaScore } from '../project-structure-detected-area-candidates';
import type {
  AreaCandidate,
  DetectedAreaName,
} from '../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../project-structure-path-utils';

/**
 * Shared candidate shape for detected-area rule modules that score owner-scoped
 * signals before adding role-based area candidates.
 */
export type AreaRuleCandidate<Signal extends string> = {
  score: number;
  evidence: string[];
  countedSignals: Set<Signal>;
};

/**
 * Shared score map shape for detected-area rule modules with string-literal
 * signal names.
 */
export type AreaRuleSignalScores<Signal extends string> = Record<
  Signal,
  number
>;

/**
 * Creates an owner-path keyed candidate map for detected-area rule modules.
 * The map stays local to each detector while sharing the candidate structure.
 */
export function createAreaRuleCandidateMap<Signal extends string>(): Map<
  string,
  AreaRuleCandidate<Signal>
> {
  return new Map<string, AreaRuleCandidate<Signal>>();
}

/**
 * Counts one signal once for the owner of a repository tree entry.
 * Mutates the provided owner candidate map by adding score and evidence only
 * when the signal has not already been counted for that owner.
 */
export function countAreaRuleSignal<Signal extends string>({
  areasByOwner,
  entry,
  signal,
  score,
}: {
  areasByOwner: Map<string, AreaRuleCandidate<Signal>>;
  entry: Pick<RepoTreeEntry, 'path'>;
  signal: Signal;
  score: number;
}): void {
  const ownerPath = ownerPathForApplicationArea({ path: entry.path });
  const ownerCandidate =
    areasByOwner.get(ownerPath) ??
    ({
      score: 0,
      evidence: [],
      countedSignals: new Set<Signal>(),
    } satisfies AreaRuleCandidate<Signal>);

  if (!ownerCandidate.countedSignals.has(signal)) {
    ownerCandidate.score += score;
    ownerCandidate.evidence.push(entry.path);
    ownerCandidate.countedSignals.add(signal);
  }

  areasByOwner.set(ownerPath, ownerCandidate);
}

/**
 * Adds all owner-scoped rule candidates from a local detector map into the
 * shared detected-area candidate map.
 */
export function addAreaRuleCandidates<Signal extends string>({
  areasByOwner,
  name,
  candidates,
}: {
  areasByOwner: Map<string, AreaRuleCandidate<Signal>>;
  name: DetectedAreaName;
  candidates: Map<string, AreaCandidate>;
}): void {
  for (const [ownerPath, ownerCandidate] of areasByOwner) {
    addAreaScore({
      candidates,
      name,
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
