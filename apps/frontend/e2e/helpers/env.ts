import { randomUUID } from 'crypto';

type RequiredEnv = {
  clerkForgotPasswordTestEmail: string;
  clerkPasswordA: string;
  clerkPasswordB: string;
};

type LoginRequiredEnv = {
  clerkLoginTestEmail: string;
  clerkPassword: string;
};

export type ForgotPasswordE2EEnv = RequiredEnv & {
  invalidResetPassword: string;
};

export type LoginE2EEnv = LoginRequiredEnv;

const CLERK_TEST_EMAIL_MARKER = '+clerk_test';
const CLERK_TEST_VERIFICATION_CODE = '424242';
const SIGNUP_TEST_EMAIL_PREFIX = 'e2e-signup';

const requiredEnvKeys = {
  clerkForgotPasswordTestEmail: 'E2E_CLERK_FORGOT_PASSWORD_TEST_EMAIL',
  clerkPasswordA: 'E2E_CLERK_TEST_PASSWORD_A',
  clerkPasswordB: 'E2E_CLERK_TEST_PASSWORD_B',
} as const;

const loginRequiredEnvKeys = {
  clerkLoginTestEmail: 'E2E_CLERK_LOGIN_TEST_EMAIL',
  clerkPassword: 'E2E_CLERK_TEST_PASSWORD_A',
} as const;

export function getMissingForgotPasswordEnvKeys() {
  return Object.values(requiredEnvKeys).filter((key) => !process.env[key]);
}

export function getMissingLoginE2EEnvKeys() {
  return Object.values(loginRequiredEnvKeys).filter((key) => !process.env[key]);
}

export function isClerkTestEmail({
  emailAddress,
}: {
  emailAddress: string;
}) {
  return emailAddress.toLowerCase().includes(CLERK_TEST_EMAIL_MARKER);
}

export function getClerkTestVerificationCode() {
  return CLERK_TEST_VERIFICATION_CODE;
}

/**
 * Why: Real sign-up E2E must create a fresh Clerk test email on every run so
 * the spec stays repeatable without account cleanup or reuse collisions.
 */
export function generateSignUpTestEmail() {
  const uniqueSuffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  return `${SIGNUP_TEST_EMAIL_PREFIX}-${uniqueSuffix}${CLERK_TEST_EMAIL_MARKER}@example.com`;
}

export function hasForgotPasswordE2EEnv() {
  return getMissingForgotPasswordEnvKeys().length === 0;
}

export function hasLoginE2EEnv() {
  return getMissingLoginE2EEnvKeys().length === 0;
}

// Why: The login-only real auth spec must be isolated from the shared
// forgot-password account so it can use one fixed Clerk test user without
// triggering password-rotation or mailbox-recovery setup.
export function getLoginE2EEnv(): LoginE2EEnv {
  const missingKeys = getMissingLoginE2EEnvKeys();

  if (missingKeys.length > 0) {
    throw new Error(`Missing login E2E env vars: ${missingKeys.join(', ')}`);
  }

  return {
    clerkLoginTestEmail: process.env.E2E_CLERK_LOGIN_TEST_EMAIL!,
    clerkPassword: process.env.E2E_CLERK_TEST_PASSWORD_A!,
  };
}

export function getForgotPasswordE2EEnv(): ForgotPasswordE2EEnv {
  const missingKeys = getMissingForgotPasswordEnvKeys();

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing forgot-password E2E env vars: ${missingKeys.join(', ')}`,
    );
  }

  return {
    clerkForgotPasswordTestEmail:
      process.env.E2E_CLERK_FORGOT_PASSWORD_TEST_EMAIL!,
    clerkPasswordA: process.env.E2E_CLERK_TEST_PASSWORD_A!,
    clerkPasswordB: process.env.E2E_CLERK_TEST_PASSWORD_B!,
    invalidResetPassword:
      process.env.E2E_CLERK_INVALID_RESET_PASSWORD || 'Password123!',
  };
}
