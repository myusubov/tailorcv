import type { GitHubConnection } from 'shared';

export type ClerkLocals = {
  clerkUserId: string;
};

export type GitHubConnectionLocals = ClerkLocals & {
  githubConnection: GitHubConnection;
};

export type ValidatedLocals = {
  body?: unknown;
  params?: unknown;
  query?: unknown;
};
