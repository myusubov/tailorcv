import type { BaseResumeData } from 'shared';
import type { OnboardingFormValues } from '@/lib/schemas/onboarding';

export type GenerateOnboardingInput = OnboardingFormValues & { model?: string };

export type GenerateOnboardingOutput = {
  baseResumeId: string;
  data: BaseResumeData;
  meta: { model: string; finishReason?: string };
};

export type StartOnboardingJobOutput = { jobId: string };

export type OnboardingJobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export type OnboardingJobStage =
  | 'QUEUED'
  | 'CALLING_AI'
  | 'RETRYING'
  | 'VALIDATING'
  | 'SAVING'
  | 'DONE'
  | 'FAILED';

export type GetOnboardingJobOutput = {
  id: string;
  status: OnboardingJobStatus;
  stage: OnboardingJobStage;
  progressPct: number;
  createdAt: string;
  updatedAt: string;
  resultBaseResumeId?: string;
  error?: { message: string; code: string; details?: unknown };
};
