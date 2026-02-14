import { openai } from '../lib/openai';

/**
 * Classifies the user intent to determine model complexity
 */
export async function classifyIntent(message: string): Promise<'simple' | 'complex' | 'edit'> {
    // Short messages are almost always simple
    if (message.split(' ').length < 5) return 'simple';

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a router. Classify the user's request into one of these categories:
- 'edit': The user explicitly asks to change, update, add, delete, or rename data in their resume (e.g., "Change my name", "Add a skill").
- 'simple': General questions, short replies, or single-item clarifications.
- 'complex': Deep analysis, rewriting whole sections, or open-ended career advice.

Respond ONLY with 'edit', 'simple', or 'complex'.`
                },
                { role: 'user', content: message }
            ],
            max_tokens: 10,
            temperature: 0,
        });

        const classification = completion.choices[0]?.message?.content?.toLowerCase().trim();
        return (classification === 'edit' || classification === 'complex') ? classification : 'simple';
    } catch (error) {
        // Fallback to simple model on router failure to be safe/cheap
        console.error('Intent classification failed:', error);
        return 'simple';
    }
}
