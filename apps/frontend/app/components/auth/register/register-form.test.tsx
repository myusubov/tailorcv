import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RegisterForm from './register-form';

const mockUseRegisterFlow = vi.fn();

vi.mock('./use-register-flow', () => ({
  useRegisterFlow: () => mockUseRegisterFlow(),
}));

vi.mock('./register-form-view', () => ({
  RegisterFormView: ({ globalError }: { globalError: string }) => (
    <div data-testid="register-form-view">{globalError}</div>
  ),
}));

vi.mock('@/lib/config', () => ({
  config: {
    auth: {
      afterSignUpUrl: '/onboarding',
    },
  },
}));

vi.mock('@/app/components/auth/registration-verification', () => ({
  RegistrationVerification: ({ email }: { email: string }) => (
    <div data-testid="registration-verification">{email}</div>
  ),
}));

describe('RegisterForm', () => {
  it('renders the register form view while verification is inactive', () => {
    mockUseRegisterFlow.mockReturnValue({
      mode: 'form',
      formViewProps: {
        control: {},
        globalError: 'Create account failed',
        googleLoading: false,
        appleLoading: false,
        isSubmitting: false,
        isAnyAuthActionInProgress: false,
        onSubmit: vi.fn(),
        onGoogleSignUp: vi.fn(),
        onAppleSignUp: vi.fn(),
      },
    });

    render(<RegisterForm />);

    expect(screen.getByTestId('register-form-view')).toBeTruthy();
    expect(screen.getByText('Create account failed')).toBeTruthy();
    expect(screen.queryByTestId('registration-verification')).toBeNull();
  });

  it('renders the verification view when the register flow enters verification', () => {
    mockUseRegisterFlow.mockReturnValue({
      mode: 'verification',
      verificationViewProps: {
        resetForm: vi.fn(),
        onGoBack: vi.fn(),
        signUp: { id: 'sign_up_123' },
        email: 'user@example.com',
      },
    });

    render(<RegisterForm />);

    expect(screen.getByTestId('registration-verification')).toBeTruthy();
    expect(screen.getByText('user@example.com')).toBeTruthy();
    expect(screen.queryByTestId('register-form-view')).toBeNull();
  });
});
