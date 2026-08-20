import { logger } from '../lib/logger';
import type { AIChatStreamEvent, OpenAIStreamEvent } from '../types/ai-chat';

interface StreamHandlerOptions {
  onResponseId: (id: string) => void;
  controller: AbortController;
}

/**
 * Attempts to parse JSON with automatic closure for truncated responses.
 * Uses a stack-based approach to close open braces, brackets, and quotes.
 */
function parseToolCallArguments(jsonString: string): any {
  // 1. Try strict parse first
  try {
    return JSON.parse(jsonString);
  } catch {
    // Continue to repair
  }

  // 2. Build closure state
  const stack: string[] = [];
  let inString = false;
  let isEscaped = false;

  for (const char of jsonString) {
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{') {
        stack.push('}');
      } else if (char === '[') {
        stack.push(']');
      } else if (char === '}' || char === ']') {
        // Pop matching closer if it matches top of stack
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  // 3. Construct suffix
  let suffix = '';
  if (inString) suffix += '"';
  while (stack.length > 0) {
    suffix += stack.pop();
  }

  // 4. Parse with suffix
  try {
    return JSON.parse(jsonString + suffix);
  } catch (err) {
    // If simple closure fails, it might be cut off in a key or strictly invalid syntax
    // fallback to original behavior (or just fail)
    throw new Error('Unable to parse tool call arguments even with auto-closure');
  }
}

/**
 * Transforms an OpenAI Response stream into an AIChatStreamEvent generator.
 * Handles text deltas, tool call accumulation, and final status reporting.
 */
export async function* handleOpenAIStream(
  openaiStream: any,
  options: StreamHandlerOptions,
): AsyncGenerator<AIChatStreamEvent, void, unknown> {
  const { onResponseId, controller } = options;
  let responseId = '';
  let toolCallArgs = '';
  let isToolCall = false;
  let hasYieldedStart = false;

  try {
    for await (const rawEvent of openaiStream) {
      const event = rawEvent as unknown as OpenAIStreamEvent;

      // 1. Text Deltas (regular chat response)
      if (event.type === 'response.output_text.delta') {
        yield { type: 'text', content: event.delta };
      }

      // 2. Tool Call Arguments (streaming fragments)
      if (
        (event.type === 'response.function_call_arguments.delta' ||
          event.type === 'response.tool_call_arguments.delta') &&
        'delta' in event
      ) {
        isToolCall = true;
        if (!hasYieldedStart) {
          yield { type: 'thinking', content: 'Drafting changes...' };
          hasYieldedStart = true;
        }
        toolCallArgs += event.delta;
      }

      // 3. Tool Call Arguments (final payload)
      if (event.type === 'response.function_call_arguments.done') {
        isToolCall = true;
        toolCallArgs = event.arguments;
      } else if (
        event.type === 'response.output_item.done' &&
        event.item.type === 'function_call'
      ) {
        isToolCall = true;
        toolCallArgs = event.item.arguments;
      }

      // 4. Capture Response ID
      if (event.type === 'response.completed' && event.response) {
        responseId = event.response.id;
      }
    }

    // Process and yield tool call if present
    if (isToolCall) {
      try {
        const args = parseToolCallArguments(toolCallArgs);

        if (args?.proposal && args?.explanation) {
          yield {
            type: 'proposal',
            data: args.proposal,
            explanation: args.explanation,
          };
        } else {
          logger.warn({ args }, 'Tool call missing required fields');
          yield {
            type: 'text',
            content:
              "The edit couldn't be processed - please try rephrasing your request.",
          };
        }
      } catch (error) {
        logger.error(
          { error, toolCallArgs },
          'Failed to parse tool call arguments',
        );
        yield {
          type: 'text',
          content: 'I encountered an error processing that edit.',
        };
      }
    }

    // Tool call responses cannot be resumed (would cause "No tool output found" error)
    // so we clear the responseId to force next turn to start fresh
    if (isToolCall) {
      responseId = '';
    }

    onResponseId(responseId);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'AbortError' || controller.signal.aborted) {
      return; // User stopped the response
    }
    logger.error({ err: error }, 'OpenAI stream handler error');
    throw error;
  }
}
