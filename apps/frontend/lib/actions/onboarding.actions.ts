'use server';

import { defineAction } from './_action';
import type { GenerateOnboardingInput, GenerateOnboardingOutput } from '@/lib/types/onboarding';

const _generateOnboardingImpl = defineAction<GenerateOnboardingInput, GenerateOnboardingOutput>({
  method: 'POST',
  path: 'onboarding/generate',
  auth: 'required',
  keyPrefix: 'onboarding',
  staticParts: ['status'],
  revalidate: { fromKey: true },
});

export async function generateOnboardingAction(input: GenerateOnboardingInput) {
  return _generateOnboardingImpl(input);
}
