import type { GetOnboardingJobOutput } from '@/lib/types/onboarding';
import { defineStream } from '@/lib/http/define-stream';
import { defineQuery } from '@/lib/http/define-query';

export const useOnboardingJobQuery = defineQuery<
  { id: string },
  GetOnboardingJobOutput
>({
  path: ({ id }) => `/api/onboarding/jobs/${id}`,
  keyPrefix: 'onboarding-jobs',
  dynamicParts: ({ id }) => [id],
  defaults: { cache: 'no-store' },
});

export const getOnboardingJobStream = defineStream<
  { id: string },
  GetOnboardingJobOutput
>({
  path: ({ id }) => `/api/onboarding/jobs/${id}/stream`,
  streamKey: 'onboarding-jobs-stream',
});
