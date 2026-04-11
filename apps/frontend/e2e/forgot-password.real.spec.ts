import { expect, test } from '@playwright/test';

import {
  completeForgotPasswordReset,
  resolveForgotPasswordCycle,
  signOutFromDevButton,
  submitForgotPasswordEmail,
} from './helpers/auth/forgot-password';
import {
  getForgotPasswordE2EEnv,
  getClerkTestVerificationCode,
  hasForgotPasswordE2EEnv,
} from './helpers/env';

/**
 * Real browser proof for the forgot-password happy path using Clerk test credentials.
 * The suite resets from the baseline password to the alternate password and then restores
 * the original password so the dedicated reset account stays reusable across runs.
 */
const isConfigured = hasForgotPasswordE2EEnv();

test.describe.serial('Real Clerk forgot-password flow', () => {
  test.describe.configure({ timeout: 120_000 });

  test.skip(
    !isConfigured,
    'Configure the Clerk/Gmail E2E env vars before running the real forgot-password suite.',
  );

  test('completes the real Clerk forgot-password happy path', async ({
    page,
  }) => {
    if (!isConfigured) {
      test.skip();
      return;
    }

    const e2eEnv = getForgotPasswordE2EEnv();
    const passwordCycle = resolveForgotPasswordCycle({
      passwordA: e2eEnv.clerkPasswordA,
      passwordB: e2eEnv.clerkPasswordB,
    });

    await signOutFromDevButton({ page });

    await submitForgotPasswordEmail({
      page,
      email: e2eEnv.clerkForgotPasswordTestEmail,
    });

    const resetCode = getClerkTestVerificationCode();

    await completeForgotPasswordReset({
      page,
      code: resetCode,
      password: passwordCycle.resetPassword,
    });

    await page.waitForURL((url) => {
      const pathname = new URL(url.toString()).pathname;
      return pathname !== '/forgot-password' && pathname !== '/login';
    });

    await expect(
      page.getByRole('button', { name: 'Sign out current session' }),
    ).toBeVisible();

    await signOutFromDevButton({ page });

    await submitForgotPasswordEmail({
      page,
      email: e2eEnv.clerkForgotPasswordTestEmail,
    });

    await completeForgotPasswordReset({
      page,
      code: resetCode,
      password: passwordCycle.restorePassword,
    });

    await page.waitForURL((url) => {
      const pathname = new URL(url.toString()).pathname;
      return pathname !== '/forgot-password' && pathname !== '/login';
    });

    await expect(
      page.getByRole('button', { name: 'Sign out current session' }),
    ).toBeVisible();
  });
});
