import { RequestError } from '@octokit/request-error';
import { ErrorCode } from 'shared';
import { describe, expect, it } from 'vitest';

import { mapOctokitErrorToAppError } from './octokit-error';

const URL = 'https://api.github.com/installation/repositories';

function createRequestError({
  status,
  message = 'GitHub said no',
  headers = {},
  url = URL,
}: {
  status: number;
  message?: string;
  headers?: Record<string, string>;
  url?: string;
}): RequestError {
  return new RequestError(message, status, {
    request: { method: 'GET', url, headers: {} },
    response: { status, url, headers, data: {} },
  });
}

describe('mapOctokitErrorToAppError', () => {
  describe('rate limiting', () => {
    it('maps a 429 with no headers to RATE_LIMIT_EXCEEDED / 429', () => {
      const result = mapOctokitErrorToAppError(createRequestError({ status: 429 }));

      expect(result.errorCode).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(result.statusCode).toBe(429);
    });

    it('maps a 403 with x-ratelimit-remaining 0 (primary limit) to RATE_LIMIT_EXCEEDED / 429', () => {
      const result = mapOctokitErrorToAppError(
        createRequestError({
          status: 403,
          headers: { 'x-ratelimit-remaining': '0' },
        }),
      );

      expect(result.errorCode).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(result.statusCode).toBe(429);
    });

    it('maps a 403 with retry-after (secondary limit) to RATE_LIMIT_EXCEEDED / 429', () => {
      const result = mapOctokitErrorToAppError(
        createRequestError({ status: 403, headers: { 'retry-after': '60' } }),
      );

      expect(result.errorCode).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(result.statusCode).toBe(429);
    });

    it('maps a 403 whose message names a secondary rate limit, with no rate-limit headers, to RATE_LIMIT_EXCEEDED / 429', () => {
      const result = mapOctokitErrorToAppError(
        createRequestError({
          status: 403,
          message: 'You have exceeded a secondary rate limit.',
        }),
      );

      expect(result.errorCode).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(result.statusCode).toBe(429);
    });

    it('does not treat a 403 with requests remaining as rate limited', () => {
      const result = mapOctokitErrorToAppError(
        createRequestError({
          status: 403,
          message: 'Resource not accessible by integration',
          headers: { 'x-ratelimit-remaining': '4999' },
        }),
      );

      expect(result.errorCode).toBe(ErrorCode.GITHUB_CONNECTION_REQUIRED);
      expect(result.statusCode).toBe(403);
    });

    it('does not treat a 503 carrying retry-after as a rate limit', () => {
      const result = mapOctokitErrorToAppError(
        createRequestError({ status: 503, headers: { 'retry-after': '30' } }),
      );

      expect(result.errorCode).toBe(ErrorCode.GITHUB_API_ERROR);
      expect(result.statusCode).toBe(502);
    });
  });

  describe('authentication', () => {
    it('maps a 401 to GITHUB_CONNECTION_REQUIRED / 401', () => {
      const result = mapOctokitErrorToAppError(
        createRequestError({ status: 401, message: 'Bad credentials' }),
      );

      expect(result.errorCode).toBe(ErrorCode.GITHUB_CONNECTION_REQUIRED);
      expect(result.statusCode).toBe(401);
    });

    it('maps a 403 saying "Resource not accessible by integration" and no rate-limit signals to GITHUB_CONNECTION_REQUIRED / 403', () => {
      const result = mapOctokitErrorToAppError(
        createRequestError({
          status: 403,
          message: 'Resource not accessible by integration',
        }),
      );

      expect(result.errorCode).toBe(ErrorCode.GITHUB_CONNECTION_REQUIRED);
      expect(result.statusCode).toBe(403);
    });
  });

  describe('uninstalled app (404 on the installation)', () => {
    const INSTALLATION_URL = 'https://api.github.com/app/installations/7156990';

    it.each([INSTALLATION_URL, `${INSTALLATION_URL}/access_tokens`])(
      'maps a 404 on %s to GITHUB_CONNECTION_REQUIRED / 403',
      (url) => {
        const result = mapOctokitErrorToAppError(
          createRequestError({ status: 404, message: 'Not Found', url }),
        );

        expect(result.errorCode).toBe(ErrorCode.GITHUB_CONNECTION_REQUIRED);
        expect(result.statusCode).toBe(403);
      },
    );
  });

  describe('GitHub failing', () => {
    it.each([500, 502, 503, 504])(
      'maps a %i to GITHUB_API_ERROR / 502',
      (status) => {
        const result = mapOctokitErrorToAppError(createRequestError({ status }));

        expect(result.errorCode).toBe(ErrorCode.GITHUB_API_ERROR);
        expect(result.statusCode).toBe(502);
      },
    );

    it('passes GitHub’s own message through for a 5xx', () => {
      const result = mapOctokitErrorToAppError(
        createRequestError({ status: 500, message: 'Server Error' }),
      );

      expect(result.message).toBe('Server Error');
    });
  });

  describe('requests we built wrong', () => {
    it.each([400, 404, 410, 422])(
      'maps a %i to INTERNAL_ERROR / 500',
      (status) => {
        const result = mapOctokitErrorToAppError(createRequestError({ status }));

        expect(result.errorCode).toBe(ErrorCode.INTERNAL_ERROR);
        expect(result.statusCode).toBe(500);
      },
    );
  });

  describe('details', () => {
    it.each([401, 403, 404, 429, 500])(
      'keeps GitHub’s status %i in details.githubStatus',
      (status) => {
        const result = mapOctokitErrorToAppError(createRequestError({ status }));

        expect(result.details).toEqual({ githubStatus: status });
      },
    );
  });
});
