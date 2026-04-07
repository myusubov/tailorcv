import {
  getClerkTestVerificationCode,
  isClerkTestEmail,
} from '../env';

interface PollForEmailCodeArgs {
  emailAddress: string;
  imapUser: string;
  imapPassword: string;
  subject?: string;
  startedAt: number;
  graceWindowMs?: number;
  timeoutMs: number;
  pollIntervalMs: number;
}

export async function pollForEmailCode({
  emailAddress,
  imapUser: _imapUser,
  imapPassword: _imapPassword,
  subject: _subject,
  startedAt: _startedAt,
  graceWindowMs: _graceWindowMs = 60_000,
  timeoutMs: _timeoutMs,
  pollIntervalMs: _pollIntervalMs,
}: PollForEmailCodeArgs) {
  // Why: Clerk development test emails do not send real inbox messages, so
  // those auth flows should use Clerk's fixed test OTP instead of touching IMAP.
  if (isClerkTestEmail({ emailAddress })) {
    return getClerkTestVerificationCode();
  }

  // Why: Auth E2E now relies on Clerk test inboxes only, so the old Gmail IMAP
  // polling path and its dependencies are intentionally disabled.
  throw new Error(
    `Non-Clerk test email polling is no longer supported for ${emailAddress}.`,
  );
}
