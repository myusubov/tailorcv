import { openai } from '../lib/openai';
import type { StreamChatInput } from '../types/ai-chat';
import type { BaseResumeData } from 'shared';
import { openaiApiPolicy } from '../lib/resilience';

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
 * Builds the system instructions for the AI assistant
 * @param resumeContext - Optional resume data to include in context
 * @returns System instruction string
 */
function buildInstructions(resumeContext?: BaseResumeData | null): string {
    const baseInstructions = `You are a professional resume coach and career assistant for TailorCV.
Your goal is to help users build high-impact, professional resumes.

Guidelines:
- Be concise and professional.
- Focus on quantifiable achievements when suggesting improvements.
- Keep responses conversational but focused.
- If asked to make edits, explain what you would change and why.`;

    if (resumeContext) {
        // Stringify the full resume context to give the AI complete visibility
        // We'll filter out potentially undefined nulls to keep it clean
        const contextString = JSON.stringify(resumeContext, null, 2);

        return `${baseInstructions}

CURRENT RESUME CONTEXT (JSON Format):
${contextString}

CRITICAL INSTRUCTIONS FOR USING CONTEXT:
1. "Project" vs "Current Resume": When the user refers to "my resume" or "my projects", look at the JSON data above.
2. Specificity: If specific projects, skills, or experiences are listed in the JSON, reference them directly by name.
3. Troubleshooting: If a user says "I have projects" but the array above is empty, politely inform them that your current view of the resume shows no projects and ask them to ensure they've added them in the editor.
4. Completeness: Use the full details provided (bullets, dates, tech stacks) to give actionable advice avoiding generic responses.`;
    }

    return baseInstructions;
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

    // Wrap the OpenAI stream initialization with resilience policy
    const openaiStream = await openaiApiPolicy.execute(() =>
        openai.responses.stream({
            model: 'gpt-4o',
            instructions: buildInstructions(resumeContext),
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
