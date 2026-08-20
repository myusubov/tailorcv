'use server';

import { defineAction } from './_action';
import type {
  InitiateGithubAuthOutput,
  AnalyzeGithubReposInput,
  AnalyzeGithubReposOutput,
} from '@/lib/types/github';

export const initiateGithubAuthAction = defineAction<
  void,
  InitiateGithubAuthOutput
>({
  method: 'POST',
  path: 'auth/github',
});

export const analyzeGithubReposAction = defineAction<
  AnalyzeGithubReposInput,
  AnalyzeGithubReposOutput
>({
  method: 'POST',
  path: 'auth/github/analyze',
  keyPrefix: 'github-analysis',
  revalidate: { fromKey: false },
});
