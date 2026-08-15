import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const clerkMocks = vi.hoisted(() => ({
  create: vi.fn(),
  sendCode: vi.fn(),
  reset: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  danger: vi.fn(),
  success: vi.fn(),
}));

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  getSearchParam: vi.fn(),
  searchParamsToString: vi.fn(),
}));

vi.mock('@clerk/nextjs', () => ({
  useSignIn: () => ({
    fetchStatus: 'idle',
    signIn: {
      status: 'needs_identifier',
      create: clerkMocks.create,
      resetPasswordEmailCode: {
        sendCode: clerkMocks.sendCode,
      },
      reset: clerkMocks.reset,
    },
  }),
}));

vi.mock('@heroui/react', () => ({
  toast: toastMocks,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigationMocks.push,
    replace: navigationMocks.replace,
  }),
  useSearchParams: () => ({
    get: navigationMocks.getSearchParam,
    toString: navigationMocks.searchParamsToString,
  }),
}));

vi.mock('@/lib/config', () => ({
  config: {
    auth: {
      afterSignInUrl: '/dashboard',
    },
  },
}));

const { useForgotPasswordFlow } = await import('./use-forgot-password-flow');

describe('useForgotPasswordFlow', () => {
  beforeEach(() => {
    clerkMocks.create.mockReset();
    clerkMocks.sendCode.mockReset();
    toastMocks.danger.mockReset();
    toastMocks.success.mockReset();
    clerkMocks.reset.mockReset();
    navigationMocks.push.mockReset();
    navigationMocks.replace.mockReset();
    navigationMocks.getSearchParam.mockReset();
    navigationMocks.searchParamsToString.mockReset();

    clerkMocks.create.mockResolvedValue({ error: null });
    clerkMocks.sendCode.mockResolvedValue({ error: null });
    clerkMocks.reset.mockResolvedValue({ error: null });
    navigationMocks.getSearchParam.mockReturnValue(null);
    navigationMocks.searchParamsToString.mockReturnValue('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts at email step', () => {
    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.step).toBe('email');
  });

  it('exposes the email handoff once and removes it from the URL', () => {
    navigationMocks.getSearchParam.mockImplementation((name: string) =>
      name === 'email' ? 'user@example.com' : null,
    );
    navigationMocks.searchParamsToString.mockReturnValue(
      'email=user%40example.com&source=login',
    );

    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.emailPrefill).toBe('user@example.com');
    expect(navigationMocks.replace).toHaveBeenCalledWith(
      '/forgot-password?source=login',
      { scroll: false },
    );
  });

  it('shows a restart error and does not create a sign-in attempt when Clerk reset rejects', async () => {
    clerkMocks.reset.mockRejectedValueOnce(new Error('Clerk reset failed'));

    const { result } = renderHook(() => useForgotPasswordFlow());

    await act(async () => {
      await result.current.handleEmailSubmit('user@example.com');
    });

    expect(clerkMocks.create).not.toHaveBeenCalled();
    expect(toastMocks.danger).toHaveBeenCalledOnce();
  });

  it('starts a cooldown after successfully sending the initial code', async () => {
    const { result } = renderHook(() => useForgotPasswordFlow());

    await act(async () => {
      await result.current.handleEmailSubmit('user@example.com');
    });

    expect(clerkMocks.create).toHaveBeenCalledWith({
      identifier: 'user@example.com',
    });

    expect(clerkMocks.sendCode).toHaveBeenCalledOnce();

    expect(result.current.step).toBe('verify-code');
  });

  it('recalculates remaining seconds as time advances', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const { result } = renderHook(() => useForgotPasswordFlow());

    await act(async () => {
      await result.current.handleEmailSubmit('user@example.com');
    });

    expect(result.current.resendAvailableAt).toBe(Date.now() + 60_000);
    expect(result.current.remainingSeconds).toBe(60);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current.remainingSeconds).toBe(59);
  });

  it('clears the cooldown state when the countdown expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const { result } = renderHook(() => useForgotPasswordFlow());

    await act(async () => {
      await result.current.handleEmailSubmit('user@example.com');
    });

    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.resendAvailableAt).toBe(Date.now() + 60_000);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.resendAvailableAt).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();
  });

  it('blocks resend during cooldown and allows it after expiry', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const { result } = renderHook(() => useForgotPasswordFlow());

    await act(async () => {
      await result.current.handleEmailSubmit('user@example.com');
    });

    const initialAvailableAt = result.current.resendAvailableAt;

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current.remainingSeconds).toBe(55);

    await act(async () => {
      await result.current.handleResend();
    });

    expect(clerkMocks.sendCode).toHaveBeenCalledOnce();
    expect(result.current.resendAvailableAt).toBe(initialAvailableAt);
    expect(result.current.remainingSeconds).toBe(55);

    act(() => {
      vi.advanceTimersByTime(55_000);
    });

    expect(result.current.resendAvailableAt).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();

    await act(async () => {
      await result.current.handleResend();
    });

    expect(clerkMocks.sendCode).toHaveBeenCalledTimes(2);
    expect(result.current.resendAvailableAt).toBe(Date.now() + 60_000);
    expect(result.current.remainingSeconds).toBe(60);
  });

  it('keeps resend available when the resend request fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const { result } = renderHook(() => useForgotPasswordFlow());

    await act(async () => {
      await result.current.handleEmailSubmit('user@example.com');
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    clerkMocks.sendCode.mockResolvedValueOnce({
      error: new Error('Clerk sendCode is not available'),
    });

    await act(async () => {
      await result.current.handleResend();
    });

    expect(clerkMocks.sendCode).toHaveBeenCalledTimes(2);
    expect(result.current.resendAvailableAt).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();
  });

  it('blocks duplicate resend requests while a resend is in progress', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const { result } = renderHook(() => useForgotPasswordFlow());

    await act(async () => {
      await result.current.handleEmailSubmit('user@example.com');
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.resendAvailableAt).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();

    let resolveResend!: (value: { error: null }) => void;
    const pendingResend = new Promise<{ error: null }>((resolve) => {
      resolveResend = resolve;
    });

    clerkMocks.sendCode.mockReturnValueOnce(pendingResend);

    let resendRequest!: Promise<void>;

    act(() => {
      resendRequest = result.current.handleResend();
    });

    expect(result.current.isResending).toBe(true);

    await act(async () => {
      await result.current.handleResend();
    });

    // Initial code request plus one pending resend request.
    expect(clerkMocks.sendCode).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveResend({ error: null });
      await resendRequest;
    });

    expect(result.current.isResending).toBe(false);
  });
});
