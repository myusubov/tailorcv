import type { NextFunction, Request, Response } from 'express';
import { RequestError } from '@octokit/request-error';
import { ErrorCode } from 'shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// error.ts imports these at load time; the real env module validates the whole
// environment and the Prisma client needs generated code, neither of which this
// test is about.
vi.mock('../config/env', () => ({ env: { NODE_ENV: 'test' } }));
vi.mock('../../prisma/generated/client/client.js', () => ({
  Prisma: { PrismaClientKnownRequestError: class {} },
}));

import { errorHandler } from './error';

const URL = 'https://api.github.com/installation/repositories';

function createRequestError({
  status,
  message,
}: {
  status: number;
  message: string;
}): RequestError {
  return new RequestError(message, status, {
    request: { method: 'GET', url: URL, headers: {} },
    response: { status, url: URL, headers: {}, data: {} },
  });
}

function createResponse() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { res: { status } as unknown as Response, status, json };
}

describe('errorHandler with an Octokit RequestError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('responds 429 with RATE_LIMIT_EXCEEDED for a GitHub 429', () => {
    const { res, status, json } = createResponse();

    errorHandler(
      createRequestError({ status: 429, message: 'API rate limit exceeded' }),
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );

    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          message: 'GitHub rate limit reached',
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          details: { githubStatus: 429 },
        },
      }),
    );
  });

  it('responds 401 with GITHUB_CONNECTION_REQUIRED for a GitHub 401', () => {
    const { res, status, json } = createResponse();

    errorHandler(
      createRequestError({ status: 401, message: 'Bad credentials' }),
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          message: 'GitHub refused access for this installation',
          code: ErrorCode.GITHUB_CONNECTION_REQUIRED,
          details: { githubStatus: 401 },
        },
      }),
    );
  });

  it('responds 502 with GITHUB_API_ERROR and GitHub’s message for a GitHub 500', () => {
    const { res, status, json } = createResponse();

    errorHandler(
      createRequestError({ status: 500, message: 'Server Error' }),
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );

    expect(status).toHaveBeenCalledWith(502);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          message: 'Server Error',
          code: ErrorCode.GITHUB_API_ERROR,
          details: { githubStatus: 500 },
        },
      }),
    );
  });
});
