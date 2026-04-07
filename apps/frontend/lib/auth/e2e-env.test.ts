import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getForgotPasswordE2EEnv,
  getLoginE2EEnv,
  getMissingForgotPasswordEnvKeys,
  getMissingLoginE2EEnvKeys,
  hasForgotPasswordE2EEnv,
  hasLoginE2EEnv,
} from '@/e2e/helpers/env';

const originalEnv = { ...process.env };

describe('login-only E2E env', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.E2E_CLERK_LOGIN_TEST_EMAIL;
    delete process.env.E2E_CLERK_TEST_PASSWORD_A;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('requires the dedicated login test email and fixed password', () => {
    expect(getMissingLoginE2EEnvKeys()).toEqual([
      'E2E_CLERK_LOGIN_TEST_EMAIL',
      'E2E_CLERK_TEST_PASSWORD_A',
    ]);
    expect(hasLoginE2EEnv()).toBe(false);
  });

  it('returns the login-only E2E config when both values are set', () => {
    process.env.E2E_CLERK_LOGIN_TEST_EMAIL = 'e2e-login+clerk_test@example.com';
    process.env.E2E_CLERK_TEST_PASSWORD_A = 'Password123!';

    expect(hasLoginE2EEnv()).toBe(true);
    expect(getLoginE2EEnv()).toEqual({
      clerkLoginTestEmail: 'e2e-login+clerk_test@example.com',
      clerkPassword: 'Password123!',
    });
  });
});

describe('forgot-password E2E env', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.E2E_CLERK_FORGOT_PASSWORD_TEST_EMAIL;
    delete process.env.E2E_CLERK_TEST_PASSWORD_A;
    delete process.env.E2E_CLERK_TEST_PASSWORD_B;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('does not require Gmail vars for Clerk test-email reset coverage', () => {
    process.env.E2E_CLERK_FORGOT_PASSWORD_TEST_EMAIL =
      'e2e-reset+clerk_test@example.com';
    process.env.E2E_CLERK_TEST_PASSWORD_A = 'PasswordA123!';
    process.env.E2E_CLERK_TEST_PASSWORD_B = 'PasswordB123!';

    expect(getMissingForgotPasswordEnvKeys()).toEqual([]);
    expect(hasForgotPasswordE2EEnv()).toBe(true);
    expect(getForgotPasswordE2EEnv()).toMatchObject({
      clerkForgotPasswordTestEmail: 'e2e-reset+clerk_test@example.com',
      clerkPasswordA: 'PasswordA123!',
      clerkPasswordB: 'PasswordB123!',
    });
  });
});
