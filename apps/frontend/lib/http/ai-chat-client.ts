import { defineQuery } from './define-query';
import type {
  ConversationListItem,
  ConversationDetails,
} from '@/lib/types/ai-chat';
import { useQueryCache } from '@/lib/hooks/use-query-cache';

export const useConversationsQuery = defineQuery<void, ConversationListItem[]>({
  path: '/api/ai/chat/conversations',
  keyPrefix: 'ai-conversations',
  defaults: {
    cache: 'no-store',
  },
  queryDefaults: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  },
});

export const useConversationDetailsQuery = defineQuery<
  { id: string },
  ConversationDetails
>({
  path: ({ id }) => `/api/ai/chat/conversations/${id}`,
  keyPrefix: 'ai-conversation-details',
  dynamicParts: ({ id }) => [id],
  defaults: {
    cache: 'no-store',
  },
  queryDefaults: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  },
});

/**
 * Hook for centralized optimistic UI and cache management for conversations.
 */
export function useConversationsCache() {
  return useQueryCache<ConversationListItem[]>(
    useConversationsQuery.getKey(undefined),
  );
}

/**
 * Hook for managing the cache of a specific conversation's details.
 */
export function useConversationDetailsCache(id: string) {
  const cache = useQueryCache<ConversationDetails>(
    useConversationDetailsQuery.getKey({ id }),
  );

  return {
    ...cache,
    prefetch: (params: { conversationId: string }) =>
      cache.queryClient.prefetchQuery({
        queryKey: useConversationDetailsQuery.getKey({
          id: params.conversationId,
        }),
        queryFn: () =>
          useConversationDetailsQuery.fetcher({ id: params.conversationId }),
        staleTime: 1000 * 60 * 5, // 5 minutes
      }),
  };
}
