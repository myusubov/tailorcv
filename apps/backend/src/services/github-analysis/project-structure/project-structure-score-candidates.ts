/**
 * Internal score candidate used by deterministic project-structure detectors.
 */
export interface ScoreCandidate<TName extends string> {
  name: TName;
  score: number;
}

/**
 * Builds a score map from a fixed set of candidate names.
 * Detectors keep their public labels local while sharing score bookkeeping.
 */
export function createScoreCandidates<TName extends string>({
  names,
}: {
  names: readonly TName[];
}): Map<TName, ScoreCandidate<TName>> {
  return new Map(
    names.map((name) => [
      name,
      {
        name,
        score: 0,
      },
    ]),
  );
}

/**
 * Adds score to an existing candidate and ignores unknown candidate names.
 * Unknown names are ignored so rule helpers can stay conservative and non-throwing.
 */
export function addCandidateScore<TName extends string>({
  candidates,
  name,
  score,
}: {
  candidates: Map<TName, ScoreCandidate<TName>>;
  name: TName;
  score: number;
}): void {
  const candidate = candidates.get(name);
  if (!candidate) return;
  candidate.score += score;
}

/**
 * Reads a candidate score with a zero fallback when the candidate is absent.
 */
export function candidateScore<TName extends string>({
  candidates,
  name,
}: {
  candidates: Map<TName, ScoreCandidate<TName>>;
  name: TName;
}): number {
  return candidates.get(name)?.score ?? 0;
}

/**
 * Returns candidates sorted by highest score first.
 */
export function candidatesByScore<TName extends string>({
  candidates,
}: {
  candidates: Map<TName, ScoreCandidate<TName>>;
}): ScoreCandidate<TName>[] {
  return [...candidates.values()].sort((a, b) => b.score - a.score);
}
