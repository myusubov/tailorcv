import type { BaseResume } from '@/lib/types/resumes';
import { defineClientGet } from '@/lib/http/define-client-get';
import { defineQuery } from '@/lib/http/define-query';

export const getBaseResumeClient = defineClientGet<{ id: string }, BaseResume>({
  path: ({ id }) => `/api/resumes/base/${id}`,
  keyPrefix: 'resumes',
  staticParts: ['base'],
  dynamicParts: ({ id }) => [id],
  defaults: { cache: 'no-store' },
});

export const useBaseResumeQuery = defineQuery(getBaseResumeClient);

