import 'server-only';

import type { ApiResult, BackendRequestOptions } from '@/lib/api';
import { backendRequest } from '@/lib/api';

export type CacheKeyPart = string | number | null | undefined;

export function makeCacheTags(prefix: string, ...parts: CacheKeyPart[]) {
  const tags = [prefix];
  for (const part of parts) {
    if (part === '' || part === null || part === undefined) continue;
    tags.push(`${prefix}:${part}`);
  }
  return tags;
}

type DefineGetOptions = BackendRequestOptions & { keyParts?: CacheKeyPart[] };

type DefineGetConfig<TParams> = {
  path: string | ((params: TParams) => string);
  keyPrefix: string;
  staticParts?: CacheKeyPart[];
  dynamicParts?: (params: TParams) => CacheKeyPart[] | Promise<CacheKeyPart[]>;
  defaults?: BackendRequestOptions;
};

export function defineGet<TResponse>(
  config: DefineGetConfig<void>,
): (options?: DefineGetOptions) => Promise<ApiResult<TResponse>>;
export function defineGet<TParams, TResponse>(
  config: DefineGetConfig<TParams>,
): (
  params: TParams,
  options?: DefineGetOptions,
) => Promise<ApiResult<TResponse>>;
export function defineGet<TParams, TResponse>(
  config: DefineGetConfig<TParams>,
): (
  params: TParams,
  options?: DefineGetOptions,
) => Promise<ApiResult<TResponse>> {
  return async (params: TParams, options?: DefineGetOptions) => {
    const path =
      typeof config.path === 'function'
        ? config.path(params as TParams)
        : config.path;

    const dynamicParts = config.dynamicParts
      ? await config.dynamicParts(params as TParams)
      : [];

    const tags = makeCacheTags(
      config.keyPrefix,
      ...(config.staticParts ?? []),
      ...dynamicParts,
      ...(options?.keyParts ?? []),
    );

    const mergedOptions: BackendRequestOptions = {
      ...config.defaults,
      ...options,
      tags: Array.from(new Set([...tags, ...(options?.tags ?? [])])),
    };

    return backendRequest<TResponse>(path, mergedOptions);
  };
}
