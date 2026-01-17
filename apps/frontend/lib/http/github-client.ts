import { defineQuery } from '@/lib/http/define-query';
import { GitHubConnection, GitHubRepo } from 'shared';

export const useGithubConnectionQuery = defineQuery<void, GitHubConnection>({
  path: '/api/github/connection',
  keyPrefix: 'github-connection',
  defaults: { cache: 'no-store' },
});

export const useGithubReposQuery = defineQuery<void, GitHubRepo[]>({
  path: '/api/github/repos',
  keyPrefix: 'github-repos',
  defaults: { cache: 'no-store' },
});
