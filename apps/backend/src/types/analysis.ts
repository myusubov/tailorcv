import type { AnalyzedGithubRepository } from 'shared';

export type StoreAnalysesInput = {
  userId: string;
  summaries: AnalyzedGithubRepository[];
};

export type GetStoredAnalysesInput = {
  userId: string;
  repoIds: string[];
};
