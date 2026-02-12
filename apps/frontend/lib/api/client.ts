import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { ErrorCode, type ApiResponse } from 'shared';

import { config } from '@/lib/config/env';

type BackendAuthMode = 'required' | 'optional' | 'none';

export type ApiOk<T> = {
  ok: true;
  status: number;
  data: T;
  meta?: ApiResponse<T>['meta'];
};

export type ApiErr = {
  ok: false;
  status: number;
  error: { message: string; code: ErrorCode; details?: unknown };
  meta?: ApiResponse['meta'];
};

export type ApiResult<T> = ApiOk<T> | ApiErr;

export type BackendRequestOptions = Omit<RequestInit, 'body'> & {
  pathPrefix?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  auth?: BackendAuthMode;
  revalidate?: number | false;
  tags?: string[];
};

function buildBackendUrl(
  path: string,
  query: BackendRequestOptions['query'],
  pathPrefix: string,
) {
  const baseUrl = config.apiUrl;
  const normalizedPath = path.replace(/^\/+/, '');
  const normalizedPrefix = pathPrefix.replace(/\/+$/, '');
  const url = new URL(`${normalizedPrefix}/${normalizedPath}`, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

/**
 * Internal helper to handle URL building and Clerk Authentication.
 * Returns the raw Fetch Response.
 */
async function backendFetch(
  path: string,
  options: BackendRequestOptions = {},
): Promise<Response> {
  const {
    pathPrefix = '/api/v1',
    query,
    body,
    auth: authMode = 'required',
    headers,
    tags,
    revalidate,
    ...init
  } = options;

  const url = buildBackendUrl(path, query, pathPrefix);

  const token =
    authMode === 'none'
      ? null
      : await (await auth()).getToken().catch(() => null);

  if (!token && authMode === 'required') {
    throw new Error('Authentication required');
  }

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json');
  }


  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

  return fetch(url, {
    ...init,
    headers: requestHeaders,
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    next: tags || revalidate !== undefined ? { tags, revalidate } : undefined,
  });
}

/**
 * Standard JSON-based backend request handler.
 */
export async function backendRequest<T>(
  path: string,
  options: BackendRequestOptions = {},
): Promise<ApiResult<T>> {
  try {
    const response = await backendFetch(path, options);

    if (response.status === 204) {
      return {
        ok: true,
        status: 204,
        data: null as T,
      };
    }

    const payload = (await response
      .json()
      .catch(() => null)) as ApiResponse<T> | null;

    if (!payload) {
      return {
        ok: false,
        status: response.status || 502,
        error: {
          message: 'Invalid response from server',
          code: ErrorCode.INVALID_RESPONSE,
        },
      };
    }

    if (!response.ok || payload.success === false) {
      return {
        ok: false,
        status: response.status,
        error: {
          message:
            payload.error?.message ?? response.statusText ?? 'Request failed',
          code: (payload.error?.code as ErrorCode) ?? ErrorCode.INTERNAL_ERROR,
          details: payload.error?.details,
        },
        meta: payload.meta,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: payload.data as T,
      meta: payload.meta,
    };
  } catch (err: any) {
    if (err.message === 'Authentication required') {
      return {
        ok: false,
        status: 401,
        error: {
          message: 'Authentication required',
          code: ErrorCode.UNAUTHORIZED,
        },
      };
    }
    return {
      ok: false,
      status: 0,
      error: { message: 'Network error', code: ErrorCode.NETWORK_ERROR },
    };
  }
}

/**
 * Specialized handler for Server-Sent Events (SSE).
 * Reuses authentication and URL logic but returns a raw Response.
 */
export async function backendStream(
  path: string,
  options: Omit<BackendRequestOptions, 'revalidate' | 'tags'> = {},
): Promise<Response> {
  const response = await backendFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Accept: 'text/event-stream',
    },
  });

  return response;
}
