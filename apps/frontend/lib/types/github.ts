import type {
  CreateResumeResponse,
  FetchGithubReposResponse,
  GitHubConnectionResponse,
} from 'shared';

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

export type GetGithubReposOutput = FetchGithubReposResponse;

export interface InitiateGithubAuthOutput {
  authUrl: string;
}

export type AnalyzeGithubReposInput = {
  repoIds: number[];
  idempotencyKey: string;
};

export type AnalyzeGithubReposOutput = CreateResumeResponse;
