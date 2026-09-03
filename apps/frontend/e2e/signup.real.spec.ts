import { expect, test } from '@playwright/test';

import {
  getClerkTestVerificationCode,
  generateSignUpTestEmail,
} from './helpers/env';
import { fillOtpCode } from './helpers/auth/otp';

test.describe.serial('Real Clerk sign-up flow', () => {
  test.describe.configure({ timeout: 180_000 });

  test('completes a real email sign-up and OTP verification', async ({
    page,
  }) => {
    const signUpEmail = generateSignUpTestEmail();
    const signUpPassword = `E2E-${Date.now()}-Safe!9`;

    await page.goto('/register', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /^(Start with your story\.|Create account)$/,
      }),
    ).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(
      page.getByLabel('Confirm password', { exact: true }),
    ).toBeVisible();
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password', { exact: true });
    const confirmPasswordInput = page.getByLabel('Confirm password', {
      exact: true,
    });
    const termsCheckboxInput = page.getByRole('checkbox', {
      name: /terms|agree/i,
    });
    const termsCheckboxControl = page
      .locator('label[data-slot="checkbox"]')
      .filter({ hasText: /terms|agree/i })
      .locator('[data-slot="checkbox-control"]');
    const createAccountButton = page.getByRole('button', {
      name: 'Create Account',
    });

    await emailInput.fill(signUpEmail);
    await expect(emailInput).toHaveValue(signUpEmail);
    await passwordInput.fill(signUpPassword);
    await expect(passwordInput).toHaveValue(signUpPassword);
    await confirmPasswordInput.fill(signUpPassword);
    await expect(confirmPasswordInput).toHaveValue(signUpPassword);
    await termsCheckboxControl.click();
    if (!(await termsCheckboxInput.isChecked())) {
      await termsCheckboxInput.focus();
      await page.keyboard.press('Space');
    }
    await expect(termsCheckboxInput).toBeChecked();
    await expect(createAccountButton).toBeEnabled();
    await createAccountButton.click();

    await expect(
      page.getByRole('button', { name: 'Verify Email' }),
    ).toBeVisible();

    await fillOtpCode({
      page,
      code: getClerkTestVerificationCode(),
    });
    await page.getByRole('button', { name: 'Verify Email' }).click();

    await page.waitForURL(/\/onboarding/);
    await expect(
      page.getByRole('button', { name: 'Sign out current session' }),
    ).toBeVisible();
  });
});
