import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) => tag,
    },
  ),
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
}));

import { ForgotPasswordReset } from './forgot-password-reset';

describe('ForgotPasswordReset', () => {
  it('submits the new password through the controller callback on the set-password step', async () => {
    const user = userEvent.setup();
    const onSetPassword = vi.fn().mockResolvedValue(undefined);

    render(
      <ForgotPasswordReset
        email="user@example.com"
        step="set-password"
        code=""
        onCodeChange={vi.fn()}
        onVerifyCode={vi.fn()}
        onSetPassword={onSetPassword}
        onResend={vi.fn()}
        onBack={vi.fn()}
        globalError=""
        isResending={false}
        isVerifyingCode={false}
      />,
    );

    await user.type(screen.getByLabelText('New password'), 'Password123!');
    await user.type(screen.getByLabelText('Confirm password'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(onSetPassword).toHaveBeenCalledWith({ password: 'Password123!' });
  });
});
