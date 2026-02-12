import { openai } from '../lib/openai';
import type { StreamChatInput } from '../types/ai-chat';
import { openaiApiPolicy } from '../lib/resilience';
import { cleanResumeContext } from '../utils/ai-context';
import { buildInstructions } from '../utils/ai-prompts';
import { classifyIntent } from '../utils/ai-intent';
import { logger } from '../lib/logger';

/**
 * Result of a streamed chat response
 */
export interface StreamChatResult {
    /** Async generator yielding text chunks */
    stream: AsyncGenerator<string, void, unknown>;
    /** Promise that resolves to the response ID after streaming completes */
    getResponseId: () => Promise<string>;
    /** Controller to abort the OpenAI stream */
    controller: AbortController;
}

/**
 * Streams a chat response from OpenAI Responses API
 * @param params - Input message, previous response ID, and resume context
 * @returns Stream of text chunks and a function to get the final response ID
 */
export async function streamChatResponse(
    params: StreamChatInput,
): Promise<StreamChatResult> {
    const { input, previousResponseId, resumeContext } = params;

    // 1. Determine Model based on Intent
    const intent = await classifyIntent(input);
    const model = intent === 'complex' ? 'gpt-4o' : 'gpt-4o-mini';

    logger.info({ intent, model }, 'AI Chat model selection');

    let resolveResponseId: (id: string) => void;
    let rejectResponseId: (err: Error) => void;
    const responseIdPromise = new Promise<string>((resolve, reject) => {
        resolveResponseId = resolve;
        rejectResponseId = reject;
    });

    const controller = new AbortController();

    // If the stream is aborted, reject the responseId promise
    controller.signal.addEventListener('abort', () => {
        rejectResponseId(new Error('Stream aborted'));
    });

    // 2. Clean Context to save tokens
    const cleaned = resumeContext ? cleanResumeContext(resumeContext) : null;
    const instructions = buildInstructions(cleaned);

    if (resumeContext) {
        const rawSize = JSON.stringify(resumeContext, null, 2).length;
        const cleanSize = JSON.stringify(cleaned).length;
        const savings = Math.round((1 - cleanSize / rawSize) * 100);
        logger.info({ rawSize, cleanSize, savings }, 'AI Chat context optimization');
    }

    // Wrap the OpenAI stream initialization with resilience policy
    const openaiStream = await openaiApiPolicy.execute(() =>
        openai.responses.stream({
            model,
            instructions,
            input,
            ...(previousResponseId && { previous_response_id: previousResponseId }),
        }, {
            signal: controller.signal,
        }),
    );

    async function* textGenerator(): AsyncGenerator<string, void, unknown> {
        let responseId = '';
        try {
            for await (const event of openaiStream) {
                // Extract text deltas from the stream
                if (event.type === 'response.output_text.delta') {
                    yield event.delta;
                }
                // Capture response ID when available
                if (event.type === 'response.completed' && event.response?.id) {
                    responseId = event.response.id;
                }
            }
            resolveResponseId!(responseId);
        } catch {
            // Generator was aborted - promise already rejected by abort listener
        }
    }

    return {
        stream: textGenerator(),
        getResponseId: () => responseIdPromise,
        controller,
    };
}
