import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
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
        isResending={false}
        isVerifyingCode={false}
        remainingSeconds={60}
      />,
    );

    await user.type(screen.getByLabelText('New password'), 'Password123!');
    await user.type(screen.getByLabelText('Confirm password'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(onSetPassword).toHaveBeenCalledWith({ password: 'Password123!' });
  });

  it('disables resend and displays the remaining cooldown', () => {
    render(
      <ForgotPasswordReset
        email="user@example.com"
        step="verify-code"
        code=""
        onCodeChange={vi.fn()}
        onVerifyCode={vi.fn()}
        onSetPassword={vi.fn()}
        onResend={vi.fn()}
        onBack={vi.fn()}
        isResending={false}
        isVerifyingCode={false}
        remainingSeconds={60}
      />,
    );

    const resendButton = screen.getByRole('button', {
      name: 'Resend reset code',
    });

    expect(resendButton).toBeDisabled();
    expect(resendButton).toHaveTextContent('Resend in 60s');
  });

  it('calls onResend when the cooldown is inactive', async () => {
    const onResend = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <ForgotPasswordReset
        email="user@example.com"
        step="verify-code"
        code=""
        onCodeChange={vi.fn()}
        onVerifyCode={vi.fn()}
        onSetPassword={vi.fn()}
        onResend={onResend}
        onBack={vi.fn()}
        isResending={false}
        isVerifyingCode={false}
        remainingSeconds={null}
      />,
    );

    const resendButton = screen.getByRole('button', {
      name: 'Resend reset code',
    });

    expect(resendButton).toBeEnabled();

    await user.click(resendButton);

    expect(onResend).toHaveBeenCalledOnce();
  });

  it('disables resend and displays progress while resending', () => {
    render(
      <ForgotPasswordReset
        email="user@example.com"
        step="verify-code"
        code=""
        onCodeChange={vi.fn()}
        onVerifyCode={vi.fn()}
        onSetPassword={vi.fn()}
        onResend={vi.fn()}
        onBack={vi.fn()}
        isResending={true}
        isVerifyingCode={false}
        remainingSeconds={null}
      />,
    );

    const resendButton = screen.getByRole('button', {
      name: 'Resend reset code',
    });

    expect(resendButton).toBeDisabled();
    expect(resendButton).toHaveTextContent('Resending...');
  });
});
