import { describe, expect, it } from 'vitest';

import {
  resolveLoginOutcome,
  resolveNextPasswordFromAttempts,
} from '@/e2e/helpers/auth/login-recovery';

describe('resolveNextPasswordFromAttempts', () => {
  it('prefers the first password when it succeeds immediately', () => {
    expect(
      resolveNextPasswordFromAttempts({
        passwordA: 'a',
        passwordB: 'b',
        attemptA: 'success',
        attemptB: 'failure',
      }),
    ).toEqual({
      currentPassword: 'a',
      nextPassword: 'b',
    });
  });

  it('accepts reset-required as an active password result', () => {
    expect(
      resolveNextPasswordFromAttempts({
        passwordA: 'a',
        passwordB: 'b',
        attemptA: 'reset_required',
        attemptB: 'failure',
      }),
    ).toEqual({
      currentPassword: 'a',
      nextPassword: 'b',
    });
  });

  it('falls back to the second password when the first fails', () => {
    expect(
      resolveNextPasswordFromAttempts({
        passwordA: 'a',
        passwordB: 'b',
        attemptA: 'failure',
        attemptB: 'success',
      }),
    ).toEqual({
      currentPassword: 'b',
      nextPassword: 'a',
    });
  });

  it('returns null when neither password is usable', () => {
    expect(
      resolveNextPasswordFromAttempts({
        passwordA: 'a',
        passwordB: 'b',
        attemptA: 'failure',
        attemptB: 'failure',
      }),
    ).toBeNull();
  });
});

describe('resolveLoginOutcome', () => {
  it('returns signed_in for direct successful login attempts', () => {
    expect(
      resolveLoginOutcome({
        attempt: 'success',
        usedEmailCodeVerification: false,
      }),
    ).toBe('signed_in');
  });

  it('returns signed_in_after_client_trust when Clerk required an email-code challenge', () => {
    expect(
      resolveLoginOutcome({
        attempt: 'success',
        usedEmailCodeVerification: true,
      }),
    ).toBe('signed_in_after_client_trust');
  });

  it('preserves reset_required outcomes after accepted credentials', () => {
    expect(
      resolveLoginOutcome({
        attempt: 'reset_required',
        usedEmailCodeVerification: true,
      }),
    ).toBe('reset_required');
  });

  it('maps invalid credential attempts to invalid_credentials', () => {
    expect(
      resolveLoginOutcome({
        attempt: 'failure',
        usedEmailCodeVerification: false,
      }),
    ).toBe('invalid_credentials');
  });

  it('preserves unsupported second-factor outcomes', () => {
    expect(
      resolveLoginOutcome({
        attempt: 'unsupported_second_factor',
        usedEmailCodeVerification: false,
      }),
    ).toBe('unsupported_second_factor');
  });
});
