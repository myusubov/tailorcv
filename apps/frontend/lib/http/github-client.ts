import { defineQuery } from '@/lib/http/define-query';
import type { GitHubConnectionResponse, GitHubRepo } from 'shared';
import { GetGithubReposOutput } from '../types/github';

export const useGithubConnectionQuery = defineQuery<
  void,
  GitHubConnectionResponse | null
>({
  path: '/api/github/connection',
  keyPrefix: 'github-connection',
  defaults: { cache: 'no-store' },
});

export const useGithubReposQuery = defineQuery<void, GetGithubReposOutput>({
  path: '/api/github/repos',
  keyPrefix: 'github-repos',
  defaults: { cache: 'no-store' },
});
