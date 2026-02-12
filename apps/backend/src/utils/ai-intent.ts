import { openai } from '../lib/openai';

/**
 * Classifies the user intent to determine model complexity
 */
export async function classifyIntent(message: string): Promise<'simple' | 'complex'> {
    // Short messages are almost always simple
    if (message.split(' ').length < 5) return 'simple';

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a router. Classify the user\'s request into \'simple\' (general questions, single item edits) or \'complex\' (rewrites, deep analysis). Respond ONLY with \'simple\' or \'complex\'.'
                },
                { role: 'user', content: message }
            ],
            max_tokens: 5,
            temperature: 0,
        });

        const classification = completion.choices[0]?.message?.content?.toLowerCase().trim();
        return classification === 'complex' ? 'complex' : 'simple';
    } catch (error) {
        // Fallback to simple model on router failure to be safe/cheap
        console.error('Intent classification failed:', error);
        return 'simple';
    }
}
