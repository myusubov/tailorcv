import { expect, test } from '@playwright/test';

import {
  getLoginE2EEnv,
  hasLoginE2EEnv,
} from './helpers/env';
import { attemptRealLogin } from './helpers/auth/login-recovery';

/**
 * Real browser proof for the dedicated password-login Clerk test user.
 * The spec validates one fixed-password sign-in journey and records whether
 * Client Trust email verification was required during the attempt.
 */
const isConfigured = hasLoginE2EEnv();

test.describe.serial('Real Clerk login flow', () => {
  test.describe.configure({ timeout: 180_000 });

  test.skip(
    !isConfigured,
    'Configure the dedicated login E2E env vars before running the real login suite.',
  );

  test('completes a real password login and records Client Trust when Clerk requires it', async ({
    page,
  }) => {
    if (!isConfigured) {
      test.skip();
      return;
    }

    const e2eEnv = getLoginE2EEnv();

    const loginResult = await attemptRealLogin({
      page,
      email: e2eEnv.clerkLoginTestEmail,
      password: e2eEnv.clerkPassword,
    });

    expect(['signed_in', 'signed_in_after_client_trust']).toContain(
      loginResult.outcome,
    );
    expect(loginResult.usedEmailCodeVerification).toBe(
      loginResult.outcome === 'signed_in_after_client_trust',
    );
    await expect(
      page.getByRole('button', { name: 'Sign out current session' }),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/login|\/forgot-password/);
  });
});
