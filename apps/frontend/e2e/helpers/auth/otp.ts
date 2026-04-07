import { expect, Page } from '@playwright/test';

interface FillOtpCodeArgs {
  page: Page;
  code: string;
}

interface VerifyForgotPasswordResetCodeArgs {
  page: Page;
  code: string;
}

export async function fillOtpCode({
  page,
  code,
}: FillOtpCodeArgs) {
  const textboxes = page.getByRole('textbox');
  const textboxCount = await textboxes.count();

  // Why: HeroUI's OTP control exposes a single textbox in the browser tree even
  // though the UI renders six visual slots, so the test should fill the actual
  // textbox when only one exists.
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

export async function verifyForgotPasswordResetCode({
  page,
  code,
}: VerifyForgotPasswordResetCodeArgs) {
  // Why: Clerk renders the reset-code step through the same OTP control
  // pattern as the passing happy-path flow, so both tests need the same
  // browser interaction instead of mixing `.fill()` with OTP keypresses.
  await fillOtpCode({
    page,
    code,
  });

  const verifyCodeButton = page.getByRole('button', { name: 'Verify Code' });
  await expect(verifyCodeButton).toBeEnabled();
  await verifyCodeButton.click();
}
