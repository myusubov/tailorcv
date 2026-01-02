import type { GetOnboardingJobOutput } from '@/lib/types/onboarding';
import { defineClientGet } from '@/lib/http/define-client-get';
import { defineStream } from '@/lib/http/define-stream';
import { defineQuery } from '@/lib/http/define-query';

export const getOnboardingJobClient = defineClientGet<
  { id: string },
  GetOnboardingJobOutput
>({
  path: ({ id }) => `/api/onboarding/jobs/${id}`,
  keyPrefix: 'onboarding-jobs',
  dynamicParts: ({ id }) => [id],
  defaults: { cache: 'no-store' },
});

export const useOnboardingJobQuery = defineQuery(getOnboardingJobClient);

export const getOnboardingJobStream = defineStream<
  { id: string },
  GetOnboardingJobOutput
>({
  path: ({ id }) => `/api/onboarding/jobs/${id}/stream`,
  streamKey: 'onboarding-jobs-stream',
});
