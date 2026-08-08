import { expect, test } from '@playwright/test';

import {
  signOutFromDevButton,
  submitForgotPasswordEmail,
  submitInvalidResetPassword,
  verifyForgotPasswordResetCode,
} from './helpers/auth/forgot-password';
import {
  getClerkTestVerificationCode,
  getForgotPasswordE2EEnv,
  hasForgotPasswordE2EEnv,
} from './helpers/env';

const isConfigured = hasForgotPasswordE2EEnv();

test.describe.serial('Real Clerk forgot-password policy flow', () => {
  test.describe.configure({ timeout: 120_000 });

  test.skip(
    !isConfigured,
    'Configure the dedicated forgot-password E2E env vars before running the real forgot-password policy suite.',
  );

  test('shows Clerk password-policy errors during real reset attempts', async ({
    page,
  }) => {
    if (!isConfigured) {
      test.skip();
      return;
    }

    const e2eEnv = getForgotPasswordE2EEnv();

    await signOutFromDevButton({ page });

    await submitForgotPasswordEmail({
      page,
      email: e2eEnv.clerkForgotPasswordTestEmail,
    });

    await verifyForgotPasswordResetCode({
      page,
      code: getClerkTestVerificationCode(),
    });

    await submitInvalidResetPassword({
      page,
      password: e2eEnv.invalidResetPassword,
    });

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.locator('.bg-danger-soft')).toBeVisible({ timeout: 10_000 });
  });
});
