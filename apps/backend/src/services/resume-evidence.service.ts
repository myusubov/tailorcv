import type { AnalyzedGithubRepository } from 'shared';
import {
  getCandidateFileTier,
  isAgentInstructionFile,
  getTierTwoRank,
  isArchitectureOrDesignFile,
  TIER_TWO_TYPE_COUNT,
} from './github-analysis/project-structure/project-structure-candidate-files';

// 30,000 tokens at the safe estimate of 3 characters per token.
export const MAX_EVIDENCE_CHARACTERS = 90_000;

export function getEvidenceSize(
  repositories: AnalyzedGithubRepository[],
): number {
  return repositories.reduce(
    (acc, { repository, candidateFileContents, ...analysis }) => {
      const filesSize = candidateFileContents.reduce(
        (sum, file) => sum + (file.content?.length ?? 0),
        0,
      );
      return (
        acc +
        JSON.stringify(repository).length +
        JSON.stringify(analysis).length +
        filesSize
      );
    },
    0,
  );
}

const MAX_FILE_CHARACTERS = 4_000;

export function truncateFileContent(content: string | null): string | null {
  if (!content) return null;
  if (content.length <= MAX_FILE_CHARACTERS) return content;

  const head = content.slice(0, MAX_FILE_CHARACTERS);
  const lastLineBreak = head.lastIndexOf('\n');
  if (lastLineBreak > 0) return head.slice(0, lastLineBreak);

  // A hard cut can split an emoji and leave half of it as invalid text.
  const lastCode = head.charCodeAt(head.length - 1);
  const splitsPair = lastCode >= 0xd800 && lastCode <= 0xdbff;
  return splitsPair ? head.slice(0, -1) : head;
}

function removeFiles({
  repositories,
  shouldRemove,
}: {
  repositories: AnalyzedGithubRepository[];
  shouldRemove: (path: string) => boolean;
}): AnalyzedGithubRepository[] {
  return repositories.map((repo) => ({
    ...repo,
    candidateFilesToInspect: repo.candidateFilesToInspect.filter(
      (path) => !shouldRemove(path),
    ),
    candidateFileContents: repo.candidateFileContents.filter(
      (file) => !shouldRemove(file.path),
    ),
  }));
}

type Cut = (
  repositories: AnalyzedGithubRepository[],
) => AnalyzedGithubRepository[];

// Tier 2 types from the lowest priority (page) up to the highest (schema).
const tierTwoRanksLowestFirst = Array.from(
  { length: TIER_TWO_TYPE_COUNT },
  (_, index) => TIER_TWO_TYPE_COUNT - 1 - index,
);

// Applied in this order until the evidence is within the limit. The first cut,
// shortening every file, always runs, even when the evidence already fits.
const CUTS: Cut[] = [
  (repositories) =>
    repositories.map((repo) => ({
      ...repo,
      candidateFileContents: repo.candidateFileContents.map((file) => ({
        ...file,
        content: truncateFileContent(file.content),
      })),
    })),
  (repositories) => repositories.filter((repo) => !repo.repository.isFork),
  (repositories) =>
    removeFiles({
      repositories,
      shouldRemove: (path) =>
        getCandidateFileTier(path) === 3 && !isArchitectureOrDesignFile(path),
    }),
  (repositories) =>
    removeFiles({
      repositories,
      shouldRemove: (path) => getCandidateFileTier(path) === 3,
    }),
  (repositories) =>
    removeFiles({ repositories, shouldRemove: isAgentInstructionFile }),
  ...tierTwoRanksLowestFirst.map(
    (rank): Cut =>
      (repositories) =>
        removeFiles({
          repositories,
          shouldRemove: (path) =>
            getCandidateFileTier(path) === 2 &&
            getTierTwoRank(path.split('/').pop() ?? path) === rank,
        }),
  ),
];

/**
 * Shrinks the evidence to `MAX_EVIDENCE_CHARACTERS` by applying the cuts in order
 * and stopping at the first that fits. May drop repositories, never the last one.
 */
export function capEvidence(
  repositories: AnalyzedGithubRepository[],
): AnalyzedGithubRepository[] {
  let repos = repositories;

  for (const cut of CUTS) {
    repos = cut(repos);

    if (getEvidenceSize(repos) <= MAX_EVIDENCE_CHARACTERS) {
      return repos;
    }
  }

  // Last resort: drop the weakest repositories one at a time, but never the last one.
  while (getEvidenceSize(repos) > MAX_EVIDENCE_CHARACTERS && repos.length > 1) {
    const weakestRepo = repos.reduce((weakest, repo) =>
      repo.maturitySignals.coverage.met < weakest.maturitySignals.coverage.met
        ? repo
        : weakest,
    );
    repos = repos.filter(
      (repo) => repo.repository.id !== weakestRepo.repository.id,
    );
  }

  return repos;
}
