'use server';

import { defineAction } from './_action';
import type { UpdateResumeInput } from '@/lib/types/resumes';

export const updateResumeAction = defineAction<UpdateResumeInput, any>({
  method: 'PATCH',
  path: ({ id }) => `resumes/base/${id}`,
  keyPrefix: 'resumes', // Automatically invalidate any list queries
  revalidate: { fromKey: false },
});
