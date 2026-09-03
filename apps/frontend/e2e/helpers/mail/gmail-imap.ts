import { getClerkTestVerificationCode, isClerkTestEmail } from '../env';

interface PollForEmailCodeArgs {
  emailAddress: string;
  subject?: string;
}

/**
 * Resolves the verification code for auth E2E inbox flows.
 * The current auth test stack only supports Clerk's fixed-OTP test emails, so
 * non-Clerk mailbox polling remains intentionally disabled.
 */
export async function pollForEmailCode({
  emailAddress,
  subject: _subject,
}: PollForEmailCodeArgs) {
  if (isClerkTestEmail({ emailAddress })) {
    return getClerkTestVerificationCode();
  }

  throw new Error(
    `Non-Clerk test email polling is no longer supported for ${emailAddress}.`,
  );
}
