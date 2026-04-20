import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.hoisted(() => vi.fn());
const mockReplace = vi.hoisted(() => vi.fn());
const mockSetActive = vi.hoisted(() => vi.fn());
const mockSignInState = vi.hoisted(() => ({
  signIn: null as null | MockSignIn,
}));
const mockSignUpState = vi.hoisted(() => ({
  signUp: null as null | MockSignUp,
}));

interface MockSignIn {
  status: string | null;
  isTransferable: boolean;
  supportedFirstFactors?: Array<{ strategy: string }>;
  existingSession?: { sessionId: string };
  finalize: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
}

interface MockSignUp {
  status: string | null;
  isTransferable: boolean;
  existingSession?: { sessionId: string };
  verifications: {
    externalAccount: {
      status: string | null;
    };
  };
  finalize: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({
    loaded: true,
    setActive: mockSetActive,
  }),
  useSignIn: () => mockSignInState,
  useSignUp: () => mockSignUpState,
}));

vi.mock('@/lib/config', () => ({
  config: {
    auth: {
      afterSignInUrl: '/dashboard',
      afterSignUpUrl: '/onboarding',
    },
  },
}));

const { useSSOCallback } = await import('./use-sso-callback');

const createSignInMock = (): MockSignIn => ({
  status: 'needs_identifier',
  isTransferable: false,
  supportedFirstFactors: [],
  finalize: vi.fn().mockResolvedValue({ error: null }),
  create: vi.fn().mockResolvedValue({ error: null }),
});

const createSignUpMock = (): MockSignUp => ({
  status: 'missing_requirements',
  isTransferable: false,
  verifications: {
    externalAccount: {
      status: 'verified',
    },
  },
  finalize: vi.fn().mockResolvedValue({ error: null }),
  create: vi.fn().mockResolvedValue({ error: null }),
});

describe('useSSOCallback', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockSetActive.mockReset();
    mockSignInState.signIn = createSignInMock();
    mockSignUpState.signUp = createSignUpMock();
    window.sessionStorage.clear();
  });

  it('transfers unknown-user OAuth sign-ins into sign-up and finalizes without SSO continuation', async () => {
    const signIn = createSignInMock();
    const signUp = createSignUpMock();
    signIn.isTransferable = true;
    signUp.create.mockImplementation(async () => {
      signUp.status = 'complete';
      return { error: null };
    });
    signUp.finalize.mockImplementation(async ({ navigate }) => {
      await navigate({
        session: null,
        decorateUrl: (url: string) => url,
      });
      return { error: null };
    });
    mockSignInState.signIn = signIn;
    mockSignUpState.signUp = signUp;

    renderHook(() => useSSOCallback());

    await waitFor(() => {
      expect(signUp.finalize).toHaveBeenCalledTimes(1);
    });

    expect(signUp.create).toHaveBeenCalledWith({ transfer: true });
    expect(mockPush).toHaveBeenCalledWith('/onboarding');
    expect(mockPush).not.toHaveBeenCalledWith('/sso-continue');
  });

  it('surfaces remaining missing requirements as a callback error', async () => {
    const signUp = createSignUpMock();
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useSSOCallback());

    await waitFor(() => {
      expect(result.current.error).toContain('Clerk still requires additional sign-up fields');
    });

    expect(mockPush).not.toHaveBeenCalledWith('/sso-continue');
  });

  it('redirects direct callback visits with no Clerk callback resources to login', async () => {
    mockSignInState.signIn = null;
    mockSignUpState.signUp = null;

    renderHook(() => useSSOCallback());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
