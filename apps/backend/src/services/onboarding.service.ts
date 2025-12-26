import { geminiGenerateText, prisma } from '../lib';
import { baseResumeDataSchema, ErrorCode } from 'shared';
import type {
  GetOnboardingStatusInput,
  OnboardingStatus,
  GenerateOnboardingInput,
  GenerateOnboardingOutput,
} from '../types/onboarding';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { compressOnboardingBody } from '../utils/onboardingCompression';

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

      // Pre-validation "fix-up" for common AI laziness (like YYYY instead of YYYY-MM)
      const fixDates = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(fixDates);

        const newObj = { ...obj };
        for (const key in newObj) {
          const val = newObj[key];
          // Look for potential date strings that are just 4 digits (YYYY)
          if (
            typeof val === 'string' &&
            /^\d{4}$/.test(val) &&
            (key.toLowerCase().includes('date') ||
              key.toLowerCase().includes('year'))
          ) {
            newObj[key] = `${val}-01`;
          } else if (val && typeof val === 'object') {
            newObj[key] = fixDates(val);
          }
        }
        return newObj;
      };

      const result = baseResumeDataSchema.safeParse(fixDates(parsed));
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
    } catch (err: any) {
      lastError = err;

      if (
        err instanceof AppError &&
        err.errorCode === ErrorCode.VALIDATION_ERROR
      ) {
        throw err;
      }

      console.error(
        `[Attempt ${attempts}] Critical system error:`,
        err.message,
      );
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  throw lastError;
}
