import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { clientGet, type ClientGetOptions } from './client-get';
import { type ClientGetFn, makeKey, type CacheKeyPart } from './define-client-get';

type DefineQueryOptions<TResponse, TError = ApiRequestError> = Omit<
  UseQueryOptions<TResponse, TError>,
  'queryKey' | 'queryFn'
> & {
  keyParts?: unknown[];
};

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Configuration for direct query definition (new API).
 */
export type DefineQueryConfig<TParams> = {
  path: string | ((params: TParams) => string);
  keyPrefix: string;
  staticParts?: CacheKeyPart[];
  dynamicParts?: (params: TParams) => CacheKeyPart[];
  defaults?: ClientGetOptions;
};

/**
 * Overload 1: Accept a ClientGetFn (legacy API for backwards compatibility)
 */
export function defineQuery<TParams, TResponse>(
  clientFn: ClientGetFn<TParams, TResponse>,
): (
  params: TParams,
  options?: DefineQueryOptions<TResponse>,
) => UseQueryResult<TResponse, ApiRequestError>;

/**
 * Overload 2: Accept a config object directly (new streamlined API)
 */
export function defineQuery<TParams, TResponse>(
  config: DefineQueryConfig<TParams>,
): (
  params: TParams,
  options?: DefineQueryOptions<TResponse>,
) => UseQueryResult<TResponse, ApiRequestError>;

/**
 * Overload 3: No params (void)
 */
export function defineQuery<TResponse>(
  config: DefineQueryConfig<void>,
): (
  params?: void,
  options?: DefineQueryOptions<TResponse>,
) => UseQueryResult<TResponse, ApiRequestError>;

/**
 * Implementation
 */
export function defineQuery<TParams, TResponse>(
  configOrFn: DefineQueryConfig<TParams> | ClientGetFn<TParams, TResponse>,
) {
  // Check if it's a ClientGetFn (has 'config' property)
  const isClientFn = typeof configOrFn === 'function' && 'config' in configOrFn;

  return function useGeneratedQuery(
    params: TParams,
    options?: DefineQueryOptions<TResponse>,
  ): UseQueryResult<TResponse, ApiRequestError> {
    const { keyParts, ...queryOptions } = options ?? {};

    let queryKey: Array<string | number>;
    let queryFn: () => Promise<TResponse>;

    if (isClientFn) {
      // Legacy API: unwrap ClientGetFn
      const clientFn = configOrFn as ClientGetFn<TParams, TResponse>;
      const { config } = clientFn;

      queryKey = makeKey(
        config.keyPrefix,
        ...(config.staticParts ?? []),
        ...(config.dynamicParts ? (config.dynamicParts(params) as any[]) : []),
        ...((keyParts as any[]) ?? []),
      );

      queryFn = async () => {
        const result = await clientFn(params);
        if (!result) {
          throw new Error('No result returned from client function');
        }
        if (!result.ok) {
          throw new ApiRequestError(
            result.status,
            result.error.code,
            result.error.message,
            result.error.details,
          );
        }
        return result.data;
      };
    } else {
      // New API: use config directly
      const config = configOrFn as DefineQueryConfig<TParams>;

      queryKey = makeKey(
        config.keyPrefix,
        ...(config.staticParts ?? []),
        ...(config.dynamicParts ? config.dynamicParts(params) : []),
        ...((keyParts as any[]) ?? []),
      );

      queryFn = async () => {
        const path =
          typeof config.path === 'function'
            ? config.path(params as TParams)
            : config.path;

        const result = await clientGet<TResponse>(path, config.defaults ?? {});
        if (!result) {
          throw new Error('No result returned from client function');
        }
        if (!result.ok) {
          throw new ApiRequestError(
            result.status,
            result.error.code,
            result.error.message,
            result.error.details,
          );
        }
        return result.data;
      };
    }

    return useQuery({
      queryKey,
      queryFn,
      ...queryOptions,
    }) as UseQueryResult<TResponse, ApiRequestError>;
  };
}
