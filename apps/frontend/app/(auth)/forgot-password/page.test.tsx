import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockUseForgotPasswordFlow = vi.fn();

vi.mock('@/app/components/auth/forgot-password/use-forgot-password-flow', () => ({
  useForgotPasswordFlow: () => mockUseForgotPasswordFlow(),
}));

vi.mock('@/app/components/auth/forgot-password', () => ({
  ForgotPasswordEmailEntry: () => <div data-testid="forgot-password-email-entry" />,
  ForgotPasswordReset: () => <div data-testid="forgot-password-reset" />,
}));

const { default: ForgotPasswordPage } = await import('./page');

describe('ForgotPasswordPage', () => {
  it('renders the email-entry controller on the first step', () => {
    mockUseForgotPasswordFlow.mockReturnValue({
      step: 'email',
      globalError: '',
      handleEmailSubmit: vi.fn(),
    });

    render(<ForgotPasswordPage />);

    expect(screen.getByTestId('forgot-password-email-entry')).toBeTruthy();
    expect(screen.queryByTestId('forgot-password-reset')).toBeNull();
  });

  it('renders the reset controller for verification and password steps', () => {
    mockUseForgotPasswordFlow.mockReturnValue({
      step: 'verify-code',
      email: 'user@example.com',
      code: '123456',
      globalError: '',
      isResending: false,
      isVerifyingCode: false,
      handleBack: vi.fn(),
      handleResend: vi.fn(),
      handleSetPassword: vi.fn(),
      handleVerifyCode: vi.fn(),
      setCode: vi.fn(),
    });

    render(<ForgotPasswordPage />);

    expect(screen.getByTestId('forgot-password-reset')).toBeTruthy();
    expect(screen.queryByTestId('forgot-password-email-entry')).toBeNull();
  });
});
