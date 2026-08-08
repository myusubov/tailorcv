import { expect, Page } from '@playwright/test';

import { verifyForgotPasswordResetCode } from './otp';

const EMAIL_TYPE_MAX_ATTEMPTS = 3;
const EMAIL_TYPE_KEY_DELAY_MS = 30;
const EMAIL_TYPE_RETRY_DELAY_MS = 250;

interface SubmitForgotPasswordEmailArgs {
  page: Page;
  email: string;
}

interface CompleteForgotPasswordResetArgs {
  page: Page;
  code: string;
  password: string;
}

interface CompleteForgotPasswordResetWithCandidatesArgs {
  page: Page;
  code: string;
  passwords: string[];
}

interface SubmitInvalidResetPasswordArgs {
  page: Page;
  password: string;
}

interface ResolveForgotPasswordCycleArgs {
  passwordA: string;
  passwordB: string;
}

/**
 * Opens the forgot-password page, enters the target email, and waits for the reset-code UI.
 * The helper stabilizes the email field before submit so hydration does not race the first step.
 */
export async function submitForgotPasswordEmail({
  page,
  email,
}: SubmitForgotPasswordEmailArgs) {
  await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });

  const emailInput = page.getByLabel('Email');
  const sendResetCodeButton = page.getByRole('button', {
    name: 'Send Reset Code',
  });

  await expect(emailInput).toBeVisible();
  await expect(emailInput).toBeEditable();
  await expect(sendResetCodeButton).toBeVisible();
  for (let attempt = 0; attempt < EMAIL_TYPE_MAX_ATTEMPTS; attempt += 1) {
    await emailInput.click();
    await emailInput.fill('');
    await emailInput.pressSequentially(email, {
      delay: EMAIL_TYPE_KEY_DELAY_MS,
    });

    if ((await emailInput.inputValue()) === email) {
      break;
    }

    if (attempt < EMAIL_TYPE_MAX_ATTEMPTS - 1) {
      await page.waitForTimeout(EMAIL_TYPE_RETRY_DELAY_MS);
    }
  }

  await expect(emailInput).toHaveValue(email);
  await sendResetCodeButton.click();

  await expect(page.getByRole('textbox', { name: 'Reset code' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verify Code' })).toBeVisible();
}

/**
 * Completes the happy-path forgot-password reset using one known new password.
 */
export async function completeForgotPasswordReset({
  page,
  code,
  password,
}: CompleteForgotPasswordResetArgs) {
  await verifyForgotPasswordResetCode({
    page,
    code,
  });

  await expect(page.getByLabel('New password')).toBeVisible();

  await page.getByLabel('New password').fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Reset Password' }).click();
}

/**
 * Returns the deterministic password rotation used by the dedicated forgot-password account.
 * The suite always resets from password A to B and then restores back to A.
 */
export function resolveForgotPasswordCycle({
  passwordA,
  passwordB,
}: ResolveForgotPasswordCycleArgs) {
  return {
    resetPassword: passwordB,
    restorePassword: passwordA,
  };
}

/**
 * Attempts the forgot-password reset with multiple candidate passwords and returns
 * the first password that successfully completes the flow.
 */
export async function completeForgotPasswordResetWithCandidates({
  page,
  code,
  passwords,
}: CompleteForgotPasswordResetWithCandidatesArgs) {
  await verifyForgotPasswordResetCode({
    page,
    code,
  });

  const newPasswordInput = page.getByLabel('New password');
  const confirmPasswordInput = page.getByLabel('Confirm password');
  const resetPasswordButton = page.getByRole('button', {
    name: 'Reset Password',
  });

  await expect(newPasswordInput).toBeVisible();

  for (const password of passwords) {
    await newPasswordInput.fill(password);
    await confirmPasswordInput.fill(password);
    await resetPasswordButton.click();

    const submissionResult = await Promise.race([
      page
        .waitForURL((url) => {
          const pathname = new URL(url.toString()).pathname;
          return pathname !== '/forgot-password' && pathname !== '/login';
        }, { timeout: 8_000 })
        .then(() => 'success' as const)
        .catch(() => null),
      page
        .locator('.bg-danger-soft')
        .first()
        .waitFor({ state: 'visible', timeout: 3_000 })
        .then(() => 'retry' as const)
        .catch(() => null),
    ]);

    if (submissionResult === 'success') {
      return password;
    }
  }

  throw new Error(
    'Could not reset the shared Clerk test user with any configured password candidate.',
  );
}

/**
 * Submits a password known to be invalid so the policy-error path can be asserted.
 */
export async function submitInvalidResetPassword({
  page,
  password,
}: SubmitInvalidResetPasswordArgs) {
  await expect(page.getByLabel('New password')).toBeVisible();

  await page.getByLabel('New password').fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Reset Password' }).click();
}
