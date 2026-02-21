import type { BaseResumeData } from 'shared';

/**
 * Common chat message format
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // AI Proposals for resume editing
  proposal?: Partial<BaseResumeData> | null;
  explanation?: string | null;
  status?: 'pending' | 'applied' | 'discarded' | null;
  isThinking?: boolean;
}

/**
 * Request body for AI chat endpoint
 */
export interface AIChatRequest {
  conversationId: string;
  message: string;
  resumeContext?: BaseResumeData | null;
  assistantMessageId?: string;
}


/**
 * SSE event types from AI chat stream
 */
export type AIChatStreamEvent =
  | { type: 'text'; content: string }
  | { type: 'proposal'; data: Partial<BaseResumeData>; explanation: string }
  | { type: 'thinking'; content: string }
  | { type: 'done'; responseId: string; conversationId?: string }
  | { type: 'error'; message: string };

/**
 * Conversation list item (from list endpoint)
 */
export interface ConversationListItem {
  id: string;
  title: string | null;
  responseId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

/**
 * Message within a conversation
 */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  proposal?: Partial<BaseResumeData> | null;
  explanation?: string | null;
  status?: 'pending' | 'applied' | 'discarded' | null;
  isThinking?: boolean;
}

/**
 * Full conversation with messages
 */
export interface ConversationDetails {
  id: string;
  userId: string;
  title: string | null;
  responseId: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

