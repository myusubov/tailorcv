import type {
  CreateBaseResumeBody,
  ResumeIdParams,
  UpdateBaseResumeBody,
} from '../schemas/resumes.schema';

export type ClerkLocals = {
  clerkUserId: string;
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
