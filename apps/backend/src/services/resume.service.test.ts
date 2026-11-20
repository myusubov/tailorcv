import { ErrorCode } from 'shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateMany } = vi.hoisted(() => ({ updateMany: vi.fn() }));

// The real prisma client needs a database; these tests only check the query it is given.
vi.mock('../lib', () => ({ prisma: { resume: { updateMany } }, logger: {} }));

import { markResumeFailed } from './resume.service';

const input = {
  resumeId: 'resume-1',
  failureReason: ErrorCode.SERVICE_UNAVAILABLE,
};

describe('markResumeFailed', () => {
  beforeEach(() => {
    updateMany.mockReset();
  });

  it('only updates a resume that is still GENERATING', async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await markResumeFailed(input);

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'resume-1', status: 'GENERATING' },
      data: { status: 'FAILED', failureReason: 'SERVICE_UNAVAILABLE' },
    });
  });

  it('returns true when the resume was marked failed', async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await expect(markResumeFailed(input)).resolves.toBe(true);
  });

  it('returns false without throwing when no resume matched', async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(markResumeFailed(input)).resolves.toBe(false);
  });
});
