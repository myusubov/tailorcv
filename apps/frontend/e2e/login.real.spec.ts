import { expect, test } from '@playwright/test';

import {
  getLoginE2EEnv,
  hasLoginE2EEnv,
} from './helpers/env';
import { attemptRealLogin } from './helpers/auth/login-recovery';

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

    // Why: The dedicated login-only Clerk test user has one fixed password, so
    // this spec should prove a single direct sign-in instead of mutating or
    // probing account state before the real login attempt.
    const loginResult = await attemptRealLogin({
      page,
      email: e2eEnv.clerkLoginTestEmail,
      password: e2eEnv.clerkPassword,
      gmailImapUser: '',
      gmailImapPassword: '',
      mailTimeoutMs: 10_000,
      mailPollIntervalMs: 500,
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
