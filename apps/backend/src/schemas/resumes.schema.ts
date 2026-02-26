import { z } from 'zod';
import { baseResumeDataSchema } from 'shared';

export const resumeIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const createBaseResumeBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  data: baseResumeDataSchema,
});

export const updateBaseResumeBodySchema = z.object({
  data: baseResumeDataSchema,
  name: z.string().trim().min(1).optional(),
});

export type CreateBaseResumeBody = z.infer<typeof createBaseResumeBodySchema>;
export type UpdateBaseResumeBody = z.infer<typeof updateBaseResumeBodySchema>;
export type ResumeIdParams = z.infer<typeof resumeIdParamsSchema>;
