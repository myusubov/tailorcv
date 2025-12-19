import { BaseResumeData } from 'shared';
import { OnboardingGenerateBaseBody } from '../schemas/onboarding-generate.schema';
import { ClerkLocals } from './locals';

export type GetOnboardingStatusInput = {
  clerkUserId: string;
};

export type OnboardingStatus = {
  hasBaseResume: boolean;
  latestBaseResumeId: string | null;
};

export type GenerateOnboardingInput = {
  body: OnboardingGenerateBaseBody;
} & ClerkLocals;

export type GenerateOnboardingOutput = {
  baseResumeId: string;
  data: BaseResumeData;
  meta: { model: string; finishReason?: string };
};
