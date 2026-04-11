import { beforeEach, describe, expect, it, vi } from 'vitest';

const pollForEmailCodeMock = vi.fn();

vi.mock('@/e2e/helpers/mail/gmail-imap', () => ({
  pollForEmailCode: pollForEmailCodeMock,
}));

describe('pollForResetCode', () => {
  beforeEach(() => {
    pollForEmailCodeMock.mockReset();
  });

  it('forwards the reset-password subject to the Clerk mail helper', async () => {
    pollForEmailCodeMock.mockResolvedValueOnce('123456');

    const { pollForResetCode } = await import('@/e2e/helpers/mail/clerk-mail');

    await expect(
      pollForResetCode({
        emailAddress: 'user@example.com',
      }),
    ).resolves.toBe('123456');

    expect(pollForEmailCodeMock).toHaveBeenCalledTimes(1);
    expect(pollForEmailCodeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'reset password code',
        emailAddress: 'user@example.com',
      }),
    );
  });
});
