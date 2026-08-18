import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { useSignUp } from '@clerk/nextjs';

import { RegistrationVerification } from './registration-verification';

type SignUpProp = ReturnType<typeof useSignUp>['signUp'];

const mockPush = vi.hoisted(() => vi.fn());
const toastMocks = vi.hoisted(() => ({
  danger: vi.fn(),
  success: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/config', () => ({
  config: {
    auth: {
      afterSignUpUrl: '/onboarding',
    },
  },
}));

vi.mock('@heroui/react', async () => {
  const actual = await vi.importActual<typeof import('@heroui/react')>('@heroui/react');

  return {
    ...actual,
    toast: {
      danger: toastMocks.danger,
      success: toastMocks.success,
    },
    InputOTP: ({ value, onChange, maxLength }: { value: string; onChange: (value: string) => void; maxLength: number }) => (
      <input
        aria-label="Verification code"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  };
});

const createFlowError = (message: string) => ({
  clerkError: true,
  message,
});

type MockedSignUp = {
  status: string;
  verifications: {
    sendEmailCode: ReturnType<typeof vi.fn>;
    verifyEmailCode: ReturnType<typeof vi.fn>;
  };
  finalize: ReturnType<typeof vi.fn>;
};

const createSignUpMock = () => {
  const signUp = {
    status: 'missing_requirements' as string,
    verifications: {
      sendEmailCode: vi.fn(),
      verifyEmailCode: vi.fn(),
    },
    finalize: vi.fn(),
  };

  return signUp satisfies MockedSignUp;
};

describe('RegistrationVerification', () => {
  beforeEach(() => {
    mockPush.mockReset();
    toastMocks.danger.mockReset();
    toastMocks.success.mockReset();
  });

  it('reports resend errors through HeroUI danger feedback', async () => {
    const user = userEvent.setup();
    const signUp = createSignUpMock();
    signUp.verifications.sendEmailCode.mockResolvedValue({
      error: createFlowError('Unable to resend code'),
    });

    render(
      <RegistrationVerification
        email="user@example.com"
        onGoBack={vi.fn()}
        signUp={signUp as unknown as SignUpProp}
        resetForm={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Resend code' }));

    await waitFor(() => {
      expect(toastMocks.danger).toHaveBeenCalledWith('Unable to resend code');
    });
  });

  it('reports verify-email errors through HeroUI danger feedback', async () => {
    const user = userEvent.setup();
    const signUp = createSignUpMock();
    signUp.verifications.verifyEmailCode.mockResolvedValue({
      error: createFlowError('Invalid verification code'),
    });

    render(
      <RegistrationVerification
        email="user@example.com"
        onGoBack={vi.fn()}
        signUp={signUp as unknown as SignUpProp}
        resetForm={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Verification code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify Email' }));

    await waitFor(() => {
      expect(toastMocks.danger).toHaveBeenCalledWith('Invalid verification code');
    });
  });

  it('reports finalize errors through HeroUI danger feedback', async () => {
    const user = userEvent.setup();
    const signUp = createSignUpMock();
    signUp.status = 'complete';
    signUp.verifications.verifyEmailCode.mockResolvedValue({ error: null });
    signUp.finalize.mockResolvedValue({
      error: createFlowError('Unable to finish sign up'),
    });

    render(
      <RegistrationVerification
        email="user@example.com"
        onGoBack={vi.fn()}
        signUp={signUp as unknown as SignUpProp}
        resetForm={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Verification code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify Email' }));

    await waitFor(() => {
      expect(toastMocks.danger).toHaveBeenCalledWith('Unable to finish sign up');
    });
  });

  it('reports unexpected statuses through HeroUI danger feedback', async () => {
    const user = userEvent.setup();
    const signUp = createSignUpMock();
    signUp.status = 'needs_identifier';
    signUp.verifications.verifyEmailCode.mockResolvedValue({ error: null });

    render(
      <RegistrationVerification
        email="user@example.com"
        onGoBack={vi.fn()}
        signUp={signUp as unknown as SignUpProp}
        resetForm={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Verification code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify Email' }));

    await waitFor(() => {
      expect(toastMocks.danger).toHaveBeenCalledWith(
        'Unexpected verification status: needs identifier. Please try again.',
      );
    });
  });
});
