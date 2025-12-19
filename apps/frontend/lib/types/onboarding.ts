import type { BaseResumeData } from 'shared';
import type { OnboardingFormValues } from '@/lib/schemas/onboarding';

export type GenerateOnboardingInput = OnboardingFormValues & { model?: string }

export type GenerateOnboardingOutput = {
  baseResumeId: string;
  data: BaseResumeData;
  meta: { model: string; finishReason?: string };
};

