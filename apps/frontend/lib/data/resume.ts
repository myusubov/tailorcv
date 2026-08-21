import { defineGet } from './_query';
import type { GetResumeInput, GetResumeOutput } from '@/lib/types/resumes';

export const getResume = defineGet<GetResumeInput, GetResumeOutput>({
  path: ({ id }) => `resumes/base/${id}`,
  keyPrefix: 'resume',
  dynamicParts: ({ id }) => [id],
  defaults: { cache: 'no-store', auth: 'required' },
});
