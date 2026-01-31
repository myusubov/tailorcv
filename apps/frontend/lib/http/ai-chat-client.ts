import { defineQuery } from './define-query';
import type {
  ConversationListItem,
  ConversationDetails,
} from '@/lib/types/ai-chat';
import { useQueryCache } from '@/lib/hooks/use-query-cache';

export const useConversationsQuery = defineQuery<
  void,
  ConversationListItem[]
>({
  path: '/api/ai/chat/conversations',
  keyPrefix: 'ai-conversations',
  defaults: {
    cache: 'no-store',
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
    staleTime: 1000 * 60 * 5, // Keep messages fresh for 5 minutes
    gcTime: 1000 * 60 * 5, // Garbage collect after 5 minutes
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

