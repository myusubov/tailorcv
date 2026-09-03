import { expect, Page } from '@playwright/test';

interface FillOtpCodeArgs {
  page: Page;
  code: string;
}

interface VerifyForgotPasswordResetCodeArgs {
  page: Page;
  code: string;
}

/**
 * Enters a six-digit auth code into the current OTP UI.
 * The helper supports both HeroUI's single-textbox OTP control and fallback
 * multi-input numeric OTP layouts used by auth verification screens.
 */
export async function fillOtpCode({ page, code }: FillOtpCodeArgs) {
  const textboxes = page.getByRole('textbox');
  const textboxCount = await textboxes.count();

  if (textboxCount === 1) {
    await textboxes.first().click();
    await textboxes.first().fill('');
    await textboxes.first().pressSequentially(code, { delay: 50 });
    await textboxes.first().blur();
    return;
  }

  const otpInputs = page.locator('input[inputmode="numeric"]');
  await expect(otpInputs.first()).toBeVisible();

  for (const [index, digit] of code.split('').entries()) {
    await otpInputs.nth(index).fill(digit);
  }
}

/**
 * Completes the forgot-password reset-code step using the shared OTP interaction helper.
 */
export async function verifyForgotPasswordResetCode({
  page,
  code,
}: VerifyForgotPasswordResetCodeArgs) {
  await fillOtpCode({
    page,
    code,
  });

  const verifyCodeButton = page.getByRole('button', { name: 'Verify Code' });
  await expect(verifyCodeButton).toBeEnabled();
  await verifyCodeButton.click();
}
