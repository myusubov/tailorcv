import { z } from 'zod';
import { baseResumeDataSchema } from 'shared';

/**
 * Schema for onboarding generate endpoint body.
 * Extends baseResumeDataSchema with optional model field.
 */
export const onboardingGenerateBaseBodySchema = baseResumeDataSchema.extend({
  model: z.string().trim().min(1).optional(),
});

export type OnboardingGenerateBaseBody = z.infer<
  typeof onboardingGenerateBaseBodySchema
>;

export const onboardingGithubBodySchema = z.object({
  repositoryIds: z.array(z.string().min(1)).min(1).max(5),
});

export type OnboardingGithubBody = z.infer<typeof onboardingGithubBodySchema>;
