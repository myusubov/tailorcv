import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { clientGet, type ClientGetOptions } from './client-get';
import {
  type ClientGetFn,
  makeKey,
  type CacheKeyPart,
} from './define-client-get';

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
export type DefineQueryConfig<TParams, TResponse> = {
  path: string | ((params: TParams) => string);
  keyPrefix: string;
  staticParts?: CacheKeyPart[];
  dynamicParts?: (params: TParams) => CacheKeyPart[];
  defaults?: ClientGetOptions;
  /** Default TanStack Query options */
  queryDefaults?: DefineQueryOptions<TResponse>;
};

/**
 * The hook returned by defineQuery, with metadata attached.
 */
export type DefinedQueryHook<TParams, TResponse> = ((
  params: TParams,
  options?: DefineQueryOptions<TResponse>,
) => UseQueryResult<TResponse, ApiRequestError>) & {
  getKey: (params: TParams, keyParts?: unknown[]) => Array<string | number>;
  fetcher: (params: TParams) => Promise<TResponse>;
};

/**
 * Overload 1: Accept a ClientGetFn (legacy API for backwards compatibility)
 */
export function defineQuery<TParams, TResponse>(
  clientFn: ClientGetFn<TParams, TResponse>,
): DefinedQueryHook<TParams, TResponse>;

/**
 * Overload 2: Accept a config object directly (new streamlined API)
 */
export function defineQuery<TParams, TResponse>(
  config: DefineQueryConfig<TParams, TResponse>,
): DefinedQueryHook<TParams, TResponse>;

/**
 * Overload 3: No params (void)
 */
export function defineQuery<TResponse>(
  config: DefineQueryConfig<void, TResponse>,
): DefinedQueryHook<void, TResponse>;

/**
 * Implementation
 */
export function defineQuery<TParams, TResponse>(
  configOrFn:
    | DefineQueryConfig<TParams, TResponse>
    | ClientGetFn<TParams, TResponse>,
) {
  // Check if it's a ClientGetFn (has 'config' property)
  const isClientFn = typeof configOrFn === 'function' && 'config' in configOrFn;

  const getKey = (params: TParams, keyParts?: unknown[]) => {
    if (isClientFn) {
      const { config } = configOrFn as ClientGetFn<TParams, TResponse>;
      return makeKey(
        config.keyPrefix,
        ...(config.staticParts ?? []),
        ...(config.dynamicParts
          ? (config.dynamicParts(params) as CacheKeyPart[])
          : []),
        ...((keyParts as CacheKeyPart[]) ?? []),
      );
    } else {
      const config = configOrFn as DefineQueryConfig<TParams, TResponse>;
      return makeKey(
        config.keyPrefix,
        ...(config.staticParts ?? []),
        ...(config.dynamicParts ? config.dynamicParts(params) : []),
        ...((keyParts as CacheKeyPart[]) ?? []),
      );
    }
  };

  /**
   * The actual fetch function, decoupled from the hook
   */
  const fetcher = async (params: TParams): Promise<TResponse> => {
    if (isClientFn) {
      // Legacy API: unwrap ClientGetFn
      const clientFn = configOrFn as ClientGetFn<TParams, TResponse>;
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
    } else {
      // New API: use config directly
      const config = configOrFn as DefineQueryConfig<TParams, TResponse>;
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
    }
  };

  function useGeneratedQuery(
    params: TParams,
    options?: DefineQueryOptions<TResponse>,
  ): UseQueryResult<TResponse, ApiRequestError> {
    const { keyParts, ...queryOptions } = options ?? {};

    const queryKey = getKey(params, keyParts);
    // Reuse the external fetcher
    const queryFn = () => fetcher(params);


    // Merge defaults from config with options from the call site
    const mergedOptions = {
      ...(!isClientFn
        ? (configOrFn as DefineQueryConfig<TParams, TResponse>).queryDefaults
        : {}),
      ...queryOptions,
    };

    return useQuery({
      queryKey,
      queryFn,
      ...mergedOptions,
    }) as UseQueryResult<TResponse, ApiRequestError>;
  }

  useGeneratedQuery.getKey = getKey;
  useGeneratedQuery.fetcher = fetcher;

  return useGeneratedQuery as DefinedQueryHook<TParams, TResponse>;
}
