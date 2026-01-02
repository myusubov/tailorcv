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

export const onboardingGithubBodySchema = z.object({
  repositoryIds: z.array(z.string().min(1)).min(1),
});

export type OnboardingGithubBody = z.infer<typeof onboardingGithubBodySchema>;
