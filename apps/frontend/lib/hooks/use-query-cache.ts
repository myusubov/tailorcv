import { useQueryClient, QueryKey } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * A utility hook for common cache operations to avoid manual setQueryData everywhere.
 */
export function useQueryCache<
  TData,
  TItem = TData extends (infer U)[] ? U : never,
>(queryKey: QueryKey) {
  const queryClient = useQueryClient();

  /**
   * Update the data in the cache.
   */
  const setData = useCallback(
    (updater: (old: TData | undefined) => TData | undefined) => {
      return queryClient.setQueryData<TData>(queryKey, updater);
    },
    [queryClient, queryKey],
  );

  /**
   * Helpers for list manipulation.
   */
  const list = {
    remove: useCallback(
      (predicate: (item: TItem) => boolean) => {
        setData((old) => {
          if (!Array.isArray(old)) return old;
          return (old as TItem[]).filter((item) => !predicate(item)) as TData;
        });
      },
      [setData],
    ),
    add: useCallback(
      (item: TItem, position: 'start' | 'end' = 'start') => {
        setData((old) => {
          if (!Array.isArray(old)) return [item] as unknown as TData;
          const list = old as TItem[];
          return (
            position === 'start' ? [item, ...list] : [...list, item]
          ) as unknown as TData;
        });
      },
      [setData],
    ),
    update: useCallback(
      (predicate: (item: TItem) => boolean, update: (item: TItem) => TItem) => {
        setData((old) => {
          if (!Array.isArray(old)) return old;
          return (old as TItem[]).map((item) =>
            predicate(item) ? update(item) : item,
          ) as TData;
        });
      },
      [setData],
    ),
  };

  /**
   * Invalidate the query.
   */
  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  /**
   * Cancel the query.
   */
  const cancel = useCallback(() => {
    return queryClient.cancelQueries({ queryKey });
  }, [queryClient, queryKey]);

  /**
   * Get current data.
   */
  const getData = useCallback(
    () => queryClient.getQueryData<TData>(queryKey),
    [queryClient, queryKey],
  );

  return {
    setData,
    getData,
    list,
    invalidate,
    cancel,
    /**
     * Restore previous data (rollback).
     */
    rollback: (previousData: TData | undefined) =>
      queryClient.setQueryData(queryKey, previousData),
  };
}
