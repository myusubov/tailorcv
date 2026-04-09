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

export async function submitForgotPasswordEmail({
  page,
  email,
}: SubmitForgotPasswordEmailArgs) {
  await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });

  // Why: Clerk's forgot-password page can still be hydrating when Playwright
  // arrives, so we wait for the form controls and verify the email field value
  // before clicking to avoid submitting an empty identifier by race.
  const emailInput = page.getByLabel('Email');
  const sendResetCodeButton = page.getByRole('button', {
    name: 'Send Reset Code',
  });

  await expect(emailInput).toBeVisible();
  await expect(emailInput).toBeEditable();
  await expect(sendResetCodeButton).toBeVisible();
  // Why: The email field can be re-bound during app hydration, so we type and
  // verify the value in a short retry loop before submitting the form.
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

  // Why: The real Clerk reset flow can take a moment to advance from the email
  // entry step to the OTP verification step. Waiting for the reset-code UI
  // prevents later helpers from typing the OTP into the original email field.
  await expect(page.getByRole('textbox', { name: 'Reset code' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verify Code' })).toBeVisible();
}

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

// Why: The dedicated forgot-password test account keeps password A as the
// steady-state baseline, so the reset suite should always flip to B and then
// restore back to A instead of probing for whichever password happens to work.
export function resolveForgotPasswordCycle({
  passwordA,
  passwordB,
}: ResolveForgotPasswordCycleArgs) {
  return {
    resetPassword: passwordB,
    restorePassword: passwordA,
  };
}

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
        .locator('.bg-danger-50')
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

export async function submitInvalidResetPassword({
  page,
  password,
}: SubmitInvalidResetPasswordArgs) {
  await expect(page.getByLabel('New password')).toBeVisible();

  await page.getByLabel('New password').fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Reset Password' }).click();
}
