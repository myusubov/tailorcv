import type {
  CreateBaseResumeBody,
  UpdateBaseResumeBody,
} from '../schemas/resumes.schema';

export type CreateBaseResumeInput = CreateBaseResumeBody & {
  clerkUserId: string;
};

export type ListBaseResumesInput = {
  clerkUserId: string;
};

export type GetBaseResumeByIdInput = {
  clerkUserId: string;
  id: string;
};

export type UpdateBaseResumeInput = UpdateBaseResumeBody & {
  clerkUserId: string;
  id: string;
};

export type DeleteBaseResumeInput = {
  clerkUserId: string;
  id: string;
};
