export const onboardingJobStatuses = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
] as const;

export type OnboardingJobStatus = (typeof onboardingJobStatuses)[number];

export const onboardingJobStages = [
  'QUEUED',
  'CALLING_AI',
  'RETRYING',
  'VALIDATING',
  'SAVING',
  'DONE',
  'FAILED',
] as const;

export type OnboardingJobStage = (typeof onboardingJobStages)[number];

export type OnboardingJobError = {
  message: string;
  code: string;
  details?: unknown;
};
