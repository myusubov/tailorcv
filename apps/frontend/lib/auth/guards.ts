import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { getOnboardingStatus } from '@/lib/data/onboarding';
import { onboardingStatusSchema } from '@/lib/schemas/onboarding';
import { redirect } from 'next/navigation';
import { env, ROUTES } from '../config';

/** Protects the route with `auth.protect()` and returns the signed-in user's id. */
export async function requireUser() {
  const { userId } = await auth.protect();
  return userId;
}

async function getOnboardingCompletedAt(userId: string) {
  const status = await getOnboardingStatus({
    params: {
      userId,
    },
  });

  if (!status.ok) {
    if (status.status === 401) {
      redirect(env.NEXT_PUBLIC_CLERK_SIGN_IN_URL);
    } else {
      console.error('Failed to fetch onboarding status:', status);
      throw new Error('Failed to fetch onboarding status');
    }
  }

  const parsed = onboardingStatusSchema.safeParse(status.data);

  if (!parsed.success) {
    console.error('Invalid onboarding status response:', status.data);
    throw new Error('Invalid onboarding status');
  }

  return parsed.data.onboardingCompletedAt;
}

/**
 * Redirects a user who has not completed onboarding to `/onboarding`.
 * A 401 from the status call redirects to sign-in; any other failure to verify the
 * status throws, so the error boundary shows a retry.
 */
export async function requireOnboardedUser() {
  const userId = await requireUser();

  if ((await getOnboardingCompletedAt(userId)) === null) {
    redirect(ROUTES.ONBOARDING);
  }
}

/**
 * Redirects a user who has already completed onboarding to `/resumes`.
 * A 401 from the status call redirects to sign-in; any other failure to verify the
 * status throws, so the error boundary shows a retry.
 */
export async function requireNotOnboardedUser() {
  const userId = await requireUser();

  if ((await getOnboardingCompletedAt(userId)) !== null) {
    redirect(ROUTES.RESUMES);
  }
}

/** Redirects a signed-in user to `/resumes`, so they never see the auth pages. */
export async function redirectIfSignedIn() {
  const { userId } = await auth();
  if (userId) {
    redirect(ROUTES.RESUMES);
  }
}
