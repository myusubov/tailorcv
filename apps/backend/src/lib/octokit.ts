import { Octokit as OctokitCore } from '@octokit/core';
import { paginateRest } from '@octokit/plugin-paginate-rest';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { retry } from '@octokit/plugin-retry';
import { throttling, type ThrottlingOptions } from '@octokit/plugin-throttling';

import { logger } from './logger';

const GITHUB_API_VERSION = '2026-03-10';

// Built from the individual packages, not the `octokit` umbrella: it pulls in
// `@octokit/app`, which has no CommonJS entry and fails to load under tsx in
// this CommonJS backend.
const Octokit = OctokitCore.plugin(
  restEndpointMethods,
  paginateRest,
  retry,
  throttling,
);

/**
 * Creates an Octokit client authenticated with the given installation token or App JWT.
 * Pins the GitHub REST API version and fails fast on rate limits.
 * Non-2xx responses throw Octokit's `RequestError` (404 included); callers
 * decide what a status means.
 */
export function createOctokit(accessToken: string): InstanceType<typeof Octokit> {
  const octokit = new Octokit({
    auth: accessToken,
    // Replaces the plugin's default list, so it repeats those codes and adds 409
    // (empty repository) and 429 (rate limit), which retrying cannot fix.
    retry: { doNotRetry: [400, 401, 403, 404, 409, 410, 422, 429, 451] },
    // Returning false means "do not retry". Waiting would hold the HTTP
    // request open for as long as GitHub's retry-after, which can be minutes,
    // so a rate-limited call surfaces as an error immediately.
    throttle: {
      onRateLimit: (retryAfter, options) => {
        logger.warn(
          { retryAfter, method: options.method, url: options.url },
          'GitHub rate limit reached',
        );
        return false;
      },
      onSecondaryRateLimit: (retryAfter, options) => {
        logger.warn(
          { retryAfter, method: options.method, url: options.url },
          'GitHub secondary rate limit reached',
        );
        return false;
      },
    } satisfies ThrottlingOptions,
  });

  // Runs after Octokit sets its own default version header, so this wins.
  octokit.hook.before('request', (options) => {
    options.headers['x-github-api-version'] = GITHUB_API_VERSION;
  });

  return octokit;
}
