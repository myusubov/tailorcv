import 'server-only';

import { defineGet } from './_query';

import type { GetResumeInput, GetResumeOutput } from '@/lib/types/resumes';

export const getResume = defineGet<GetResumeInput, GetResumeOutput>({
  path: ({ params: { id } }) => `resumes/${id}`,
  keyPrefix: 'resume',
  dynamicParts: ({ params: { id } }) => [id],
  defaults: { cache: 'no-store', auth: 'required' },
});
