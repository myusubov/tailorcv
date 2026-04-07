import { pollForEmailCode } from './gmail-imap';

interface PollForResetCodeArgs {
  emailAddress: string;
  imapUser: string;
  imapPassword: string;
  startedAt: number;
  timeoutMs: number;
  pollIntervalMs: number;
}

const RESET_PASSWORD_EMAIL_SUBJECT_FRAGMENT = 'reset password code';
const RESET_PASSWORD_EMAIL_GRACE_WINDOW_MS = 15 * 60_000;
const RESET_PASSWORD_FRESH_EMAIL_TIMEOUT_MS = 25_000;

export async function pollForResetCode({
  emailAddress,
  imapUser,
  imapPassword,
  startedAt,
  timeoutMs,
  pollIntervalMs,
}: PollForResetCodeArgs) {
  // Why: Clerk's reset email subject contains the one-time code, so matching on
  // the stable subject fragment is resilient while the old UI-title matcher is not.
  // Clerk can also reuse the newest valid reset code, so the reset poller needs
  // a wider bounded grace window than sign-in verification emails do. We still
  // prefer a truly fresh reset email first so earlier reset codes from password
  // rotation do not win the race before Clerk delivers the new message.
  try {
    return await pollForEmailCode({
      emailAddress,
      imapUser,
      imapPassword,
      subject: RESET_PASSWORD_EMAIL_SUBJECT_FRAGMENT,
      startedAt,
      graceWindowMs: 0,
      timeoutMs: Math.min(timeoutMs, RESET_PASSWORD_FRESH_EMAIL_TIMEOUT_MS),
      pollIntervalMs,
    });
  } catch {
    return pollForEmailCode({
      emailAddress,
      imapUser,
      imapPassword,
      subject: RESET_PASSWORD_EMAIL_SUBJECT_FRAGMENT,
      startedAt,
      graceWindowMs: RESET_PASSWORD_EMAIL_GRACE_WINDOW_MS,
      timeoutMs,
      pollIntervalMs,
    });
  }
}
