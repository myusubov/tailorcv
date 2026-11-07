import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from 'shared';

const mocks = vi.hoisted(() => {
  const auth = Object.assign(vi.fn(), { protect: vi.fn() });
  return {
    auth,
    getOnboardingStatus: vi.fn(),
    redirect: vi.fn((url: string): never => {
      throw new Error(`REDIRECT:${url}`);
    }),
  };
});

vi.mock('server-only', () => ({}));
vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/data/onboarding', () => ({
  getOnboardingStatus: mocks.getOnboardingStatus,
}));
vi.mock('@/lib/config', () => ({
  env: { NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/login' },
  ROUTES: { ONBOARDING: '/onboarding', RESUMES: '/resumes' },
}));

import {
  redirectIfSignedIn,
  requireNotOnboardedUser,
  requireOnboardedUser,
  requireUser,
} from './guards';

const USER_ID = 'user_123';
const COMPLETED_AT = '2026-11-04T10:00:00.000Z';

function statusOk(onboardingCompletedAt: string | null) {
  return { ok: true, status: 200, data: { onboardingCompletedAt } };
}

function statusFailed(status: number, code: ErrorCode) {
  return { ok: false, status, error: { message: 'failed', code } };
}

beforeEach(() => {
  mocks.auth.protect.mockResolvedValue({ userId: USER_ID });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('requireUser', () => {
  it('returns the id of the signed-in user', async () => {
    await expect(requireUser()).resolves.toBe(USER_ID);
  });

  it('does not swallow the rejection when Clerk blocks the request', async () => {
    mocks.auth.protect.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(requireUser()).rejects.toThrow('NEXT_REDIRECT');
  });
});

describe('requireOnboardedUser', () => {
  it('asks the backend about the signed-in user', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(statusOk(COMPLETED_AT));

    await requireOnboardedUser();

    expect(mocks.getOnboardingStatus).toHaveBeenCalledWith({
      params: { userId: USER_ID },
    });
  });

  it('lets an onboarded user through without redirecting', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(statusOk(COMPLETED_AT));

    await expect(requireOnboardedUser()).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('lets a user through when the completion date is in the future', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(
      statusOk('2030-01-01T00:00:00.000Z'),
    );

    await expect(requireOnboardedUser()).resolves.toBeUndefined();
  });

  it('sends a user without a completion date to onboarding', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(statusOk(null));

    await expect(requireOnboardedUser()).rejects.toThrow(
      'REDIRECT:/onboarding',
    );
  });

  it('sends the user to sign-in when the backend answers 401', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(
      statusFailed(401, ErrorCode.UNAUTHORIZED),
    );

    await expect(requireOnboardedUser()).rejects.toThrow('REDIRECT:/login');
  });

  it('throws instead of redirecting when the backend answers 500', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(
      statusFailed(500, ErrorCode.INTERNAL_ERROR),
    );

    await expect(requireOnboardedUser()).rejects.toThrow(
      'Failed to fetch onboarding status',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('throws instead of redirecting when the backend answers 400 for a database error', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(
      statusFailed(400, ErrorCode.BAD_REQUEST),
    );

    await expect(requireOnboardedUser()).rejects.toThrow(
      'Failed to fetch onboarding status',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('throws instead of redirecting when the backend is unreachable', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(
      statusFailed(0, ErrorCode.NETWORK_ERROR),
    );

    await expect(requireOnboardedUser()).rejects.toThrow(
      'Failed to fetch onboarding status',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('logs the failed result on the server before throwing', async () => {
    const failed = statusFailed(500, ErrorCode.INTERNAL_ERROR);
    mocks.getOnboardingStatus.mockResolvedValue(failed);

    await expect(requireOnboardedUser()).rejects.toThrow();

    expect(console.error).toHaveBeenCalledWith(
      'Failed to fetch onboarding status:',
      failed,
    );
  });

  it('throws when a successful response has no data', async () => {
    mocks.getOnboardingStatus.mockResolvedValue({
      ok: true,
      status: 200,
      data: undefined,
    });

    await expect(requireOnboardedUser()).rejects.toThrow(
      'Invalid onboarding status',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('throws when a successful response has null data', async () => {
    mocks.getOnboardingStatus.mockResolvedValue({
      ok: true,
      status: 204,
      data: null,
    });

    await expect(requireOnboardedUser()).rejects.toThrow(
      'Invalid onboarding status',
    );
  });

  it('throws when the completion date is not a valid date', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(statusOk('not-a-date'));

    await expect(requireOnboardedUser()).rejects.toThrow(
      'Invalid onboarding status',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe('requireNotOnboardedUser', () => {
  it('asks the backend about the signed-in user', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(statusOk(null));

    await requireNotOnboardedUser();

    expect(mocks.getOnboardingStatus).toHaveBeenCalledWith({
      params: { userId: USER_ID },
    });
  });

  it('lets a user without a completion date through', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(statusOk(null));

    await expect(requireNotOnboardedUser()).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('sends an onboarded user to the resumes page', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(statusOk(COMPLETED_AT));

    await expect(requireNotOnboardedUser()).rejects.toThrow(
      'REDIRECT:/resumes',
    );
  });

  it('sends the user to sign-in when the backend answers 401', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(
      statusFailed(401, ErrorCode.UNAUTHORIZED),
    );

    await expect(requireNotOnboardedUser()).rejects.toThrow('REDIRECT:/login');
  });

  it('throws instead of redirecting when the backend answers 500', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(
      statusFailed(500, ErrorCode.INTERNAL_ERROR),
    );

    await expect(requireNotOnboardedUser()).rejects.toThrow(
      'Failed to fetch onboarding status',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('throws instead of redirecting when the backend is unreachable', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(
      statusFailed(0, ErrorCode.NETWORK_ERROR),
    );

    await expect(requireNotOnboardedUser()).rejects.toThrow(
      'Failed to fetch onboarding status',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('throws when a successful response has no data', async () => {
    mocks.getOnboardingStatus.mockResolvedValue({
      ok: true,
      status: 200,
      data: undefined,
    });

    await expect(requireNotOnboardedUser()).rejects.toThrow(
      'Invalid onboarding status',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('throws when the completion date is not a valid date', async () => {
    mocks.getOnboardingStatus.mockResolvedValue(statusOk('not-a-date'));

    await expect(requireNotOnboardedUser()).rejects.toThrow(
      'Invalid onboarding status',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe('redirectIfSignedIn', () => {
  it('sends a signed-in user to the resumes page', async () => {
    mocks.auth.mockResolvedValue({ userId: USER_ID });

    await expect(redirectIfSignedIn()).rejects.toThrow('REDIRECT:/resumes');
  });

  it('lets a signed-out user through without redirecting', async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    await expect(redirectIfSignedIn()).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('does not ask the backend about onboarding', async () => {
    mocks.auth.mockResolvedValue({ userId: USER_ID });

    await expect(redirectIfSignedIn()).rejects.toThrow();

    expect(mocks.getOnboardingStatus).not.toHaveBeenCalled();
  });
});
