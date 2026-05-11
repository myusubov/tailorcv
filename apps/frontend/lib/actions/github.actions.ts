'use server';

import { defineAction } from './_action';

export interface AnalyzeGithubReposInput {
  repoIds: number[];
}

export interface AnalyzeGithubReposOutput {
  summaries: Array<{
    repositoryId: number;
    repositoryFullName: string;
    projectShape: string;
    inferredStack: string[];
    totalFiles: number;
    topLevelFolders: string[];
    maxDepth: number;
    isTreeTruncated: boolean;
  }>;
}

export const analyzeGithubReposAction = defineAction<
  AnalyzeGithubReposInput,
  AnalyzeGithubReposOutput
>({
  method: 'POST',
  path: 'auth/github/analyze',
  keyPrefix: 'github-analysis',
  revalidate: { fromKey: false },
});
