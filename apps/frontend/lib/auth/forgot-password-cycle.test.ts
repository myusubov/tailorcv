import { describe, expect, it } from 'vitest';

import { resolveForgotPasswordCycle } from '@/e2e/helpers/auth/forgot-password-flow';

describe('resolveForgotPasswordCycle', () => {
  it('uses password A as the baseline and restores back to it', () => {
    expect(
      resolveForgotPasswordCycle({
        passwordA: 'password-a',
        passwordB: 'password-b',
      }),
    ).toEqual({
      resetPassword: 'password-b',
      restorePassword: 'password-a',
    });
  });
});
