import { z } from 'zod';

/**
 * Shape the AI must return for the four sections it writes. Gemini enforces the
 * array sizes but not string lengths, so the response is parsed with this
 * schema again after the call.
 */
export const resumeContentSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  skillGroups: z
    .array(
      z.object({
        title: z.string(),
        skills: z.array(z.string()).min(1),
      }),
    )
    .min(1)
    .max(5),
  projects: z
    .array(
      z.object({
        repoId: z
          .number()
          .describe('The id attribute of the repository this project is about'),
        description: z.string(),
        tools: z.array(z.string()),
        bullets: z
          .array(
            z.object({
              text: z.string(),
              evidence: z
                .array(z.string())
                .min(1)
                .describe(
                  'File paths or detected-area paths of this repository the bullet relies on',
                ),
            }),
          )
          .min(1)
          .max(3),
      }),
    )
    .min(1)
    .max(3),
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;
