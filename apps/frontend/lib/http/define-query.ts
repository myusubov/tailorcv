import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  type ClientGetFn,
  type DefineClientGetConfig,
  makeKey,
} from './define-client-get';

type DefineQueryOptions = Omit<UseQueryOptions, 'queryKey' | 'queryFn'> & {
  keyParts?: unknown[];
};

export function defineQuery<TParams, TResponse>(
  clientFn: ClientGetFn<TParams, TResponse>,
) {
  return function useGeneratedQuery(
    params: TParams,
    options?: DefineQueryOptions,
  ): UseQueryResult<TResponse, Error> {
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
        const error = new Error(result.error?.message ?? 'Unknown error');
        // Attach the full error object for further inspection if needed
        (error as any).details = result.error;
        throw error;
      }
      return result.data;
    };

    return useQuery({
      queryKey,
      queryFn,
      ...queryOptions,
    }) as UseQueryResult<TResponse, Error>;
  };
}
