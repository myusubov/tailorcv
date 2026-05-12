import type {
  CreateBaseResumeBody,
  ResumeIdParams,
  UpdateBaseResumeBody,
} from '../schemas/resumes.schema';
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

export type CreateBaseResumeLocals = ClerkLocals & {
  body: CreateBaseResumeBody;
};

export type ResumeIdLocals = ClerkLocals & {
  params: ResumeIdParams;
};

export type UpdateBaseResumeLocals = ClerkLocals & {
  params: ResumeIdParams;
  body: UpdateBaseResumeBody;
};
