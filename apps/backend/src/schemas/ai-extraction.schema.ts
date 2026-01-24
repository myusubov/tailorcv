import { z } from 'zod';
import { openAiResumeSchema } from 'shared';

/**
 * Schema for AI response when attempting to extract resume data from raw text.
 * Includes a sufficiency check to determine if the input text provided enough detail.
 */
// /home/muryash/Github/tailorcv/apps/backend/src/schemas/ai-extraction.schema.ts

export const aiExtractionResponseSchema = z.object({
  _isDataSufficient: z
    .boolean()
    .describe(
      'Whether the input text contains enough project and experience data to create a high-quality resume',
    ),
  _insufficientReason: z
    .string()
    .describe(
      'Brief reason why data is insufficient, or empty string if sufficient',
    ),
  data: openAiResumeSchema,
});

export type AiExtractionResponse = z.infer<typeof aiExtractionResponseSchema>;
