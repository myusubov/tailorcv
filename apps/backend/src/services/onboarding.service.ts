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
      ].join('\n');

      const { text, finishReason } = await geminiGenerateText({
        model,
        system,
        prompt,
        temperature: 0,
        maxOutputTokens: 16384,
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

      const result = baseResumeDataSchema.safeParse(parsed);
      if (!result.success) {
        throw new AppError(
          'AI-generated data validation failed',
          ErrorCode.VALIDATION_ERROR,
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
