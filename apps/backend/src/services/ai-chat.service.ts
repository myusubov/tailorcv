import { openai } from '../lib/openai';
import type { StreamChatInput, StreamChatResult } from '../types/ai-chat';
import { openaiApiPolicy } from '../lib/resilience';
import { cleanResumeContext } from '../utils/ai-context';
import { buildInstructions } from '../utils/ai-prompts';
import { handleOpenAIStream } from '../utils/ai-stream';
import { AI_TOOLS } from '../utils/ai-tools';
import { logger } from '../lib/logger';

/**
 * Streams an AI chat response using the OpenAI Responses API.
 * 
 * Handles both regular chat and resume edit operations through a unified streaming interface.
 * Edit operations are detected via tool calls and returned as 'proposal' events for client-side execution.
 * 
 * @param params.input - The user's message
 * @param params.previousResponseId - ID from the last response to continue conversation context (optional)
 * @param params.resumeContext - Current resume data to include in the AI's context (optional)
 * 
 * @returns An async generator yielding chat/proposal events, plus methods to get the response ID and abort controller
 * 
 * @example
 * const { stream, getResponseId } = await streamChatResponse({
 *   input: "Change my name to John",
 *   resumeContext: currentResume
 * });
 * 
 * for await (const event of stream) {
 *   if (event.type === 'text') console.log(event.content);
 *   if (event.type === 'proposal') applyEdit(event.data);
 * }
 */
export async function streamChatResponse(
    params: StreamChatInput,
): Promise<StreamChatResult> {
    const { input, previousResponseId, resumeContext } = params;
    const controller = new AbortController();

    // 1. Prepare Content & Instructions
    const cleaned = resumeContext ? cleanResumeContext(resumeContext) : null;
    const instructions = buildInstructions(cleaned, true);

    if (resumeContext) {
        logger.info({
            rawSize: JSON.stringify(resumeContext).length,
            cleanSize: JSON.stringify(cleaned).length
        }, 'AI Chat context optimization');
    }

    // 2. Setup IDs
    let resolveResponseId: (id: string) => void;
    let rejectResponseId: (err: Error) => void;
    const responseIdPromise = new Promise<string>((resolve, reject) => {
        resolveResponseId = resolve;
        rejectResponseId = reject;
    });

    controller.signal.addEventListener('abort', () => {
        rejectResponseId(new Error('Stream aborted'));
    });

    // 3. Initialize OpenAI Stream
    // The Responses API supports conversation continuity via `previous_response_id`.
    // However, we can only continue from text responses, not tool calls.
    // Tool calls require us to submit the tool's output to continue, which we don't do
    // since edits are executed client-side. So we exclude those IDs to avoid errors.
    const canContinueConversation = previousResponseId && 
        !previousResponseId.startsWith('edit-') && // Legacy edit placeholders
        !previousResponseId.startsWith('fc_');     // Function call IDs

    const openaiStream = await openaiApiPolicy.execute(() =>
        openai.responses.stream({
            model: 'gpt-4o',
            instructions,
            input,
            tools: AI_TOOLS as any,
            ...(canContinueConversation ? { previous_response_id: previousResponseId } : {}),
        }, {
            signal: controller.signal,
        }),
    );

    // 4. Transform and Return Stream
    return {
        stream: handleOpenAIStream(openaiStream, {
            onResponseId: (id) => resolveResponseId(id),
            controller
        }),
        getResponseId: () => responseIdPromise,
        controller,
    };
}
