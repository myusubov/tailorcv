import { z } from 'zod';
import { baseResumeDataSchema } from 'shared';

/**
 * Schema for AI response when attempting to extract resume data from raw text.
 * Includes a sufficiency check to determine if the input text provided enough detail.
 */
export const aiExtractionResponseSchema = z.object({
  _isDataSufficient: z
    .boolean()
    .describe(
      'Whether the input text contains enough project and experience data to create a high-quality resume',
    ),
  _insufficientReason: z
    .string()
    .nullable()
    .describe('Brief reason why data is insufficient (if applicable)'),
  data: baseResumeDataSchema,
});

export type AiExtractionResponse = z.infer<typeof aiExtractionResponseSchema>;
