import 'server-only';

import { backendStream } from '@/lib/api';
import { defineGet } from './_query';
import type {
  AIChatRequest,
  ConversationListItem,
  ConversationDetails,
} from '@/lib/types/ai-chat';

/**
 * Streams chat response from the backend.
 */
export async function streamChat(body: AIChatRequest) {
  return backendStream('ai/chat', {
    method: 'POST',
    body,
    auth: 'required',
  });
}

/**
 * Fetches all conversations for the authenticated user.
 */
export const getConversations = defineGet<ConversationListItem[]>({
  path: 'ai/chat/conversations',
  keyPrefix: 'ai-conversations',
  defaults: {
    cache: 'no-store', // Always fetch fresh data - no server-side caching
  },
});

/**
 * Fetches a single conversation with details.
 */
export const getConversationDetails = defineGet<
  { id: string },
  ConversationDetails
>({
  path: ({ id }) => `ai/chat/conversations/${id}`,
  keyPrefix: 'ai-conversation-details',
  dynamicParts: ({ id }) => [id],
});
