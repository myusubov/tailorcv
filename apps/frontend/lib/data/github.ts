import 'server-only';

import { defineGet } from './_query';

import type {
  GetGithubConnectionInput,
  GetGithubConnectionOutput,
  GetGithubReposInput,
  GetGithubReposOutput,
} from '@/lib/types/github';

export const getGithubConnection = defineGet<
  GetGithubConnectionInput,
  GetGithubConnectionOutput
>({
  path: 'auth/github/connection',
  keyPrefix: 'github-connection',
  dynamicParts: ({ params: { userId } }) => [userId],
  defaults: { cache: 'no-store', auth: 'required' },
});

export const getGithubRepos = defineGet<
  GetGithubReposInput,
  GetGithubReposOutput
>({
  path: 'auth/github/repos',
  keyPrefix: 'github-repos',
  dynamicParts: ({ params: { userId } }) => [userId],
  defaults: { cache: 'no-store', auth: 'required' },
});
