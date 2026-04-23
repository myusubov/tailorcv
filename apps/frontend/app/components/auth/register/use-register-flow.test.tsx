import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSignUpState = vi.hoisted(() => ({
  signUp: null as null | MockSignUp,
  fetchStatus: 'idle',
}));
const mockSignInState = vi.hoisted(() => ({
  signIn: null as null | MockSignIn,
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
const mockLocationAssign = vi.hoisted(() => vi.fn());

interface MockSignIn {
  create: ReturnType<typeof vi.fn>;
  firstFactorVerification: {
    externalVerificationRedirectURL: URL | null;
  };
}

interface MockSignUp {
  status: string | null;
  unverifiedFields: string[];
  missingFields: string[];
  password: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  verifications: {
    sendEmailCode: ReturnType<typeof vi.fn>;
  };
}

vi.mock('@clerk/nextjs', () => ({
  useSignIn: () => mockSignInState,
  useSignUp: () => mockSignUpState,
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
    setValue: vi.fn(),
    reset: vi.fn(),
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

const createSignInMock = (): MockSignIn => ({
  create: vi.fn().mockResolvedValue({ error: null }),
  firstFactorVerification: {
    externalVerificationRedirectURL: new URL('https://accounts.example.com/oauth'),
  },
});

const createSignUpMock = (): MockSignUp => ({
  status: 'missing_requirements',
  unverifiedFields: ['email_address'],
  missingFields: [],
  password: vi.fn().mockResolvedValue({ error: null }),
  reset: vi.fn().mockResolvedValue({ error: null }),
  verifications: {
    sendEmailCode: vi.fn().mockResolvedValue({ error: null }),
  },
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
    mockPush.mockClear();
    mockLocationAssign.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign: mockLocationAssign,
      },
    });
    mockSignInState.fetchStatus = 'idle';
    mockSignInState.signIn = createSignInMock();
    mockSignUpState.fetchStatus = 'idle';
    mockSignUpState.signUp = createSignUpMock();
    window.sessionStorage.clear();
  });

  it('creates password sign-ups without account profile names', async () => {
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
  });

  it('starts Google sign-up with a fresh sign-in OAuth attempt and provider redirect', async () => {
    const signIn = createSignInMock();
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useRegisterFlow());
    const current = result.current;

    if (current.mode !== 'form') {
      throw new Error('Expected register flow to start in form mode');
    }

    await act(async () => {
      await current.formViewProps.onGoogleSignUp();
    });

    expect(signIn.create).toHaveBeenCalledWith({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      actionCompleteRedirectUrl: '/onboarding',
    });
    expect(mockLocationAssign).toHaveBeenCalledWith(
      new URL('https://accounts.example.com/oauth'),
    );
    expect(window.sessionStorage.getItem('tailorcv:sso-flow')).toBeNull();
  });

  it('creates a fresh OAuth sign-in attempt before each sign-up provider redirect', async () => {
    const signIn = createSignInMock();
    mockSignInState.signIn = signIn;

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

    expect(signIn.create).toHaveBeenNthCalledWith(1, {
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      actionCompleteRedirectUrl: '/onboarding',
    });
    expect(signIn.create).toHaveBeenNthCalledWith(2, {
      strategy: 'oauth_apple',
      redirectUrl: '/sso-callback',
      actionCompleteRedirectUrl: '/onboarding',
    });
    expect(mockLocationAssign).toHaveBeenCalledTimes(2);
  });

  it('clears stale OAuth errors before starting a new provider', async () => {
    const signIn = createSignInMock();
    signIn.create
      .mockResolvedValueOnce({
        error: {
          clerkError: true,
          message: 'OAuth popup was closed',
        },
      })
      .mockResolvedValueOnce({ error: null });
    mockSignInState.signIn = signIn;

    const { result } = renderHook(() => useRegisterFlow());
    const current = result.current;

    if (current.mode !== 'form') {
      throw new Error('Expected register flow to start in form mode');
    }

    await act(async () => {
      await current.formViewProps.onGoogleSignUp();
    });

    expect(result.current.mode).toBe('form');
    if (result.current.mode !== 'form') {
      throw new Error('Expected register flow to remain in form mode');
    }
    expect(result.current.formViewProps.globalError).toBe('OAuth popup was closed');

    const retryCurrent = result.current;
    if (retryCurrent.mode !== 'form') {
      throw new Error('Expected register flow to remain in form mode');
    }

    await act(async () => {
      await retryCurrent.formViewProps.onAppleSignUp();
    });

    expect(result.current.mode).toBe('form');
    if (result.current.mode !== 'form') {
      throw new Error('Expected register flow to remain in form mode');
    }
    expect(result.current.formViewProps.globalError).toBe('');
  });
});
