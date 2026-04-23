import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.hoisted(() => vi.fn());
const mockReplace = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockGetSearchParam = vi.hoisted(() => vi.fn());
const mockSearchParamsToString = vi.hoisted(() => vi.fn(() => 'auth_reason=reset_password_required'));
const mockLocationAssign = vi.hoisted(() => vi.fn());
const originalLocation = window.location;
const mockSignInState = vi.hoisted(() => ({
  signIn: null as null | MockSignIn,
  fetchStatus: 'idle',
}));
const mockFormState = vi.hoisted(() => ({
  data: {
    email: 'user@example.com',
    password: 'Password123!',
  },
  isSubmitting: false,
}));

interface MockClerkFlowError {
  clerkError: true;
  message: string;
}

interface MockSignIn {
  status: string | null;
  supportedSecondFactors?: Array<{ strategy: string }>;
  create: ReturnType<typeof vi.fn>;
  password: ReturnType<typeof vi.fn>;
  finalize: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  firstFactorVerification: {
    externalVerificationRedirectURL: URL | null;
  };
  mfa: {
    sendEmailCode: ReturnType<typeof vi.fn>;
    verifyEmailCode: ReturnType<typeof vi.fn>;
  };
  sso: ReturnType<typeof vi.fn>;
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: mockGetSearchParam,
    toString: mockSearchParamsToString,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

vi.mock('@clerk/nextjs', () => ({
  useSignIn: () => mockSignInState,
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
  }),
}));

vi.mock('@/lib/config', () => ({
  config: {
    auth: {
      afterSignInUrl: '/dashboard',
    },
  },
}));

const { useLoginFlow } = await import('./use-login-flow');

const createFlowError = ({ message }: { message: string }): MockClerkFlowError => ({
  clerkError: true,
  message,
});

const createSignInMock = (): MockSignIn => ({
  status: 'needs_identifier',
  supportedSecondFactors: [],
  create: vi.fn().mockResolvedValue({ error: null }),
  password: vi.fn().mockResolvedValue({ error: null }),
  finalize: vi.fn().mockResolvedValue({ error: null }),
  reset: vi.fn().mockResolvedValue({ error: null }),
  firstFactorVerification: {
    externalVerificationRedirectURL: new URL('https://accounts.example.com/oauth'),
  },
  mfa: {
    sendEmailCode: vi.fn().mockResolvedValue({ error: null }),
    verifyEmailCode: vi.fn().mockResolvedValue({ error: null }),
  },
  sso: vi.fn().mockResolvedValue({ error: null }),
});

describe('useLoginFlow', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockToastError.mockReset();
    mockToastSuccess.mockReset();
    mockGetSearchParam.mockReset();
    mockSearchParamsToString.mockClear();
    mockLocationAssign.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign: mockLocationAssign,
      },
    });
    window.sessionStorage.clear();
    mockFormState.data = {
      email: 'user@example.com',
      password: 'Password123!',
    };
    mockFormState.isSubmitting = false;
    mockSignInState.fetchStatus = 'idle';
    mockSignInState.signIn = createSignInMock();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    mockLocationAssign.mockReset();
    vi.clearAllMocks();
  });

  it('finalizes successful password sign-ins', async () => {
    const signIn = createSignInMock();
    signIn.status = 'complete';
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(signIn.create).toHaveBeenCalledWith({ identifier: 'user@example.com' });
    expect(signIn.password).toHaveBeenCalledWith({ password: 'Password123!' });
    expect(signIn.finalize).toHaveBeenCalledTimes(1);
  });

  it('surfaces create-step Clerk errors and skips the password step', async () => {
    const signIn = createSignInMock();
    signIn.create.mockResolvedValue({
      error: createFlowError({ message: 'Unknown identifier' }),
    });
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.globalError).toBe('Unknown identifier');
    expect(signIn.password).not.toHaveBeenCalled();
  });

  it('surfaces password-step Clerk errors after a successful create step', async () => {
    const signIn = createSignInMock();
    signIn.password.mockResolvedValue({
      error: createFlowError({ message: 'Password is incorrect' }),
    });
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.globalError).toBe('Password is incorrect');
  });

  it('enters verification mode when Clerk requires Client Trust email verification', async () => {
    const signIn = createSignInMock();
    signIn.status = 'needs_client_trust';
    signIn.supportedSecondFactors = [{ strategy: 'email_code' }];
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(signIn.mfa.sendEmailCode).toHaveBeenCalledTimes(1);
    expect(result.current.verifying).toBe(true);
  });

  it('shows an inline error for unsupported Client Trust factors', async () => {
    const signIn = createSignInMock();
    signIn.status = 'needs_client_trust';
    signIn.supportedSecondFactors = [{ strategy: 'phone_code' }];
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.globalError).toBe(
      'Trusted-device verification is required, but email code verification is not available for this account.',
    );
  });

  it('shows the unsupported MFA message for account-level second factor requirements', async () => {
    const signIn = createSignInMock();
    signIn.status = 'needs_second_factor';
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.globalError).toBe(
      'Your account requires a second verification method after password sign-in. This login form does not support that MFA step yet.',
    );
  });

  it('redirects forced password resets to the forgot-password flow', async () => {
    const signIn = createSignInMock();
    signIn.status = 'needs_new_password';
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      'For your security, you must reset your password.',
    );
    expect(mockPush).toHaveBeenCalledWith('/forgot-password');
  });

  it('surfaces Clerk verification errors from the Client Trust step', async () => {
    const signIn = createSignInMock();
    signIn.status = 'needs_client_trust';
    signIn.supportedSecondFactors = [{ strategy: 'email_code' }];
    signIn.mfa.verifyEmailCode.mockResolvedValue({
      error: createFlowError({ message: 'Invalid code' }),
    });
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    await act(async () => {
      result.current.setCode('123456');
      await result.current.handleVerification({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(result.current.globalError).toBe('Invalid code');
  });

  it('finalizes after a successful Client Trust verification', async () => {
    const signIn = createSignInMock();
    signIn.status = 'needs_client_trust';
    signIn.supportedSecondFactors = [{ strategy: 'email_code' }];
    signIn.mfa.verifyEmailCode.mockImplementation(async () => {
      signIn.status = 'complete';
      return { error: null };
    });
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    await act(async () => {
      result.current.setCode('123456');
      await result.current.handleVerification({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(signIn.finalize).toHaveBeenCalledTimes(1);
  });

  it('shows the auth notice and strips the reason query param from the URL', async () => {
    mockGetSearchParam.mockReturnValue('reset_password_required');

    const { result } = renderHook(() => useLoginFlow());

    await waitFor(() => {
      expect(result.current.authNotice?.title).toBe('Reset your password to continue');
    });

    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('starts Google OAuth with a fresh sign-in attempt and provider redirect', async () => {
    const signIn = createSignInMock();
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleGoogleSignIn();
    });

    expect(signIn.create).toHaveBeenCalledWith({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      actionCompleteRedirectUrl: '/dashboard',
    });
    expect(signIn.sso).not.toHaveBeenCalled();
    expect(mockLocationAssign).toHaveBeenCalledWith(
      new URL('https://accounts.example.com/oauth'),
    );
    expect(window.sessionStorage.getItem('tailorcv:sso-flow')).toBeNull();
  });

  it('surfaces an initialization error when Clerk does not provide a provider redirect URL', async () => {
    const signIn = createSignInMock();
    signIn.firstFactorVerification.externalVerificationRedirectURL = null;
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleGoogleSignIn();
    });

    expect(result.current.globalError).toBe('OAuth failed to initialize');
    expect(mockLocationAssign).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem('tailorcv:sso-flow')).toBeNull();
  });

  it('creates a fresh OAuth sign-in attempt before each provider redirect', async () => {
    const signIn = createSignInMock();
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleGoogleSignIn();
    });

    await act(async () => {
      await result.current.handleAppleSignIn();
    });

    expect(signIn.reset).toHaveBeenCalledTimes(2);
    expect(signIn.reset.mock.invocationCallOrder[0]).toBeLessThan(
      signIn.create.mock.invocationCallOrder[0],
    );
    expect(signIn.reset.mock.invocationCallOrder[1]).toBeLessThan(
      signIn.create.mock.invocationCallOrder[1],
    );
    expect(signIn.create).toHaveBeenNthCalledWith(1, {
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      actionCompleteRedirectUrl: '/dashboard',
    });
    expect(signIn.create).toHaveBeenNthCalledWith(2, {
      strategy: 'oauth_apple',
      redirectUrl: '/sso-callback',
      actionCompleteRedirectUrl: '/dashboard',
    });
    expect(mockLocationAssign).toHaveBeenCalledTimes(2);
  });

  it('clears stale OAuth errors before starting a new provider', async () => {
    const signIn = createSignInMock();
    signIn.create
      .mockResolvedValueOnce({
        error: createFlowError({ message: 'OAuth popup was closed' }),
      })
      .mockResolvedValueOnce({ error: null });
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleGoogleSignIn();
    });

    expect(result.current.globalError).toBe('OAuth popup was closed');

    await act(async () => {
      await result.current.handleAppleSignIn();
    });

    expect(result.current.globalError).toBe('');
  });

  it('surfaces Google sign-in immediate Clerk errors', async () => {
    const signIn = createSignInMock();
    signIn.create.mockResolvedValue({
      error: createFlowError({ message: 'OAuth popup was closed' }),
    });
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleGoogleSignIn();
    });

    expect(result.current.globalError).toBe('OAuth popup was closed');
  });

  it('surfaces Apple sign-in errors thrown before redirect', async () => {
    const signIn = createSignInMock();
    signIn.create.mockRejectedValue(createFlowError({ message: 'Network failure' }));
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.handleAppleSignIn();
    });

    expect(result.current.globalError).toBe('Network failure');
  });
});
