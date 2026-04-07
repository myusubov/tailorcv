import { beforeEach, describe, expect, it, vi } from 'vitest';

const pollForEmailCodeMock = vi.fn();

vi.mock('@/e2e/helpers/mail/gmail-imap', () => ({
  pollForEmailCode: pollForEmailCodeMock,
}));

describe('pollForResetCode', () => {
  beforeEach(() => {
    pollForEmailCodeMock.mockReset();
  });

  it('prefers a fresh reset email before falling back to the grace window', async () => {
    pollForEmailCodeMock
      .mockRejectedValueOnce(new Error('fresh miss'))
      .mockResolvedValueOnce('123456');

    const { pollForResetCode } = await import('@/e2e/helpers/mail/clerk-mail');

    await expect(
      pollForResetCode({
        emailAddress: 'user@example.com',
        imapUser: 'imap-user',
        imapPassword: 'imap-pass',
        startedAt: 1_000,
        timeoutMs: 60_000,
        pollIntervalMs: 2_000,
      }),
    ).resolves.toBe('123456');

    expect(pollForEmailCodeMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        subject: 'reset password code',
        graceWindowMs: 0,
        timeoutMs: 10_000,
      }),
    );
    expect(pollForEmailCodeMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        subject: 'reset password code',
        graceWindowMs: 15 * 60_000,
        timeoutMs: 60_000,
      }),
    );
  });
});
