import type { BaseResume } from '@/lib/types/resumes';
import { defineQuery } from '@/lib/http/define-query';

export const useBaseResumeQuery = defineQuery<{ id: string }, BaseResume>({
  path: ({ id }) => `/api/resumes/base/${id}`,
  keyPrefix: 'resumes',
  staticParts: ['base'],
  dynamicParts: ({ id }) => [id],
  defaults: { 
    cache: 'no-store',
    priority: 'high',
  },
});
