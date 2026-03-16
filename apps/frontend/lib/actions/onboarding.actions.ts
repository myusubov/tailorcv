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

export async function startOnboardingJobAction(input: GenerateOnboardingInput, idempotencyKey?: string) {
  return _startOnboardingJobImpl(input, idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined);
}

const _startOnAboutMeJobImpl = defineAction<FormData, StartOnboardingJobOutput>(
  {
    method: 'POST',
    path: 'onboarding/about-me',
    auth: 'required',
    keyPrefix: 'onboarding',
    staticParts: ['status'],
    revalidate: { fromKey: true },
  },
);

/**
 * Starts an onboarding job by parsing a resume file (About Me / Resume Upload).
 * @param formData - FormData containing the 'file' entry.
 */
export async function startOnboardingAboutMeJobAction(formData: FormData, idempotencyKey?: string) {
  return _startOnAboutMeJobImpl(formData, idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined);
}

const _startOnboardingGithubJobImpl = defineAction<
  { repositoryIds: string[] },
  StartOnboardingJobOutput
>({
  method: 'POST',
  path: 'onboarding/github',
  auth: 'required',
  keyPrefix: 'onboarding',
  staticParts: ['status'],
  revalidate: { fromKey: true },
});

/**
 * Starts an onboarding job from GitHub repositories.
 * @param input - Object containing repositoryIds array.
 */
export async function startOnboardingGithubJobAction(input: {
  repositoryIds: string[];
}, idempotencyKey?: string) {
  return _startOnboardingGithubJobImpl(input, idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined);
}
