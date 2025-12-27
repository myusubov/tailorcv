import { geminiGenerateText, prisma } from '../lib';
import { baseResumeDataSchema, ErrorCode } from 'shared';
import type {
  GetOnboardingStatusInput,
  OnboardingStatus,
  GenerateOnboardingInput,
  GenerateOnboardingOutput,
  GenerateOnboardingAboutMeInput,
} from '../types/onboarding';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { compressOnboardingBody } from '../utils/onboardingCompression';
import { fixAiDateLaziness } from '../utils/ai-fixes';

function extractJsonObject(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new AppError(
      'AI returned non-JSON output',
      ErrorCode.AI_PARSE_ERROR,
      500,
      { rawText: text },
    );
  }
  return text.slice(start, end + 1);
}

export async function getOnboardingStatus(
  input: GetOnboardingStatusInput,
): Promise<OnboardingStatus> {
  const latestBaseResume = await prisma.baseResume.findFirst({
    where: { userId: input.clerkUserId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  return {
    hasBaseResume: Boolean(latestBaseResume),
    latestBaseResumeId: latestBaseResume?.id ?? null,
  };
}

export async function generateOnboarding(
  input: GenerateOnboardingInput,
): Promise<GenerateOnboardingOutput> {
  const { clerkUserId, body } = input;

  const model = body.model ?? 'gemini-3-flash-preview';
  const system = env.GEMINI_ONBOARDING_SYSTEM_PROMPT;

  let attempts = 0;
  const maxAttempts = 3;
  let lastError: any;

  while (attempts < maxAttempts) {
    attempts++;
    console.info(
      `AI generation attempt ${attempts}/${maxAttempts} for user ${clerkUserId}`,
    );

    try {
      const compressionLevel = Math.min(attempts - 1, 2) as 0 | 1 | 2;
      const aiBody = compressOnboardingBody(body, compressionLevel);
      const prompt = [
        'Onboarding form input (JSON):',
        JSON.stringify(aiBody, null, 2),
        '',
        'CRITICAL INSTRUCTION: You MUST verify that every experience and project object includes the "isCurrent": boolean field.',
        'If an item has no end date, set "endDate": null AND "isCurrent": true.',
        'DATE FORMAT: All dates (startDate, endDate) MUST be in "YYYY-MM" format. If you only have a year, use "YYYY-01".',
      ].join('\n');

      const { text, finishReason } = await geminiGenerateText({
        model,
        system,
        prompt,
        temperature: 0,
        maxOutputTokens: 32000,
        responseMimeType: 'application/json',
      });

      if (finishReason === 'MAX_TOKENS') {
        if (attempts < maxAttempts) {
          console.warn(
            `[Attempt ${attempts}] AI truncated by MAX_TOKENS. Retrying with more compression...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
          continue;
        }

        throw new AppError(
          'The resume is too large for the AI to process in one go. Please reduce your input detail.',
          ErrorCode.AI_GENERATION_ERROR,
          400,
        );
      }

      // 2. Parse Logic
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        try {
          parsed = JSON.parse(extractJsonObject(text));
        } catch (innerErr) {
          if (attempts < maxAttempts) {
            console.warn(
              `[Attempt ${attempts}] JSON Parse failed. Retrying...`,
            );
            continue;
          }
          throw new AppError(
            'AI returned unparseable JSON after multiple attempts.',
            ErrorCode.AI_PARSE_ERROR,
            500,
            { rawText: text },
          );
        }
      }

      const result = baseResumeDataSchema.safeParse(fixAiDateLaziness(parsed));
      if (!result.success) {
        throw new AppError(
          'AI-generated data validation failed',
          ErrorCode.AI_GENERATION_ERROR,
          500,
          result.error.issues,
        );
      }

      const baseResume = await prisma.baseResume.create({
        data: {
          userId: clerkUserId,
          name: 'My First Resume',
          data: result.data,
        },
      });

      return {
        baseResumeId: baseResume.id,
        data: result.data,
        meta: { model, finishReason },
      };
    } catch (err: unknown) {
      lastError = err;

      if (
        err instanceof AppError &&
        err.errorCode === ErrorCode.VALIDATION_ERROR
      ) {
        throw err;
      }

      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        `[Attempt ${attempts}] Critical system error:`,
        message,
      );
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  throw lastError;
}

export async function generateFromAboutMe(
  input: GenerateOnboardingAboutMeInput,
): Promise<GenerateOnboardingOutput> {
  const { clerkUserId, text: rawText } = input;

  const model = 'gemini-3-flash-preview';
  const system = env.GEMINI_ONBOARDING_SYSTEM_PROMPT;

  let attempts = 0;
  const maxAttempts = 3;
  let lastError: unknown;

  while (attempts < maxAttempts) {
    attempts++;
    console.info(
      `AI generation attempt ${attempts}/${maxAttempts} for user ${clerkUserId} (About Me)`,
    );

    try {
      // For raw text, we don't use the onboarding compressor. 
      // We just ensure we don't exceed token limits if the text is massive.
      const truncatedText = rawText.slice(0, 50000); // 50k chars is plenty for a CV

      const prompt = [
        'SOURCE MATERIAL (Raw Text from CV/Profile):',
        '---',
        truncatedText,
        '---',
        '',
        'CRITICAL INSTRUCTION:',
        '1. PARSE EVERYTHING: Extract as much detail as possible from the text above.',
        '2. GENERATE IDs: Since this is raw text, you MUST generate stable, unique IDs for all items (experiences, projects, skills, education, bullets).',
        '3. MISSING INFO: If some sections are missing, return an empty array for that section.',
        '4. DATE FORMAT: All dates MUST be in "YYYY-MM" format. If you only have a year, use "YYYY-01".',
        '5. BOOLEAN FIELDS: "isCurrent" must be true for ongoing items, false otherwise.',
        '6. SUFFICIENCY CHECK: Add a top-level field "_isDataSufficient" (boolean). Set to false if the source text is too sparse to create a meaningful resume (e.g. missing both experience and projects, or missing contact info).',
      ].join('\n');

      const { text: aiResponse, finishReason } = await geminiGenerateText({
        model,
        system,
        prompt,
        temperature: 0,
        maxOutputTokens: 32000,
        responseMimeType: 'application/json',
      });

      if (finishReason === 'MAX_TOKENS') {
        throw new AppError(
          'The provided text is too detailed for the AI to process. Please try a shorter version.',
          ErrorCode.AI_GENERATION_ERROR,
          400,
        );
      }

      // 2. Parse Logic
      let parsed: unknown;
      try {
        parsed = JSON.parse(aiResponse);
      } catch (err) {
        try {
          parsed = JSON.parse(extractJsonObject(aiResponse));
        } catch (innerErr) {
          if (attempts < maxAttempts) continue;
          throw new AppError(
            'AI returned unparseable JSON.',
            ErrorCode.AI_PARSE_ERROR,
            500,
            { rawText: aiResponse },
          );
        }
      }

      // Check for sufficiency before scrubbing non-schema fields
      const rawParsed = parsed as Record<string, unknown>;
      if (rawParsed._isDataSufficient === false) {
        throw new AppError(
          'The provided text does not contain enough information to generate a resume. Please provide more detail about your experience and skills.',
          ErrorCode.INSUFFICIENT_DATA,
          400,
        );
      }

      const result = baseResumeDataSchema.safeParse(fixAiDateLaziness(parsed));
      if (!result.success) {
        throw new AppError(
          'AI-generated data validation failed',
          ErrorCode.AI_GENERATION_ERROR,
          500,
          result.error.issues,
        );
      }

      const baseResume = await prisma.baseResume.create({
        data: {
          userId: clerkUserId,
          name: 'My First Resume',
          data: result.data,
        },
      });

      return {
        baseResumeId: baseResume.id,
        data: result.data,
        meta: { model, finishReason },
      };
    } catch (err: unknown) {
      lastError = err;
      if (err instanceof AppError && err.errorCode === ErrorCode.VALIDATION_ERROR) throw err;
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Attempt ${attempts}] Critical system error:`, message);
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  throw lastError;
}

