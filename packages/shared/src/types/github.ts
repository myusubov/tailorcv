export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface GitHubTokenErrorResponse {
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export interface SaveGitHubConnectionInput {
  userId: string;
  installationId: string;
  installationAccessToken: string;
  installationAccessTokenExpiresAt: Date;
}

export interface GitHubRepo {
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
    type: string;
  };
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  topics?: string[];
  updated_at: string;
  default_branch?: string;
}

export interface GitHubConnection {
  id: string;
  userId: string;
  installationId: string;
  installationAccessToken: string;
  installationAccessTokenExpiresAt: Date;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface GitHubConnectionResponse {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateInstallationAccessTokenResponse {
  token: string;
  expires_at: string;
}

export interface FetchGithubReposResponse {
  total_count: number;
  repositories: GitHubRepo[];
}
