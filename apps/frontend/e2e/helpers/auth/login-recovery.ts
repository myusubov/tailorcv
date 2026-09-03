import { expect, Page } from '@playwright/test';

import { pollForEmailCode } from '../mail/gmail-imap';
import { fillOtpCode } from './otp';
import type {
  AttemptRealLoginArgs,
  AttemptRealLoginResult,
  LoginAttemptResult,
  RealLoginOutcome,
  ResolveLoginOutcomeArgs,
} from './login-recovery.types';

interface LoginAttemptState {
  attempt: LoginAttemptResult;
  usedEmailCodeVerification: boolean;
}

async function sleep({ ms }: { ms: number }) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForLoginFormReady({ page }: { page: Page }) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-auth-ready="true"]')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
}

/**
 * Maps the internal browser-attempt result to the public outcome exposed to login specs.
 * The result distinguishes direct sign-in, Client Trust completion, reset-required redirects,
 * invalid credentials, and unsupported second-factor branches.
 */
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
}: {
  page: Page;
  email: string;
  password: string;
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

  if (navigationResult === 'second_factor_email_code') {
    const verificationButton = page.getByRole('button', {
      name: 'Complete Sign In',
    });
    const challengeStartedAt = Date.now();

    for (const waitMs of [5_000, 20_000, 35_000]) {
      await sleep({ ms: waitMs });

      const verificationCode = await pollForEmailCode({
        emailAddress: email,
        subject: 'verification code',
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
          attempt:
            pathname === '/forgot-password' ? 'reset_required' : 'success',
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

/**
 * Executes a real password login attempt and returns the stable public outcome used by specs.
 */
export async function attemptRealLogin({
  page,
  email,
  password,
}: AttemptRealLoginArgs): Promise<AttemptRealLoginResult> {
  const attemptState = await loginWithPassword({
    page,
    email,
    password,
  });

  return {
    outcome: resolveLoginOutcome({
      attempt: attemptState.attempt,
      usedEmailCodeVerification: attemptState.usedEmailCodeVerification,
    }),
    usedEmailCodeVerification: attemptState.usedEmailCodeVerification,
  };
}

/**
 * Signs out through the app's development-only logout button when it is present.
 */
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
