'use server';

import { defineAction } from './_action';
import type {
  GenerateOnboardingInput,
  StartOnboardingJobOutput,
  GetOnboardingJobOutput,
} from '@/lib/types/onboarding';
import { backendRequest } from '@/lib/api';

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

export async function getOnboardingJobAction(jobId: string) {
  return backendRequest<GetOnboardingJobOutput>(`onboarding/jobs/${jobId}`, {
    method: 'GET',
    auth: 'required',
    revalidate: 0,
  });
}
