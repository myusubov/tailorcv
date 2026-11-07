import { z } from 'zod';

export const analyzeGithubReposRequestBodySchema = z.object({
  repoIds: z.array(z.number().int().positive()).min(1).max(3),
  idempotencyKey: z.uuid(),
});

export type AnalyzeGithubReposRequestBody = z.infer<
  typeof analyzeGithubReposRequestBodySchema
>;
