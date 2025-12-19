import 'server-only';

import { defineGet } from './_query';

import type {
  GetOnboardingStatusInput,
  GetOnboardingStatusOutput,
} from '@/lib/contracts/onboarding';

export const getOnboardingStatus = defineGet<
  GetOnboardingStatusInput,
  GetOnboardingStatusOutput
>({
  path: 'onboarding/status',
  keyPrefix: 'onboarding',
  staticParts: ['status'],
  dynamicParts: ({ params }) => [params.userId],
  defaults: { cache: 'no-store', auth: 'required', priority: 'high' },
});
