'use server';

import { defineAction } from './_action';
import type {
  GenerateOnboardingInput,
  StartOnboardingJobOutput,
} from '@/lib/types/onboarding';

const _startOnboardingJobImpl = defineAction<
  GenerateOnboardingInput,
  StartOnboardingJobOutput
>({
  method: 'POST',
  path: 'onboarding/generate',
  auth: 'required',
  keyPrefix: 'onboarding',
  staticParts: ['status'],
  revalidate: { fromKey: true },
});

export async function startOnboardingJobAction(input: GenerateOnboardingInput) {
  return _startOnboardingJobImpl(input);
}

const _startOnAboutMeJobImpl = defineAction<FormData, StartOnboardingJobOutput>({
  method: 'POST',
  path: 'onboarding/about-me',
  auth: 'required',
  keyPrefix: 'onboarding',
  staticParts: ['status'],
  revalidate: { fromKey: true },
});

/**
 * Starts an onboarding job by parsing a resume file (About Me / Resume Upload).
 * @param formData - FormData containing the 'file' entry.
 */
export async function startOnboardingAboutMeJobAction(formData: FormData) {
  return _startOnAboutMeJobImpl(formData);
}
