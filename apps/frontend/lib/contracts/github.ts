import type { GitHubConnectionResponse, GitHubRepo } from 'shared';

export type GetGithubConnectionInput = {
  params: {
    userId: string;
  };
};

export type GetGithubConnectionOutput = GitHubConnectionResponse | null;

export type GetGithubReposInput = {
  params: {
    userId: string;
  };
};

export type GetGithubReposOutput = GitHubRepo[];
