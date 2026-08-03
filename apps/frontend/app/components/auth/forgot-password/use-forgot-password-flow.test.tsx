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

const { useForgotPasswordFlow, AVAILABLE_AT_STORAGE_KEY } =
  await import('./use-forgot-password-flow');

describe('useForgotPasswordFlow', () => {
  beforeEach(() => {
    clerkMocks.create.mockReset();
    clerkMocks.sendCode.mockReset();

    clerkMocks.create.mockResolvedValue({ error: null });

    clerkMocks.sendCode.mockResolvedValue({ error: null });

    sessionStorage.removeItem(AVAILABLE_AT_STORAGE_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts at email step', () => {
    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.step).toBe('email');
  });

  it('stores a cooldown after successfully sending the initial code', async () => {
    const { result } = renderHook(() => useForgotPasswordFlow());

    await act(async () => {
      await result.current.handleEmailSubmit('user@example.com');
    });

    expect(clerkMocks.create).toHaveBeenCalledWith({
      identifier: 'user@example.com',
    });

    expect(clerkMocks.sendCode).toHaveBeenCalledOnce();

    expect(sessionStorage.getItem(AVAILABLE_AT_STORAGE_KEY)).not.toBeNull();

    expect(result.current.step).toBe('verify-code');
  });

  it('restores cooldown state from a valid future timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const availableAt = Date.now() + 42_500;

    sessionStorage.setItem(AVAILABLE_AT_STORAGE_KEY, availableAt.toString());

    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.resendAvailableAt).toBe(availableAt);
    expect(result.current.remainingSeconds).toBe(43);
  });

  it('initializes with no cooldown when session storage is empty', () => {
    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.resendAvailableAt).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();
  });

  it('removes an expired timestamp and initializes with no cooldown', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const availableAt = Date.now() - 60_000;

    sessionStorage.setItem(AVAILABLE_AT_STORAGE_KEY, availableAt.toString());

    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.resendAvailableAt).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();
    expect(sessionStorage.getItem(AVAILABLE_AT_STORAGE_KEY)).toBeNull();
  });

  it('fails open when reading session storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('Session storage unavailable');
    });

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.resendAvailableAt).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();
  });

  it('recalculates remaining seconds as time advances', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const availableAt = Date.now() + 60_000;

    sessionStorage.setItem(AVAILABLE_AT_STORAGE_KEY, availableAt.toString());

    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.remainingSeconds).toBe(60);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current.remainingSeconds).toBe(59);
  });

  it('clears the cooldown state and storage when the countdown expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const availableAt = Date.now() + 2_000;

    sessionStorage.setItem(AVAILABLE_AT_STORAGE_KEY, availableAt.toString());

    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.remainingSeconds).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(result.current.resendAvailableAt).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();
    expect(sessionStorage.getItem(AVAILABLE_AT_STORAGE_KEY)).toBeNull();
  });

  it('still clears cooldown state when removing expired storage throws', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const availableAt = Date.now() + 2_000;

    sessionStorage.setItem(AVAILABLE_AT_STORAGE_KEY, availableAt.toString());

    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.remainingSeconds).toBe(2);

    vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new Error('Session storage unavailable');
    });

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(result.current.resendAvailableAt).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();

    // Removal failed, so the stored value should still exist.
    expect(sessionStorage.getItem(AVAILABLE_AT_STORAGE_KEY)).toBe(
      availableAt.toString(),
    );
  });

  it('clears the countdown interval when the hook unmounts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));

    const availableAt = Date.now() + 60_000;

    sessionStorage.setItem(AVAILABLE_AT_STORAGE_KEY, availableAt.toString());

    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { unmount } = renderHook(() => useForgotPasswordFlow());

    expect(clearIntervalSpy).not.toHaveBeenCalled();

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledOnce();
  });
});
