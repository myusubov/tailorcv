import type { AnalyzedGithubRepository } from 'shared';
import { prisma } from '../lib';
import type { Prisma } from '../../prisma/generated/client/client.js';
import type {
  GetStoredAnalysesInput,
  StoreAnalysesInput,
} from '../types/analysis';

/**
 * Stores one analysis row per analyzed repository, replacing the row the user
 * already has for that repository.
 */
export async function storeAnalyses({ userId, summaries }: StoreAnalysesInput) {
  return prisma.$transaction(
    summaries.map((summary) => {
      const { repository, candidateFileContents, ...analyzerOutput } = summary;
      // The shared interfaces have no index signature, so Prisma's JSON type
      // rejects them although they hold only plain JSON values.
      const data = {
        repository,
        ...analyzerOutput,
      } as unknown as Prisma.InputJsonObject;
      const fileContents =
        candidateFileContents as unknown as Prisma.InputJsonArray;
      return prisma.analysis.upsert({
        where: {
          userId_githubRepoId: {
            userId,
            githubRepoId: String(repository.id),
          },
        },
        create: {
          userId,
          githubRepoId: String(repository.id),
          fileContents,
          repoFullName: repository.fullName,
          data,
        },
        update: {
          fileContents,
          repoFullName: repository.fullName,
          data,
        },
      });
    }),
  );
}

/**
 * Returns one summary per repository that has a stored analysis, shaped like
 * the summaries `storeAnalyses` received.
 */
export async function getStoredAnalyses({
  userId,
  repoIds,
}: GetStoredAnalysesInput): Promise<AnalyzedGithubRepository[]> {
  const rows = await prisma.analysis.findMany({
    where: {
      userId,
      githubRepoId: {
        in: repoIds,
      },
    },
  });

  return rows.map((row) => {
    // storeAnalyses wrote plain objects of these shapes into the JSON columns.
    const data = row.data as unknown as Omit<
      AnalyzedGithubRepository,
      'candidateFileContents'
    >;
    const candidateFileContents =
      row.fileContents as unknown as AnalyzedGithubRepository['candidateFileContents'];
    return { ...data, candidateFileContents };
  });
}
