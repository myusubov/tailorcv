import { z } from 'zod';
import { onboardingSchema } from 'shared';

export const onboardingGenerateBaseBodySchema = onboardingSchema
  .extend({
    model: z.string().trim().min(1).optional(),
  })
  .strict();

export type OnboardingGenerateBaseBody = z.infer<
  typeof onboardingGenerateBaseBodySchema
>;
