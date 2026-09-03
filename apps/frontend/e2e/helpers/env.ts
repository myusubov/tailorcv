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

/**
 * Returns the missing env keys required by the real forgot-password suite.
 */
export function getMissingForgotPasswordEnvKeys() {
  return Object.values(requiredEnvKeys).filter((key) => !process.env[key]);
}

/**
 * Returns the missing env keys required by the dedicated real login suite.
 */
export function getMissingLoginE2EEnvKeys() {
  return Object.values(loginRequiredEnvKeys).filter((key) => !process.env[key]);
}

/**
 * Detects whether an email address uses Clerk's fixed-OTP test email convention.
 */
export function isClerkTestEmail({ emailAddress }: { emailAddress: string }) {
  return emailAddress.toLowerCase().includes(CLERK_TEST_EMAIL_MARKER);
}

/**
 * Returns Clerk's fixed development verification code for test-email flows.
 */
export function getClerkTestVerificationCode() {
  return CLERK_TEST_VERIFICATION_CODE;
}

/**
 * Generates a unique Clerk test email for the real sign-up suite.
 * A fresh address keeps the spec repeatable without account cleanup or reuse collisions.
 */
export function generateSignUpTestEmail() {
  const uniqueSuffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  return `${SIGNUP_TEST_EMAIL_PREFIX}-${uniqueSuffix}${CLERK_TEST_EMAIL_MARKER}@example.com`;
}

/**
 * Returns whether the real forgot-password suite has all required env vars.
 */
export function hasForgotPasswordE2EEnv() {
  return getMissingForgotPasswordEnvKeys().length === 0;
}

/**
 * Returns whether the dedicated real login suite has all required env vars.
 */
export function hasLoginE2EEnv() {
  return getMissingLoginE2EEnvKeys().length === 0;
}

/**
 * Reads the dedicated login-only E2E credentials.
 * Login uses an isolated fixed-password Clerk test user so the spec does not depend
 * on password rotation or reset recovery state from the forgot-password suite.
 */
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

/**
 * Reads the env contract for the real forgot-password suite, including the
 * rotating password pair and the configured invalid-reset-password case.
 */
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
