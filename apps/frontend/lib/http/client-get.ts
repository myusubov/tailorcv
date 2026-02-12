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

export async function clientGet<T>(
  path: string,
  options: ClientGetOptions = {},
): Promise<ApiResult<T> | null> {
  const response = await fetch(path, {
    method: 'GET',
    cache: options.cache ?? 'no-store',
    headers: { Accept: 'application/json', ...(options.headers ?? {}) },
    signal: options.signal,
    priority: options.priority,
  } as RequestInit);

  const json = await parseJsonSafe(response);
  if (!isApiResult(json)) return null;
  return json as ApiResult<T>;
}
