import type { BaseResumeData } from 'shared';

/**
 * Request body for the AI chat endpoint
 */
export interface ChatRequestBody {
  conversationId: string;
  message: string;
  resumeContext?: BaseResumeData | null;
  assistantMessageId?: string;
}


/**
 * Service input parameters for streaming chat
 */
export interface StreamChatInput {
  input: string;
  previousResponseId?: string | null;
  resumeContext?: BaseResumeData | null;
}

/**
 * Event type for the AI chat stream
 */
export type AIChatStreamEvent =
  | { type: 'text'; content: string }
  | { type: 'proposal'; data: Partial<BaseResumeData>; explanation: string }
  | { type: 'done'; responseId: string; conversationId?: string }
  | { type: 'error'; message: string; code?: string }
  | { type: 'thinking'; content: string };

/**
 * Result of a streamed chat response
 */
export interface StreamChatResult {
  /** Async generator yielding structured events */
  stream: AsyncGenerator<AIChatStreamEvent, void, unknown>;
  /** Promise that resolves to the response ID after streaming completes */
  getResponseId: () => Promise<string>;
  /** Controller to abort the OpenAI stream */
  controller: AbortController;
}

/**
 * Internal OpenAI stream event structure for the Responses API
 */
export type OpenAIStreamEvent =
  | { type: 'response.output_text.delta'; delta: string }
  | { type: 'response.function_call_arguments.delta'; delta: string }
  | { type: 'response.tool_call_arguments.delta'; delta: string }
  | { type: 'response.function_call_arguments.done'; arguments: string }
  | { type: 'response.output_item.done'; item: { type: 'function_call'; arguments: string } }
  | { type: 'response.completed'; response: { id: string } };
