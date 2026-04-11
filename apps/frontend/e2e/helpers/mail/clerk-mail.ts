import { pollForEmailCode } from './gmail-imap';

interface PollForResetCodeArgs {
  emailAddress: string;
}
const RESET_PASSWORD_EMAIL_SUBJECT_FRAGMENT = 'reset password code';

/**
 * Resolves the reset-password verification code for Clerk test email accounts.
 */
export async function pollForResetCode({
  emailAddress,
}: PollForResetCodeArgs) {
  return await pollForEmailCode({
    emailAddress,
    subject: RESET_PASSWORD_EMAIL_SUBJECT_FRAGMENT,
  });
}
