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
  RegistrationVerificationView: ({ email }: { email: string }) => (
    <div data-testid="registration-verification-view">{email}</div>
  ),
}));

describe('RegistrationVerification boundary', () => {
  it('forwards grouped view props from the verification flow hook', () => {
    mockUseRegistrationVerificationFlow.mockReturnValue({
      viewProps: {
        code: '',
        email: 'user@example.com',
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
  });
});
