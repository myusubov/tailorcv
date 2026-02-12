import { GitHubConnection, GitHubRepo } from 'shared';

export type GetGithubConnectionInput = {
  params: {
    userId: string;
  };
};

export type GetGithubConnectionOutput = GitHubConnection;

export type GetGithubReposInput = {
  params: {
    userId: string;
  };
};

export type GetGithubReposOutput = GitHubRepo[];
