'use server';

import { fa } from 'zod/v4/locales';
import { defineAction } from './_action';

export const createConversationAction = defineAction<
  { title?: string },
  { id: string; title: string | null }
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
