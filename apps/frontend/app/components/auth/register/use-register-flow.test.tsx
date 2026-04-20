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

interface MockSignUp {
  status: string | null;
  unverifiedFields: string[];
  missingFields: string[];
  password: ReturnType<typeof vi.fn>;
  verifications: {
    sendEmailCode: ReturnType<typeof vi.fn>;
  };
  sso: ReturnType<typeof vi.fn>;
}

vi.mock('@clerk/nextjs', () => ({
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

const createSignUpMock = (): MockSignUp => ({
  status: 'missing_requirements',
  unverifiedFields: ['email_address'],
  missingFields: [],
  password: vi.fn().mockResolvedValue({ error: null }),
  verifications: {
    sendEmailCode: vi.fn().mockResolvedValue({ error: null }),
  },
  sso: vi.fn().mockResolvedValue({ error: null }),
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

  it('starts Google sign-up without writing a local flow marker', async () => {
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

    expect(signUp.sso).toHaveBeenCalledWith({
      strategy: 'oauth_google',
      redirectCallbackUrl: '/sso-callback',
      redirectUrl: '/onboarding',
    });
    expect(window.sessionStorage.getItem('tailorcv:sso-flow')).toBeNull();
  });
});
