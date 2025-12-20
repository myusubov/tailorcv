import { z } from 'zod';
import { onboardingSchema } from 'shared';

export const onboardingGenerateBaseBodySchema = onboardingSchema
  .safeExtend({
    model: z.string().trim().min(1).optional(),
  })
  .strict();

export type OnboardingGenerateBaseBody = z.infer<
  typeof onboardingGenerateBaseBodySchema
>;
