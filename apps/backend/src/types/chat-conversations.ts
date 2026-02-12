/**
 * Input for creating a new conversation
 */
export interface CreateConversationInput {
  clerkUserId: string;
  title?: string;
  responseId?: string;
}

/**
 * Input for adding a message to a conversation
 */
export interface AddMessageInput {
  conversationId: string;
  clerkUserId: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Input for updating conversation's responseId
 */
export interface UpdateConversationResponseIdInput {
  conversationId: string;
  clerkUserId: string;
  responseId: string;
}

/**
 * Input for deleting a conversation
 */
export interface DeleteConversationInput {
  id: string;
  clerkUserId: string;
}
