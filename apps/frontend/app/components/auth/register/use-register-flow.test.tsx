import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSignUpState = vi.hoisted(() => ({
  signUp: null as null | MockSignUp,
  fetchStatus: 'idle',
}));
const mockFormState = vi.hoisted(() => ({
  data: {
    email: 'new-user@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    terms: true,
  },
  isSubmitting: false,
}));
const mockPush = vi.hoisted(() => vi.fn());
const mockSetValue = vi.hoisted(() => vi.fn());
const toastMocks = vi.hoisted(() => ({
  danger: vi.fn(),
  success: vi.fn(),
}));

interface MockSignUp {
  status: string | null;
  unverifiedFields: string[];
  missingFields: string[];
  password: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  sso: ReturnType<typeof vi.fn>;
  finalize: ReturnType<typeof vi.fn>;
  verifications: {
    sendEmailCode: ReturnType<typeof vi.fn>;
    verifyEmailCode: ReturnType<typeof vi.fn>;
  };
}

vi.mock('@clerk/nextjs', () => ({
  useSignUp: () => mockSignUpState,
}));

vi.mock('@heroui/react', () => ({
  toast: {
    danger: toastMocks.danger,
    success: toastMocks.success,
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit:
      (handler: (data: typeof mockFormState.data) => Promise<void>) => () =>
        handler(mockFormState.data),
    formState: {
      isSubmitting: mockFormState.isSubmitting,
    },
    setValue: mockSetValue,
  }),
  useWatch: () => mockFormState.data.email,
}));

vi.mock('@/lib/config', () => ({
  config: {
    auth: {
      afterSignUpUrl: '/onboarding',
    },
  },
}));

const { useRegisterFlow } = await import('./use-register-flow');

/**
 * Creates the mutable Clerk future-resource fixture used by register flow tests.
 *
 * @returns A successful default sign-up mock whose status awaits email verification.
 */
const createSignUpMock = (): MockSignUp => ({
  status: 'missing_requirements',
  unverifiedFields: ['email_address'],
  missingFields: [],
  password: vi.fn().mockResolvedValue({ error: null }),
  reset: vi.fn().mockResolvedValue({ error: null }),
  sso: vi.fn().mockResolvedValue({ error: null }),
  finalize: vi.fn().mockResolvedValue({ error: null }),
  verifications: {
    sendEmailCode: vi.fn().mockResolvedValue({ error: null }),
    verifyEmailCode: vi.fn().mockResolvedValue({ error: null }),
  },
});

/**
 * Creates a Clerk-shaped error that exercises the shared message parser.
 *
 * @param input - Human-readable error message to expose through the flow.
 * @returns A minimal Clerk error fixture.
 */
const createFlowError = ({ message }: { message: string }) => ({
  clerkError: true,
  message,
});

describe('useRegisterFlow', () => {
  beforeEach(() => {
    mockFormState.data = {
      email: 'new-user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      terms: true,
    };
    mockFormState.isSubmitting = false;
    mockPush.mockReset();
    mockSetValue.mockReset();
    toastMocks.danger.mockReset();
    toastMocks.success.mockReset();
    mockSignUpState.fetchStatus = 'idle';
    mockSignUpState.signUp = createSignUpMock();
  });

  it('creates a password sign-up, sends its email code, and enters verification', async () => {
    const signUp = createSignUpMock();
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useRegisterFlow());
    const current = result.current;
    if (current.mode !== 'form') {
      throw new Error('Expected register flow to start in form mode');
    }

    await act(async () => {
      await current.formViewProps.onSubmit();
    });

    expect(signUp.password).toHaveBeenCalledWith({
      emailAddress: 'new-user@example.com',
      password: 'Password123!',
    });
    expect(signUp.verifications.sendEmailCode).toHaveBeenCalledTimes(1);
    expect(result.current.mode).toBe('verification');
  });

  it('reports returned password sign-up errors through HeroUI danger feedback', async () => {
    const signUp = createSignUpMock();
    signUp.password.mockResolvedValue({
      error: createFlowError({ message: 'Email address is already registered' }),
    });
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useRegisterFlow());
    const current = result.current;
    if (current.mode !== 'form') {
      throw new Error('Expected register flow to start in form mode');
    }

    await act(async () => {
      await current.formViewProps.onSubmit();
    });

    expect(toastMocks.danger).toHaveBeenCalledWith(
      'Email address is already registered',
    );
    expect(signUp.verifications.sendEmailCode).not.toHaveBeenCalled();
  });

  it('reports thrown password sign-up errors through HeroUI danger feedback', async () => {
    const signUp = createSignUpMock();
    signUp.password.mockRejectedValue(
      createFlowError({ message: 'Password sign-up request failed' }),
    );
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useRegisterFlow());
    const current = result.current;
    if (current.mode !== 'form') {
      throw new Error('Expected register flow to start in form mode');
    }

    await act(async () => {
      await current.formViewProps.onSubmit();
    });

    expect(toastMocks.danger).toHaveBeenCalledWith(
      'Password sign-up request failed',
    );
    expect(signUp.verifications.sendEmailCode).not.toHaveBeenCalled();
  });

  it('resets Clerk before returning from verification to change the email', async () => {
    const signUp = createSignUpMock();
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useRegisterFlow());
    const current = result.current;
    if (current.mode !== 'form') {
      throw new Error('Expected register flow to start in form mode');
    }

    await act(async () => {
      await current.formViewProps.onSubmit();
    });
    const verificationCurrent = result.current;
    if (verificationCurrent.mode !== 'verification') {
      throw new Error('Expected register flow to enter verification mode');
    }

    await act(async () => {
      await verificationCurrent.verificationViewProps.onGoBack();
    });

    expect(signUp.reset).toHaveBeenCalledTimes(1);
    expect(mockSetValue).toHaveBeenCalledWith('email', '');
    expect(result.current.mode).toBe('form');
  });

  it('keeps verification active when Clerk cannot reset the sign-up attempt', async () => {
    const signUp = createSignUpMock();
    signUp.reset.mockResolvedValue({
      error: createFlowError({ message: 'Sign-up reset failed' }),
    });
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useRegisterFlow());
    const current = result.current;
    if (current.mode !== 'form') {
      throw new Error('Expected register flow to start in form mode');
    }

    await act(async () => {
      await current.formViewProps.onSubmit();
    });
    const verificationCurrent = result.current;
    if (verificationCurrent.mode !== 'verification') {
      throw new Error('Expected register flow to enter verification mode');
    }

    await act(async () => {
      await verificationCurrent.verificationViewProps.onGoBack();
    });

    expect(result.current.mode).toBe('verification');
    if (result.current.mode !== 'verification') {
      throw new Error('Expected verification to remain active after reset failure');
    }
    expect(result.current.verificationViewProps.globalError).toBe(
      'Sign-up reset failed',
    );
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  it('starts Google sign-up directly through the native SSO operation', async () => {
    const signUp = createSignUpMock();
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useRegisterFlow());
    const current = result.current;
    if (current.mode !== 'form') {
      throw new Error('Expected register flow to start in form mode');
    }

    await act(async () => {
      await current.formViewProps.onGoogleSignUp();
    });

    expect(signUp.reset).not.toHaveBeenCalled();
    expect(signUp.sso).toHaveBeenCalledWith({
      strategy: 'oauth_google',
      redirectCallbackUrl: '/sso-callback',
      redirectUrl: '/onboarding',
    });
  });

  it('starts Google and Apple through Clerk without resetting the sign-up resource', async () => {
    const signUp = createSignUpMock();
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useRegisterFlow());
    const current = result.current;
    if (current.mode !== 'form') {
      throw new Error('Expected register flow to start in form mode');
    }

    await act(async () => {
      await current.formViewProps.onGoogleSignUp();
    });
    await act(async () => {
      await current.formViewProps.onAppleSignUp();
    });

    expect(signUp.reset).not.toHaveBeenCalled();
    expect(signUp.sso).toHaveBeenNthCalledWith(1, {
      strategy: 'oauth_google',
      redirectCallbackUrl: '/sso-callback',
      redirectUrl: '/onboarding',
    });
    expect(signUp.sso).toHaveBeenNthCalledWith(2, {
      strategy: 'oauth_apple',
      redirectCallbackUrl: '/sso-callback',
      redirectUrl: '/onboarding',
    });
  });

  it('reports returned and thrown SSO failures through HeroUI danger feedback', async () => {
    const signUp = createSignUpMock();
    signUp.sso
      .mockResolvedValueOnce({
        error: createFlowError({ message: 'Google sign-up failed' }),
      })
      .mockRejectedValueOnce(
        createFlowError({ message: 'Apple sign-up failed' }),
      );
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useRegisterFlow());
    const current = result.current;
    if (current.mode !== 'form') {
      throw new Error('Expected register flow to start in form mode');
    }

    await act(async () => {
      await current.formViewProps.onGoogleSignUp();
    });
    await act(async () => {
      await current.formViewProps.onAppleSignUp();
    });

    expect(toastMocks.danger).toHaveBeenNthCalledWith(1, 'Google sign-up failed');
    expect(toastMocks.danger).toHaveBeenNthCalledWith(2, 'Apple sign-up failed');
  });
});
