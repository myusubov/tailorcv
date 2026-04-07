import { describe, expect, it } from 'vitest';

import {
  resolveForgotPasswordCompletion,
  resolveLoginAttemptOutcome,
} from './clerk-flow';

describe('resolveLoginAttemptOutcome', () => {
  it('finalizes successful sign-ins', () => {
    expect(
      resolveLoginAttemptOutcome({
        status: 'complete',
      }),
    ).toEqual({
      type: 'finalize',
    });
  });

  it('uses Client Trust email verification when Clerk requires trusted-device verification', () => {
    expect(
      resolveLoginAttemptOutcome({
        status: 'needs_client_trust',
        supportedSecondFactors: [{ strategy: 'email_code' }],
      }),
    ).toEqual({
      type: 'client_trust_email_code',
    });
  });

  it('surfaces unsupported Client Trust strategies', () => {
    expect(
      resolveLoginAttemptOutcome({
        status: 'needs_client_trust',
        supportedSecondFactors: [{ strategy: 'totp' }],
      }),
    ).toEqual({
      type: 'unsupported_second_factor',
    });
  });

  it('surfaces account-level MFA separately from Client Trust', () => {
    expect(
      resolveLoginAttemptOutcome({
        status: 'needs_second_factor',
      }),
    ).toEqual({
      type: 'needs_second_factor',
    });
  });

  it('sends forced password resets to recovery flow', () => {
    expect(
      resolveLoginAttemptOutcome({
        status: 'needs_new_password',
      }),
    ).toEqual({
      type: 'needs_new_password',
    });
  });

  it('reports unexpected Clerk statuses for inline error handling', () => {
    expect(
      resolveLoginAttemptOutcome({
        status: 'needs_identifier',
      }),
    ).toEqual({
      type: 'unhandled_status',
      status: 'needs_identifier',
    });
  });
});

describe('resolveForgotPasswordCompletion', () => {
  it('finalizes the reset flow when Clerk completes sign-in', () => {
    expect(
      resolveForgotPasswordCompletion({
        status: 'complete',
      }),
    ).toEqual({
      type: 'finalize',
    });
  });

  it('surfaces second-factor requirements after password submission', () => {
    expect(
      resolveForgotPasswordCompletion({
        status: 'needs_second_factor',
      }),
    ).toEqual({
      type: 'needs_second_factor',
    });
  });

  it('reports unexpected statuses after password submission', () => {
    expect(
      resolveForgotPasswordCompletion({
        status: 'needs_new_password',
      }),
    ).toEqual({
      type: 'unexpected_status',
      status: 'needs_new_password',
    });
  });
});
