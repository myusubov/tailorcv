import { openai } from '../lib/openai';
import { BaseResumeData } from 'shared';
import { cleanResumeContext } from './ai-context';

export async function generateResumeEdit(
    message: string,
    resumeContext: BaseResumeData
): Promise<{ proposal: Partial<BaseResumeData>; explanation: string } | { text: string } | null> {
    const cleanedContext = cleanResumeContext(resumeContext);

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o', // Use smarter model for structured edits
            messages: [
                {
                    role: 'system',
                    content: `You are a strict resume editing engine.

CORE RULES:
1. If the user request implies a specific change (e.g., "Change name to Something", "Add React skill"), you MUST call the "update_resume" tool.
2. Do NOT just describe the change in text.
3. ONLY respond with plain text if the request is impossible or requires clarification (e.g. "Change my name" with no name given).

CURRENT RESUME:
${JSON.stringify(cleanedContext)}

INSTRUCTIONS:
- Maintain the existing structure.
- If adding an item (like a skill), include it in the appropriate array.
- IMPORTANT: You must provide the "proposal" object structure.

EXAMPLES:
User: "Change name to John Doe"
Tool Call:
{
  "proposal": { "contact": { "firstName": "John", "lastName": "Doe" } },
  "explanation": "Updated name to John Doe."
}

User: "Add React to skills"
Tool Call:
{
  "proposal": { "skills": [{ "name": "React", "level": "expert" }] },
  "explanation": "Added React to skills."
}`
                },
                { role: 'user', content: message }
            ],
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'update_resume',
                        description: 'Updates the resume data',
                        parameters: {
                            type: 'object',
                            properties: {
                                proposal: {
                                    type: 'object',
                                    description: 'The partial resume data to merge.',
                                },
                                explanation: {
                                    type: 'string',
                                    description: 'A brief 1-sentence explanation of changes.',
                                }
                            },
                            required: ['proposal', 'explanation']
                        }
                    }
                }
            ],
            // Removed explicit tool_choice to allow text responses for clarification
        });

        const responseMessage = completion.choices[0]?.message;
        const toolCall = responseMessage?.tool_calls?.[0] as any;

        if (toolCall) {
            console.log('OpenAI Tool Call:', JSON.stringify(toolCall, null, 2));
        }

        if (toolCall?.function?.name === 'update_resume') {
            return JSON.parse(toolCall.function.arguments);
        }

        // Handle text responses (clarifications/vague requests)
        if (responseMessage?.content) {
            return { text: responseMessage.content };
        }

        return null;

    } catch (error) {
        console.error('Resume edit generation failed:', error);
        return null;
    }
}
