import type { BaseResumeData } from 'shared';

/**
 * Request body for the AI chat endpoint
 */
export interface ChatRequestBody {
  conversationId: string;
  message: string;
  resumeContext?: BaseResumeData | null;
}


/**
 * Service input parameters for streaming chat
 */
export interface StreamChatInput {
  input: string;
  previousResponseId?: string | null;
  resumeContext?: BaseResumeData | null;
}
