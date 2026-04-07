import { expect, Page } from '@playwright/test';

import { pollForEmailCode } from '../mail/gmail-imap';
import { fillOtpCode } from './otp';

interface ResolvePasswordRotationArgs {
  page: Page;
  email: string;
  passwordA: string;
  passwordB: string;
  gmailImapUser: string;
  gmailImapPassword: string;
  mailTimeoutMs: number;
  mailPollIntervalMs: number;
}

type LoginAttemptResult =
  | 'success'
  | 'failure'
  | 'reset_required'
  | 'unsupported_second_factor'
  | 'retry';

export type RealLoginOutcome =
  | 'signed_in'
  | 'signed_in_after_client_trust'
  | 'reset_required'
  | 'invalid_credentials'
  | 'unsupported_second_factor'
  | 'retry';

interface ResolveLoginOutcomeArgs {
  attempt: LoginAttemptResult;
  usedEmailCodeVerification: boolean;
}

interface LoginAttemptState {
  attempt: LoginAttemptResult;
  usedEmailCodeVerification: boolean;
}

interface AttemptRealLoginArgs {
  page: Page;
  email: string;
  password: string;
  gmailImapUser: string;
  gmailImapPassword: string;
  mailTimeoutMs: number;
  mailPollIntervalMs: number;
}

interface AttemptRealLoginResult {
  outcome: RealLoginOutcome;
  usedEmailCodeVerification: boolean;
}

interface ActivePasswordPair {
  currentPassword: string;
  nextPassword: string;
  currentPasswordOutcome:
    | 'signed_in'
    | 'signed_in_after_client_trust'
    | 'reset_required';
}

interface ResolveNextPasswordFromAttemptsArgs {
  passwordA: string;
  passwordB: string;
  attemptA: LoginAttemptResult;
  attemptB: LoginAttemptResult;
}

async function sleep({
  ms,
}: {
  ms: number;
}) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForLoginFormReady({ page }: { page: Page }) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-auth-ready="true"]')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
}

// Why: Real Clerk login automation needs a stable public result model so specs
// can distinguish direct success, Client Trust completion, and forced reset
// redirects without re-parsing raw browser state in each test.
export function resolveLoginOutcome({
  attempt,
  usedEmailCodeVerification,
}: ResolveLoginOutcomeArgs): RealLoginOutcome {
  if (attempt === 'success') {
    return usedEmailCodeVerification
      ? 'signed_in_after_client_trust'
      : 'signed_in';
  }

  if (attempt === 'failure') {
    return 'invalid_credentials';
  }

  return attempt;
}

async function loginWithPassword({
  page,
  email,
  password,
  gmailImapUser,
  gmailImapPassword,
  mailTimeoutMs,
  mailPollIntervalMs,
}: {
  page: Page;
  email: string;
  password: string;
  gmailImapUser: string;
  gmailImapPassword: string;
  mailTimeoutMs: number;
  mailPollIntervalMs: number;
}): Promise<LoginAttemptState> {
  await waitForLoginFormReady({ page });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  const navigationResult = await Promise.race([
    page
      .waitForURL(/\/login\?/, { timeout: 8_000 })
      .then(() => 'retry' as const)
      .catch(() => null),
    page
      .waitForURL(
        (url) => {
          const pathname = new URL(url.toString()).pathname;
          return pathname !== '/login';
        },
        { timeout: 8_000 },
      )
      .then(() => {
        const pathname = new URL(page.url()).pathname;
        return pathname === '/forgot-password'
          ? ('reset_required' as const)
          : ('success' as const);
      })
      .catch(() => null),
    page
      .getByText(/verify your identity/i)
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => 'second_factor_email_code' as const)
      .catch(() => null),
    page
      .getByText(/invalid email or password|please contact support/i)
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => 'failure' as const)
      .catch(() => null),
    page
      .getByText(/unsupported verification method/i)
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => 'unsupported_second_factor' as const)
      .catch(() => null),
  ]);

  if (navigationResult === 'success') {
    return {
      attempt: 'success',
      usedEmailCodeVerification: false,
    };
  }

  if (navigationResult === 'retry') {
    return {
      attempt: 'retry',
      usedEmailCodeVerification: false,
    };
  }

  // Why: On this Clerk setup, the correct password can still trigger an email
  // verification step, so the helper must finish that flow before deciding the
  // password pair is invalid.
  if (navigationResult === 'second_factor_email_code') {
    const verificationButton = page.getByRole('button', {
      name: 'Complete Sign In',
    });
    const challengeStartedAt = Date.now();

    // Why: This account can land on Clerk's second-factor screen with a still
    // pending verification email, so the helper retries the newest code that
    // arrived after this specific challenge started instead of reusing older
    // verification emails from prior sign-in attempts.
    for (const waitMs of [5_000, 20_000, 35_000]) {
      await sleep({ ms: waitMs });

      const verificationCode = await pollForEmailCode({
        emailAddress: email,
        imapUser: gmailImapUser,
        imapPassword: gmailImapPassword,
        subject: 'verification code',
        startedAt: challengeStartedAt - 60_000,
        timeoutMs: Math.min(mailTimeoutMs, 10_000),
        pollIntervalMs: mailPollIntervalMs,
      });

      await fillOtpCode({
        page,
        code: verificationCode,
      });

      await expect(verificationButton).toBeEnabled();
      await verificationButton.click();

      const secondFactorResult = await Promise.race([
        page
          .waitForURL(
            (url) => {
              const pathname = new URL(url.toString()).pathname;
              return pathname !== '/login';
            },
            { timeout: 8_000 },
          )
          .then(() => 'success' as const)
          .catch(() => null),
        page
          .getByText(/incorrect code|invalid code|code is incorrect/i)
          .waitFor({ state: 'visible', timeout: 8_000 })
          .then(() => 'retry' as const)
          .catch(() => null),
        sleep({ ms: 8_000 }).then(() => 'retry' as const),
      ]);

      if (secondFactorResult === 'success') {
        const pathname = new URL(page.url()).pathname;
        return {
          attempt: pathname === '/forgot-password' ? 'reset_required' : 'success',
          usedEmailCodeVerification: true,
        };
      }
    }

    return {
      attempt: 'failure',
      usedEmailCodeVerification: true,
    };
  }

  if (navigationResult === 'reset_required') {
    return {
      attempt: 'reset_required',
      usedEmailCodeVerification: false,
    };
  }

  if (navigationResult === 'unsupported_second_factor') {
    return {
      attempt: 'unsupported_second_factor',
      usedEmailCodeVerification: false,
    };
  }

  return {
    attempt: 'failure',
    usedEmailCodeVerification: false,
  };
}

export function resolveNextPasswordFromAttempts({
  passwordA,
  passwordB,
  attemptA,
  attemptB,
}: ResolveNextPasswordFromAttemptsArgs) {
  // Why: Password rotation selection is a pure decision derived from the two
  // attempt results, so keeping it isolated makes the login-recovery module
  // easier to test without replaying the full browser and IMAP flow.
  if (attemptA === 'success' || attemptA === 'reset_required') {
    return { currentPassword: passwordA, nextPassword: passwordB };
  }

  if (attemptB === 'success' || attemptB === 'reset_required') {
    return { currentPassword: passwordB, nextPassword: passwordA };
  }

  return null;
}

export async function attemptRealLogin({
  page,
  email,
  password,
  gmailImapUser,
  gmailImapPassword,
  mailTimeoutMs,
  mailPollIntervalMs,
}: AttemptRealLoginArgs): Promise<AttemptRealLoginResult> {
  const attemptState = await loginWithPassword({
    page,
    email,
    password,
    gmailImapUser,
    gmailImapPassword,
    mailTimeoutMs,
    mailPollIntervalMs,
  });

  return {
    outcome: resolveLoginOutcome({
      attempt: attemptState.attempt,
      usedEmailCodeVerification: attemptState.usedEmailCodeVerification,
    }),
    usedEmailCodeVerification: attemptState.usedEmailCodeVerification,
  };
}

function resolveActivePasswordOutcome({
  attempt,
  usedEmailCodeVerification,
}: ResolveLoginOutcomeArgs): ActivePasswordPair['currentPasswordOutcome'] {
  if (attempt === 'reset_required') {
    return 'reset_required';
  }

  return usedEmailCodeVerification
    ? 'signed_in_after_client_trust'
    : 'signed_in';
}

export async function resolvePasswordRotation({
  page,
  email,
  passwordA,
  passwordB,
  gmailImapUser,
  gmailImapPassword,
  mailTimeoutMs,
  mailPollIntervalMs,
}: ResolvePasswordRotationArgs) {
  const attemptA = await loginWithPassword({
    page,
    email,
    password: passwordA,
    gmailImapUser,
    gmailImapPassword,
    mailTimeoutMs,
    mailPollIntervalMs,
  });

  if (attemptA.attempt === 'retry') {
    const retryAttemptA = await loginWithPassword({
      page,
      email,
      password: passwordA,
      gmailImapUser,
      gmailImapPassword,
      mailTimeoutMs,
      mailPollIntervalMs,
    });

    const resolvedPasswordPair = resolveNextPasswordFromAttempts({
      passwordA,
      passwordB,
      attemptA: retryAttemptA.attempt,
      attemptB: 'failure',
    });

    if (resolvedPasswordPair) {
      return {
        ...resolvedPasswordPair,
        currentPasswordOutcome: resolveActivePasswordOutcome({
          attempt: retryAttemptA.attempt,
          usedEmailCodeVerification: retryAttemptA.usedEmailCodeVerification,
        }),
      } satisfies ActivePasswordPair;
    }

    if (retryAttemptA.attempt === 'unsupported_second_factor') {
      throw new Error(
        'The E2E Clerk test account requires a second-factor strategy that this suite does not automate.',
      );
    }
  }

  const resolvedPasswordA = resolveNextPasswordFromAttempts({
    passwordA,
    passwordB,
    attemptA: attemptA.attempt,
    attemptB: 'failure',
  });

  if (resolvedPasswordA) {
    return {
      ...resolvedPasswordA,
      currentPasswordOutcome: resolveActivePasswordOutcome({
        attempt: attemptA.attempt,
        usedEmailCodeVerification: attemptA.usedEmailCodeVerification,
      }),
    } satisfies ActivePasswordPair;
  }

  if (attemptA.attempt === 'unsupported_second_factor') {
    throw new Error(
      'The E2E Clerk test account requires a second-factor strategy that this suite does not automate.',
    );
  }

  const attemptB = await loginWithPassword({
    page,
    email,
    password: passwordB,
    gmailImapUser,
    gmailImapPassword,
    mailTimeoutMs,
    mailPollIntervalMs,
  });

  if (attemptB.attempt === 'retry') {
    const retryAttemptB = await loginWithPassword({
      page,
      email,
      password: passwordB,
      gmailImapUser,
      gmailImapPassword,
      mailTimeoutMs,
      mailPollIntervalMs,
    });

    const resolvedPasswordPair = resolveNextPasswordFromAttempts({
      passwordA,
      passwordB,
      attemptA: 'failure',
      attemptB: retryAttemptB.attempt,
    });

    if (resolvedPasswordPair) {
      return {
        ...resolvedPasswordPair,
        currentPasswordOutcome: resolveActivePasswordOutcome({
          attempt: retryAttemptB.attempt,
          usedEmailCodeVerification: retryAttemptB.usedEmailCodeVerification,
        }),
      } satisfies ActivePasswordPair;
    }

    if (retryAttemptB.attempt === 'unsupported_second_factor') {
      throw new Error(
        'The E2E Clerk test account requires a second-factor strategy that this suite does not automate.',
      );
    }
  }

  const resolvedPasswordB = resolveNextPasswordFromAttempts({
    passwordA,
    passwordB,
    attemptA: 'failure',
    attemptB: attemptB.attempt,
  });

  if (resolvedPasswordB) {
    return {
      ...resolvedPasswordB,
      currentPasswordOutcome: resolveActivePasswordOutcome({
        attempt: attemptB.attempt,
        usedEmailCodeVerification: attemptB.usedEmailCodeVerification,
      }),
    } satisfies ActivePasswordPair;
  }

  if (attemptB.attempt === 'unsupported_second_factor') {
    throw new Error(
      'The E2E Clerk test account requires a second-factor strategy that this suite does not automate.',
    );
  }

  throw new Error(
    'Could not determine the active E2E Clerk test password using the configured password pair.',
  );
}

export async function signOutFromDevButton({ page }: { page: Page }) {
  const signOutButton = page.getByRole('button', {
    name: 'Sign out current session',
  });

  if ((await signOutButton.count()) === 0) {
    return;
  }

  await signOutButton.click();
  await expect(page).toHaveURL(/\/login/);
}
