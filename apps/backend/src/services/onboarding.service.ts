import { prisma } from '../lib';
import type {
  GetOnboardingStatusInput,
  OnboardingStatus,
} from '../types/onboarding';

/**
 * Returns when the user completed onboarding, or `null` if they have not or no
 * user row exists.
 */
export async function getOnboardingStatus(
  input: GetOnboardingStatusInput,
): Promise<OnboardingStatus> {
  const { clerkUserId } = input;

  const data = await prisma.user.findUnique({
    where: {
      clerkUserId,
    },
    select: {
      onboardingCompletedAt: true,
    },
  });

  return {
    onboardingCompletedAt: data?.onboardingCompletedAt ?? null,
  };
}
