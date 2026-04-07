import { Page } from '@playwright/test';

import { isClerkTestEmail } from '../env';
import { pollForResetCode } from '../mail/clerk-mail';
import {
  completeForgotPasswordReset,
  submitForgotPasswordEmail,
} from './forgot-password-flow';
import {
  attemptRealLogin,
  resolvePasswordRotation,
} from './login-recovery';

interface EnsureRecoverablePasswordPairArgs {
  page: Page;
  email: string;
  passwordA: string;
  passwordB: string;
  gmailImapUser: string;
  gmailImapPassword: string;
  mailTimeoutMs: number;
  mailPollIntervalMs: number;
}

interface RecoverablePasswordPair {
  currentPassword: string;
  nextPassword: string;
  currentPasswordOutcome:
    | 'signed_in'
    | 'signed_in_after_client_trust'
    | 'reset_required';
}

export async function ensureRecoverablePasswordPair({
  page,
  email,
  passwordA,
  passwordB,
  gmailImapUser,
  gmailImapPassword,
  mailTimeoutMs,
  mailPollIntervalMs,
}: EnsureRecoverablePasswordPairArgs): Promise<RecoverablePasswordPair | null> {
  try {
    return await resolvePasswordRotation({
      page,
      email,
      passwordA,
      passwordB,
      gmailImapUser,
      gmailImapPassword,
      mailTimeoutMs,
      mailPollIntervalMs,
    });
  } catch {
    if (isClerkTestEmail({ emailAddress: email })) {
      // Why: Clerk test-email users can use a fixed verification code without
      // inbox polling, so the recovery helper can fall back to direct password
      // attempts instead of forcing the older reset-recovery path.
      for (const [currentPassword, nextPassword] of [
        [passwordA, passwordB] as const,
        [passwordB, passwordA] as const,
      ]) {
        const loginResult = await attemptRealLogin({
          page,
          email,
          password: currentPassword,
          gmailImapUser,
          gmailImapPassword,
          mailTimeoutMs,
          mailPollIntervalMs,
        });

        if (
          loginResult.outcome === 'signed_in' ||
          loginResult.outcome === 'signed_in_after_client_trust' ||
          loginResult.outcome === 'reset_required'
        ) {
          const currentPasswordOutcome =
            loginResult.outcome === 'reset_required'
              ? 'reset_required'
              : loginResult.outcome;

          return {
            currentPassword,
            nextPassword,
            currentPasswordOutcome,
          };
        }
      }

      return null;
    }

    try {
      // Why: The shared Clerk E2E account can drift into a state where neither
      // configured password is currently usable. A password-reset recovery step
      // restores a known baseline without introducing a second dedicated test user.
      const resetStartedAt = Date.now();

      await submitForgotPasswordEmail({
        page,
        email,
      });

      const resetCode = await pollForResetCode({
        emailAddress: email,
        imapUser: gmailImapUser,
        imapPassword: gmailImapPassword,
        startedAt: resetStartedAt,
        timeoutMs: mailTimeoutMs,
        pollIntervalMs: mailPollIntervalMs,
      });

      await completeForgotPasswordReset({
        page,
        code: resetCode,
        password: passwordA,
      });

      return {
        currentPassword: passwordA,
        nextPassword: passwordB,
        currentPasswordOutcome: 'signed_in' as const,
      };
    } catch {
      return null;
    }
  }
}
