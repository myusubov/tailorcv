'use server';

import { defineAction } from './_action';

export const createConversationAction = defineAction<
  { title?: string },
  {
    id: string;
    title: string | null;
    responseId: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { messages: number };
  }
>({
  method: 'POST',
  path: 'ai/chat/conversations',
  keyPrefix: 'ai-conversations',
  revalidate: { fromKey: false },
});

export const deleteConversationAction = defineAction<{ id: string }, null>({
  method: 'DELETE',
  path: ({ id }) => `ai/chat/conversations/${id}`,
  keyPrefix: 'ai-conversations', // This revalidates the list
  revalidate: { fromKey: false },
});
