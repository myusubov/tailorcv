import { defineClientGet } from '@/lib/http/define-client-get';
import { defineQuery } from '@/lib/http/define-query';
import { GitHubConnection, GitHubRepo } from 'shared';

const getGithubConnectionClient = defineClientGet<GitHubConnection>({
  path: '/api/github/connection',
  keyPrefix: 'github-connection',
  defaults: { cache: 'no-store' },
});

const getGithubReposClient = defineClientGet<GitHubRepo[]>({
  path: '/api/github/repos',
  keyPrefix: 'github-repos',
  defaults: { cache: 'no-store' },
});

export const useGithubReposQuery = defineQuery(getGithubReposClient);
export const useGithubConnectionQuery = defineQuery(getGithubConnectionClient);
