import { ErrorCode } from 'shared';
import type { RequestError } from '@octokit/request-error';

import { AppError } from '../utils/AppError';

// GitHub signals a rate limit with a 429, or with retry-after, an exhausted
// x-ratelimit-remaining, or (for secondary limits) only a message saying so.
const isRateLimited = (error: RequestError): boolean => {
  if (error.status === 429) return true;
  if (error.status !== 403) return false;

  const headers = error.response?.headers;
  return (
    headers?.['retry-after'] !== undefined ||
    String(headers?.['x-ratelimit-remaining']) === '0' ||
    error.message.toLowerCase().includes('rate limit')
  );
};

// retry-after is seconds to wait; x-ratelimit-reset is the epoch second the
// limit resets. Returns undefined when GitHub sent neither or they are stale.
const getRateLimitWaitSeconds = (error: RequestError): number | undefined => {
  const headers = error.response?.headers;
  const retryAfter = Number(headers?.['retry-after']);
  if (retryAfter > 0) return retryAfter;

  const reset = Number(headers?.['x-ratelimit-reset']);
  const secondsUntilReset = reset - Date.now() / 1000;
  return secondsUntilReset > 0 ? secondsUntilReset : undefined;
};

const rateLimitMessage = (error: RequestError): string => {
  const waitSeconds = getRateLimitWaitSeconds(error);
  // GitHub's guidance when it gives no wait time is to wait at least a minute.
  if (waitSeconds === undefined) {
    return 'GitHub rate limit reached. Please try again in about 1 minute.';
  }

  const minutes = Math.ceil(waitSeconds / 60);
  return `GitHub rate limit reached. Please try again in about ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
};

/**
 * Converts an Octokit `RequestError` into an `AppError` by what the failure means:
 * a rate limit, a rejected token or uninstalled app, a GitHub outage, or a request we built wrong.
 * A suspended app is detected in `getValidInstallationToken`.
 * GitHub's own status is kept in `details.githubStatus`.
 */
export function mapOctokitErrorToAppError(error: RequestError): AppError {
  const details = { githubStatus: error.status };

  if (isRateLimited(error)) {
    return new AppError(
      rateLimitMessage(error),
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      details,
    );
  }

  // A 404 on /app/installations/{id} or its /access_tokens means the app was
  // uninstalled. A 404 on any other request says nothing about the
  // installation, so it is not matched here.
  const isUninstalled =
    error.status === 404 &&
    /\/app\/installations\/\d+(\/access_tokens)?$/.test(error.request.url);

  // A 401, or a 403 that is not a rate limit (checked above), means GitHub
  // refuses this installation token: revoked, suspended or missing a
  // permission. The user's fix ims the same for all of them, so they share a code.
  if (error.status === 401 || error.status === 403 || isUninstalled) {
    return new AppError(
      'GitHub refused access for this installation',
      ErrorCode.GITHUB_CONNECTION_REQUIRED,
      isUninstalled ? 403 : error.status,
      details,
    );
  }

  // GitHub itself is failing.
  if (error.status >= 500) {
    return new AppError(
      error.message,
      ErrorCode.GITHUB_API_ERROR,
      502,
      details,
    );
  }

  // Any other 4xx means our request was wrong, which is our bug, not the
  // caller's or GitHub's.
  return new AppError(error.message, ErrorCode.INTERNAL_ERROR, 500, details);
}
