import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.hoisted(() => vi.fn());
const mockReplace = vi.hoisted(() => vi.fn());
const mockClearSSOFlowState = vi.hoisted(() => vi.fn());
const mockHasActiveSSOFlow = vi.hoisted(() => vi.fn());
const mockUpdateSignUp = vi.hoisted(() => vi.fn());
const mockSignUpState = vi.hoisted(() => ({
  signUp: null as MockSignUp | null,
  fetchStatus: 'idle',
}));
const mockFormState = vi.hoisted(() => ({
  data: {
    firstName: 'Taylor',
    lastName: 'Applicant',
  },
  isSubmitting: false,
}));
const mockReset = vi.hoisted(() => vi.fn());

interface MockSignUp {
  status: string | null;
  firstName?: string | null;
  lastName?: string | null;
  verifications: {
    externalAccount: {
      status: string | null;
    };
  };
  finalize: ReturnType<typeof vi.fn>;
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({
    client: {
      signUp: {
        update: mockUpdateSignUp,
      },
    },
  }),
  useSignUp: () => mockSignUpState,
}));

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit:
      (handler: (data: typeof mockFormState.data) => Promise<void>) => () =>
        handler(mockFormState.data),
    reset: mockReset,
    formState: {
      isSubmitting: mockFormState.isSubmitting,
    },
  }),
}));

vi.mock('@/lib/auth/sso-flow', () => ({
  clearSSOFlowState: mockClearSSOFlowState,
  hasActiveSSOFlow: mockHasActiveSSOFlow,
}));

vi.mock('@/lib/config', () => ({
  config: {
    auth: {
      afterSignUpUrl: '/onboarding',
    },
  },
}));

const { useSSOContinueFlow } = await import('./use-sso-continue-flow');

const createSignUpMock = (): MockSignUp => ({
  status: 'missing_requirements',
  firstName: null,
  lastName: null,
  verifications: {
    externalAccount: {
      status: 'verified',
    },
  },
  finalize: vi.fn().mockResolvedValue({ error: null }),
});

describe('useSSOContinueFlow', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockClearSSOFlowState.mockReset();
    mockHasActiveSSOFlow.mockReset();
    mockUpdateSignUp.mockReset();
    mockReset.mockReset();
    mockFormState.data = {
      firstName: 'Taylor',
      lastName: 'Applicant',
    };
    mockFormState.isSubmitting = false;
    mockSignUpState.fetchStatus = 'idle';
    mockSignUpState.signUp = createSignUpMock();
  });

  it('prefills the form from Clerk-provided name values', async () => {
    mockSignUpState.signUp = {
      ...createSignUpMock(),
      firstName: 'Ada',
      lastName: 'Lovelace',
    };
    mockHasActiveSSOFlow.mockReturnValue(true);

    renderHook(() => useSSOContinueFlow());

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        firstName: 'Ada',
        lastName: 'Lovelace',
      });
    });
  });

  it('redirects invalid SSO continuation access back to register and clears flow state', async () => {
    mockHasActiveSSOFlow.mockReturnValue(false);

    renderHook(() => useSSOContinueFlow());

    await waitFor(() => {
      expect(mockClearSSOFlowState).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/register');
    });
  });

  it('keeps the user on the page for a valid active SSO continuation flow', async () => {
    mockHasActiveSSOFlow.mockReturnValue(true);

    renderHook(() => useSSOContinueFlow());

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalled();
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockClearSSOFlowState).not.toHaveBeenCalled();
  });

  it('updates the Clerk sign-up with the submitted continuation values', async () => {
    mockHasActiveSSOFlow.mockReturnValue(true);
    mockUpdateSignUp.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSSOContinueFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockUpdateSignUp).toHaveBeenCalledWith({
      firstName: 'Taylor',
      lastName: 'Applicant',
    });
  });

  it('finalizes a completed sign-up and clears the SSO flow state before navigating', async () => {
    const signUp = createSignUpMock();
    mockHasActiveSSOFlow.mockReturnValue(true);
    mockUpdateSignUp.mockImplementation(async () => {
      signUp.status = 'complete';
    });
    signUp.finalize.mockImplementation(async ({ navigate }) => {
      await navigate({
        session: null,
        decorateUrl: (url: string) => url,
      });
      return { error: null };
    });
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useSSOContinueFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(signUp.finalize).toHaveBeenCalledTimes(1);
    expect(mockClearSSOFlowState).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/onboarding');
  });

  it('surfaces finalize errors inline when Clerk cannot complete sign-up', async () => {
    const signUp = createSignUpMock();
    mockHasActiveSSOFlow.mockReturnValue(true);
    mockUpdateSignUp.mockImplementation(async () => {
      signUp.status = 'complete';
    });
    signUp.finalize.mockResolvedValue({
      error: {
        clerkError: true,
        message: 'Unable to finish sign up',
      },
    });
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useSSOContinueFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.globalError).toBe('Unable to finish sign up');
  });

  it('surfaces unexpected post-update statuses instead of silently stalling', async () => {
    const signUp = createSignUpMock();
    mockHasActiveSSOFlow.mockReturnValue(true);
    mockUpdateSignUp.mockResolvedValue(undefined);
    signUp.status = 'missing_requirements';
    mockSignUpState.signUp = signUp;

    const { result } = renderHook(() => useSSOContinueFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.globalError).toBe(
      'Unexpected sign-up status: missing requirements. Please try again.',
    );
  });

  it('surfaces Clerk update errors inline', async () => {
    mockHasActiveSSOFlow.mockReturnValue(true);
    mockUpdateSignUp.mockRejectedValue({
      clerkError: true,
      message: 'Unable to continue sign up',
    });

    const { result } = renderHook(() => useSSOContinueFlow());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.globalError).toBe('Unable to continue sign up');
  });
});
