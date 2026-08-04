import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const clerkMocks = vi.hoisted(() => ({
  create: vi.fn(),
  sendCode: vi.fn(),
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
    },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
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

    clerkMocks.create.mockResolvedValue({ error: null });

    clerkMocks.sendCode.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts at email step', () => {
    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.step).toBe('email');
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
