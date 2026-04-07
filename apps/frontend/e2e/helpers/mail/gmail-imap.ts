import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

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

interface LatestEmailCodeMatch {
  code: string;
  timestampMs: number;
}

function sleep({ ms }: { ms: number }) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeMailContent({ content }: { content: string }) {
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractEmailCode({ content }: { content: string }) {
  const normalizedContent = normalizeMailContent({ content });

  const anchoredPatterns = [
    /enter the following code when prompted[:\s]+(\d{6})/i,
    /enter the following verification code when prompted[:\s]+(\d{6})/i,
    /reset password code[:\s]+(\d{6})/i,
    /verification code[:\s]+(\d{6})/i,
    /(\d{6})\s+is your reset password code/i,
    /(\d{6})\s+is your verification code/i,
  ];

  for (const pattern of anchoredPatterns) {
    const match = normalizedContent.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  // Why: Clerk auth emails usually contain a single OTP, but we keep a generic
  // fallback so the helper still works if the surrounding copy changes slightly.
  const matches = normalizedContent.match(/\b(\d{6})\b/g);
  return matches?.at(-1) ?? null;
}

function extractEmailCodeFromSubject({ subject }: { subject?: string | null }) {
  if (!subject) return null;

  // Why: Clerk reset-password subjects already contain the OTP, so using the
  // envelope subject first avoids depending on full MIME parsing before we can
  // accept a valid reset email.
  const match = subject.match(/\b(\d{6})\b/);
  return match?.[1] ?? null;
}

function getMessageTimestamp({
  internalDate,
}: {
  internalDate?: Date | string;
}) {
  if (!internalDate) return null;

  const date =
    internalDate instanceof Date ? internalDate : new Date(internalDate);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function pollForEmailCode({
  emailAddress,
  imapUser,
  imapPassword,
  subject,
  startedAt,
  graceWindowMs = 60_000,
  timeoutMs,
  pollIntervalMs,
}: PollForEmailCodeArgs) {
  // Why: Clerk development test emails do not send real inbox messages, so
  // those auth flows should use Clerk's fixed test OTP instead of touching IMAP.
  if (isClerkTestEmail({ emailAddress })) {
    return getClerkTestVerificationCode();
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    logger: false,
    auth: {
      user: imapUser,
      pass: imapPassword,
    },
  });

  await client.connect();

  try {
    const deadline = Date.now() + timeoutMs;
    const earliestTimestampMs = startedAt - graceWindowMs;
    const startedAtDate = new Date(earliestTimestampMs);
    const normalizedSubject = subject?.toLowerCase();

    while (Date.now() < deadline) {
      const lock = await client.getMailboxLock('INBOX');

      try {
        const messages = await client.search({
          since: startedAtDate,
          to: emailAddress,
        });

        // Why: IMAP search can return `false` when nothing matches yet, so we
        // normalize the result before slicing/fetching and keep polling.
        if (!messages || messages.length === 0) {
          await sleep({ ms: pollIntervalMs });
          continue;
        }

        const recentMessageIds = messages.slice(-10).reverse();
        let latestMatch: LatestEmailCodeMatch | null = null;

        for await (const message of client.fetch(recentMessageIds, {
          envelope: true,
          source: true,
          internalDate: true,
        })) {
          const messageTimestamp = getMessageTimestamp({
            internalDate: message.internalDate,
          });

          if (
            !messageTimestamp ||
            messageTimestamp.getTime() < earliestTimestampMs
          ) {
            continue;
          }

          if (
            normalizedSubject &&
            !message.envelope?.subject?.toLowerCase().includes(normalizedSubject)
          ) {
            continue;
          }

          const resetCodeFromSubject = extractEmailCodeFromSubject({
            subject: message.envelope?.subject,
          });

          let resetCode = resetCodeFromSubject;

          if (!resetCode && message.source) {
            const parsed = await simpleParser(message.source);
            const content = [parsed.subject, parsed.text, parsed.html]
              .filter(Boolean)
              .join('\n');
            resetCode = extractEmailCode({ content });
          }

          if (
            resetCode &&
            (!latestMatch ||
              messageTimestamp.getTime() > latestMatch.timestampMs)
          ) {
            latestMatch = {
              code: resetCode,
              timestampMs: messageTimestamp.getTime(),
            };
          }
        }

        // Why: Gmail can return several matching Clerk emails for the same
        // inbox search, so the helper must choose the newest code in the
        // allowed window instead of returning whichever message happened to be
        // iterated first.
        if (latestMatch) {
          return latestMatch.code;
        }
      } finally {
        lock.release();
      }

      await sleep({ ms: pollIntervalMs });
    }

    throw new Error(
      `Timed out waiting for Clerk email code in Gmail inbox for ${emailAddress}`,
    );
  } finally {
    await client.logout().catch(() => undefined);
  }
}
