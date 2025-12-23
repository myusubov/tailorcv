import type { ApiResult } from '@/lib/api';
import { clientGet, type ClientGetOptions } from '@/lib/http/client-get';

export type CacheKeyPart = string | number | null | undefined;

export type DefineClientGetConfig<TParams> = {
  path: string | ((params: TParams) => string);
  keyPrefix: string;
  staticParts?: CacheKeyPart[];
  dynamicParts?: (params: TParams) => CacheKeyPart[] | Promise<CacheKeyPart[]>;
  defaults?: ClientGetOptions;
};

type DefineClientGetOptions = ClientGetOptions & { keyParts?: CacheKeyPart[] };

export function makeKey(prefix: string, ...parts: CacheKeyPart[]) {
  const key: Array<string | number> = [prefix];
  for (const part of parts) {
    if (part === '' || part === null || part === undefined) continue;
    key.push(part);
  }
  return key;
}

export type ClientGetFn<TParams, TResponse> = ((
  params: TParams,
  options?: DefineClientGetOptions,
) => Promise<ApiResult<TResponse> | null>) & {
  key: (
    params: TParams,
    options?: DefineClientGetOptions,
  ) => Promise<Array<string | number>>;
  config: DefineClientGetConfig<TParams>;
};

export function defineClientGet<TResponse>(
  config: DefineClientGetConfig<void>,
): ClientGetFn<void, TResponse>;
export function defineClientGet<TParams, TResponse>(
  config: DefineClientGetConfig<TParams>,
): ClientGetFn<TParams, TResponse>;
export function defineClientGet<TParams, TResponse>(
  config: DefineClientGetConfig<TParams>,
) {
  const fn = async (params: TParams, options?: DefineClientGetOptions) => {
    const path =
      typeof config.path === 'function'
        ? config.path(params as TParams)
        : config.path;

    const mergedOptions: ClientGetOptions = {
      ...config.defaults,
      ...options,
    };

    return clientGet<TResponse>(path, mergedOptions);
  };

  const key = async (params: TParams, options?: DefineClientGetOptions) => {
    const dynamicParts = config.dynamicParts
      ? await config.dynamicParts(params as TParams)
      : [];

    return makeKey(
      config.keyPrefix,
      ...(config.staticParts ?? []),
      ...dynamicParts,
      ...(options?.keyParts ?? []),
    );
  };

  return Object.assign(fn, { key, config }) as ClientGetFn<TParams, TResponse>;
}
