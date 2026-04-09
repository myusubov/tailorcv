import { expect, test } from '@playwright/test';

import { getClerkTestVerificationCode, generateSignUpTestEmail } from './helpers/env';
import { fillOtpCode } from './helpers/auth/otp';

test.describe.serial('Real Clerk sign-up flow', () => {
  test.describe.configure({ timeout: 180_000 });

  test('completes a real email sign-up and OTP verification', async ({
    page,
  }) => {
    const signUpEmail = generateSignUpTestEmail();
    const signUpPassword = `E2E-${Date.now()}-Safe!9`;

    await page.goto('/register', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await expect(page.getByLabel('First name')).toBeVisible();
    await expect(page.getByLabel('Last name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    const firstNameInput = page.getByLabel('First name');
    const lastNameInput = page.getByLabel('Last name');
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    const termsCheckboxInput = page.locator('input[type="checkbox"]').first();
    const createAccountButton = page.getByRole('button', {
      name: 'Create Account',
    });

    await firstNameInput.fill('E2E');
    await expect(firstNameInput).toHaveValue('E2E');
    await lastNameInput.fill('Signup');
    await expect(lastNameInput).toHaveValue('Signup');
    await emailInput.fill(signUpEmail);
    await expect(emailInput).toHaveValue(signUpEmail);
    await passwordInput.fill(signUpPassword);
    await expect(passwordInput).toHaveValue(signUpPassword);
    await termsCheckboxInput.setChecked(true, { force: true });
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
