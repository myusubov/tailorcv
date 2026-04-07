import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockUseLoginFlow = vi.fn();

vi.mock('@/app/components/auth/login/use-login-flow', () => ({
  useLoginFlow: () => mockUseLoginFlow(),
}));

vi.mock('@/app/components/auth/login', () => ({
  LoginBranding: () => <div data-testid="login-branding" />,
  LoginFormView: () => <div data-testid="login-form-view" />,
  VerificationView: () => <div data-testid="login-verification-view" />,
}));

vi.mock('@/lib/config', () => ({
  config: {
    auth: {
      afterSignInUrl: '/dashboard',
    },
  },
}));

const { default: LoginPage } = await import('./page');

describe('LoginPage', () => {
  it('renders the password login view while verification is inactive', () => {
    mockUseLoginFlow.mockReturnValue({
      verifying: false,
      isClientReady: true,
    });

    render(<LoginPage />);

    expect(screen.getByTestId('login-branding')).toBeTruthy();
    expect(screen.getByTestId('login-form-view')).toBeTruthy();
    expect(screen.queryByTestId('login-verification-view')).toBeNull();
  });

  it('renders the verification view when the login flow enters Client Trust verification', () => {
    mockUseLoginFlow.mockReturnValue({
      verifying: true,
      code: '',
      setCode: vi.fn(),
      handleVerification: vi.fn(),
      isVerifying: false,
      resending: false,
      handleResend: vi.fn(),
      handleBackToLogin: vi.fn(),
      globalError: '',
    });

    render(<LoginPage />);

    expect(screen.getByTestId('login-verification-view')).toBeTruthy();
    expect(screen.queryByTestId('login-form-view')).toBeNull();
  });
});
