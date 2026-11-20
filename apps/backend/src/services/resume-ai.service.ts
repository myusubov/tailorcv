import type { AnalyzedGithubRepository } from 'shared';
import { z } from 'zod';
import { geminiClient } from '../lib/resume-ai-client';
import {
  buildResumeContentPrompt,
  SYSTEM_INSTRUCTION,
} from '../prompts/resume-content.prompt';
import {
  resumeContentSchema,
  type ResumeContent,
} from '../schemas/resume-content.schema';
import type {
  GeneratedResumeContent,
  GenerateResumeContentInput,
} from '../types/resume-content';
import { capEvidence } from './resume-evidence.service';

const RESUME_CONTENT_MODEL = 'models/gemini-3.5-flash-lite';

class UnknownRepositoryError extends Error {}

/**
 * Replaces each project's repository id with the name and GitHub URL of the
 * analyzed repository, so those fields never come from the model. Throws
 * `UnknownRepositoryError` when a project names a repository we did not analyze.
 */
function attachRepositoryIdentity(
  content: ResumeContent,
  repositories: AnalyzedGithubRepository[],
): GeneratedResumeContent {
  const projects = content.projects.map((project) => {
    const analyzed = repositories.find(
      ({ repository }) => repository.id === project.repoId,
    );
    if (!analyzed) {
      throw new UnknownRepositoryError(
        `Model returned unknown repository id ${project.repoId}`,
      );
    }

    return {
      ...project,
      name: analyzed.repository.name,
      repoUrl: analyzed.repository.htmlUrl,
    };
  });

  return { ...content, projects };
}

async function requestResumeContent(
  prompt: string,
  repositories: AnalyzedGithubRepository[],
) {
  const response = await geminiClient.models.generateContent({
    model: RESUME_CONTENT_MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseJsonSchema: z.toJSONSchema(resumeContentSchema),
    },
  });

  const content = resumeContentSchema.parse(JSON.parse(response.text ?? ''));
  return attachRepositoryIdentity(content, repositories);
}

/**
 * Asks Gemini for the resume content and returns it validated against the schema.
 * A reply that is not valid JSON, does not match the schema or names a repository
 * we did not analyze is requested once more. Throws when that second reply is bad
 * too, and for any Gemini error.
 */
export async function generateResumeContent(
  input: GenerateResumeContentInput,
): Promise<GeneratedResumeContent> {
  const repositories = capEvidence(input.repositories);
  const prompt = buildResumeContentPrompt({ repositories });

  try {
    return await requestResumeContent(prompt, input.repositories);
  } catch (err) {
    // The SDK already retried Gemini errors. Only a bad reply is worth another call.
    const isBadReply =
      err instanceof SyntaxError ||
      err instanceof z.ZodError ||
      err instanceof UnknownRepositoryError;
    if (!isBadReply) throw err;

    return await requestResumeContent(prompt, input.repositories);
  }
}
