import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RegisterForm from './register-form';

const mockUseRegisterFlow = vi.fn();

vi.mock('./use-register-flow', () => ({
  useRegisterFlow: () => mockUseRegisterFlow(),
}));

vi.mock('./register-form-view', () => ({
  RegisterFormView: () => <div data-testid="register-form-view" />,
}));

vi.mock('@/lib/config', () => ({
  config: {
    auth: {
      afterSignUpUrl: '/onboarding',
    },
  },
}));

vi.mock('@/app/components/auth/registration-verification', () => ({
  RegistrationVerification: () => <div data-testid="registration-verification" />,
}));

describe('RegisterForm', () => {
  it('renders the register form view while verification is inactive', () => {
    mockUseRegisterFlow.mockReturnValue({
      verifying: false,
    });

    render(<RegisterForm />);

    expect(screen.getByTestId('register-form-view')).toBeTruthy();
    expect(screen.queryByTestId('registration-verification')).toBeNull();
  });

  it('renders the verification view when the register flow enters verification', () => {
    mockUseRegisterFlow.mockReturnValue({
      verifying: true,
      resetForm: vi.fn(),
      handleGoBack: vi.fn(),
      signUp: { id: 'sign_up_123' },
      email: 'user@example.com',
    });

    render(<RegisterForm />);

    expect(screen.getByTestId('registration-verification')).toBeTruthy();
    expect(screen.queryByTestId('register-form-view')).toBeNull();
  });
});
