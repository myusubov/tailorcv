import { describe, expect, it } from 'vitest';

import { resolveLoginOutcome } from '@/e2e/helpers/auth/login-recovery';

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
