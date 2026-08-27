import type {
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
};

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
