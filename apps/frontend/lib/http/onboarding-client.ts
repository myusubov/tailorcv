import type { GetOnboardingJobOutput } from '@/lib/types/onboarding';
import { defineClientGet } from '@/lib/http/define-client-get';

export const getOnboardingJobClient = defineClientGet<
  { id: string },
  GetOnboardingJobOutput
>({
  path: ({ id }) => `/api/onboarding/jobs/${id}`,
  keyPrefix: 'onboarding-jobs',
  dynamicParts: ({ id }) => [id],
  defaults: { cache: 'no-store' },
});

