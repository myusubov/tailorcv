import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { useSignUp } from '@clerk/nextjs';

import { RegistrationVerification } from './registration-verification';

type SignUpProp = ReturnType<typeof useSignUp>['signUp'];

const mockPush = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
  },
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
    mockToastSuccess.mockReset();
  });

  it('shows resend errors returned by Clerk', async () => {
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

    expect(await screen.findByText('Unable to resend code')).toBeTruthy();
  });

  it('shows verify-email errors returned by Clerk', async () => {
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

    expect(await screen.findByText('Invalid verification code')).toBeTruthy();
  });

  it('shows finalize errors returned by Clerk', async () => {
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

    expect(await screen.findByText('Unable to finish sign up')).toBeTruthy();
  });

  it('shows unexpected status errors after successful verification', async () => {
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

    expect(
      await screen.findByText(
        'Unexpected verification status: needs identifier. Please try again.',
      ),
    ).toBeTruthy();
  });
});
