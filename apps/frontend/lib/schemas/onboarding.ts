import { z } from 'zod';
import { baseResumeDataSchema, type BaseResumeData } from 'shared';

export const onboardingStatusSchema = z.object({
  onboardingCompletedAt: z.iso.datetime().nullable(),
});

/**
 * Onboarding uses the same schema as the base resume data.
 * This ensures a single source of truth across the application.
 */
export const onboardingSchema = baseResumeDataSchema;
export type OnboardingFormInput = BaseResumeData;
export type OnboardingFormValues = BaseResumeData;
