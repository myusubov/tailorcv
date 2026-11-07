import { ErrorCode } from 'shared';

import type { ApiResult } from '@/lib/api';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isApiResult(value: unknown): value is ApiResult<unknown> {
  if (!isRecord(value)) return false;
  if (typeof value.ok !== 'boolean') return false;
  if (typeof value.status !== 'number') return false;

  if (value.ok) {
    return 'data' in value;
  }

  return (
    'error' in value &&
    isRecord(value.error) &&
    typeof value.error.message === 'string' &&
    typeof value.error.code === 'string'
  );
}

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export type ClientGetOptions = {
  cache?: RequestCache;
  headers?: HeadersInit;
  signal?: AbortSignal;
  priority?: 'high' | 'low' | 'auto';
};

/**
 * Fetches a same-origin API route and returns its `ApiResult`.
 * A network failure or a body that is not an `ApiResult` comes back as a failed
 * result; only an abort rejects.
 */
export async function clientGet<T>(
  path: string,
  options: ClientGetOptions = {},
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'GET',
      cache: options.cache ?? 'no-store',
      headers: { Accept: 'application/json', ...(options.headers ?? {}) },
      signal: options.signal,
      priority: options.priority,
    } as RequestInit);
  } catch (error) {
    // A cancelled request is intentional, not a failure to report.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    return {
      ok: false,
      status: 0,
      error: { message: 'Network error', code: ErrorCode.NETWORK_ERROR },
    };
  }

  const json = await parseJsonSafe(response);
  if (!isApiResult(json)) {
    return {
      ok: false,
      status: response.status || 502,
      error: {
        message: 'Invalid response from server',
        code: ErrorCode.INVALID_RESPONSE,
      },
    };
  }
  return json as ApiResult<T>;
}
