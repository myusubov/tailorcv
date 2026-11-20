import type { CreateResumeResponse, ErrorCode } from 'shared';

import type { Prisma } from '../../prisma/generated/client/client.js';
import type { GeneratedResumeContent } from './resume-content';

export type CreateResumeInput = Prisma.ResumeUncheckedCreateInput & {
  idempotencyKey: string;
};

export type CreateResumeOutput = CreateResumeResponse;

export type EnqueueResumeGenerationInput = {
  resumeId: string;
};

export type ResumeGenerationJobData = {
  resumeId: string;
};

export type MarkResumeFailedInput = {
  resumeId: string;
  failureReason: ErrorCode;
};

export type FailResumeGenerationInput = {
  resumeId: string;
  error: unknown;
};

export type GetResumeByIdForWorkerInput = {
  resumeId: string;
};

export type SaveFailedRepoNamesInput = {
  resumeId: string;
  failedRepoNames: string[];
};

export type GetResumeForUserInput = {
  resumeId: string;
  userId: string;
};

export type SaveResumeContentInput = {
  resumeId: string;
  userId: string;
  content: GeneratedResumeContent;
};
