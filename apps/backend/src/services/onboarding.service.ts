import { prisma } from '../lib';
import type {
  GetOnboardingStatusInput,
  OnboardingStatus,
} from '../types/onboarding';

/**
 * Checks whether the authenticated user has completed onboarding.
 * @param input - User Clerk ID used to find the latest base resume.
 * @returns Onboarding completion state and latest base resume ID when present.
 * @sideEffects Reads base resume metadata from the database.
 */
export async function getOnboardingStatus(
  input: GetOnboardingStatusInput,
): Promise<OnboardingStatus> {
  const latestBaseResume = await prisma.baseResume.findFirst({
    where: { userId: input.clerkUserId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  return {
    hasBaseResume: Boolean(latestBaseResume),
    latestBaseResumeId: latestBaseResume?.id ?? null,
  };
}
