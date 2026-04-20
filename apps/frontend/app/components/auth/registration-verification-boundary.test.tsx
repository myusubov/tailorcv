import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { useSignUp } from '@clerk/nextjs';

import { RegistrationVerification } from './registration-verification';

type SignUpProp = ReturnType<typeof useSignUp>['signUp'];

const mockUseRegistrationVerificationFlow = vi.fn();

vi.mock('./use-registration-verification-flow', () => ({
  useRegistrationVerificationFlow: () => mockUseRegistrationVerificationFlow(),
}));

vi.mock('./registration-verification-view', () => ({
  RegistrationVerificationView: ({
    email,
    globalError,
  }: {
    email: string;
    globalError: string;
  }) => (
    <div data-testid="registration-verification-view">
      {email}
      {globalError}
    </div>
  ),
}));

describe('RegistrationVerification boundary', () => {
  it('forwards grouped view props from the verification flow hook', () => {
    mockUseRegistrationVerificationFlow.mockReturnValue({
      viewProps: {
        code: '',
        email: 'user@example.com',
        globalError: 'Invalid verification code',
        isResending: false,
        isVerifying: false,
        onCodeChange: vi.fn(),
        onGoBack: vi.fn(),
        onResend: vi.fn(),
        onSubmit: vi.fn(),
      },
    });

    render(
      <RegistrationVerification
        email="user@example.com"
        onGoBack={vi.fn()}
        signUp={{} as unknown as SignUpProp}
        resetForm={vi.fn()}
      />,
    );

    expect(screen.getByTestId('registration-verification-view')).toBeTruthy();
    expect(screen.getByText(/user@example.com/)).toBeTruthy();
    expect(screen.getByText(/Invalid verification code/)).toBeTruthy();
  });
});
