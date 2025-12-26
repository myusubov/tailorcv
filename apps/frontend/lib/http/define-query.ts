import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  type ClientGetFn,
  makeKey,
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

export function defineQuery<TParams, TResponse>(
  clientFn: ClientGetFn<TParams, TResponse>,
) {
  return function useGeneratedQuery(
    params: TParams,
    options?: DefineQueryOptions<TResponse>,
  ): UseQueryResult<TResponse, ApiRequestError> {
    const { config } = clientFn;
    const { keyParts, ...queryOptions } = options ?? {};

    const queryKey = makeKey(
      config.keyPrefix,
      ...(config.staticParts ?? []),
      ...(config.dynamicParts
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (config.dynamicParts(params) as any[])
        : []),
      ...((keyParts as any[]) ?? []),
    );

    const queryFn = async () => {
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

    return useQuery({
      queryKey,
      queryFn,
      ...queryOptions,
    }) as UseQueryResult<TResponse, ApiRequestError>;
  };
}
