import { logger, prisma } from '../lib';
import { baseResumeDataSchema, ErrorCode, type BaseResumeData, openAiResumeSchema } from 'shared';
import type {
  GetOnboardingStatusInput,
  OnboardingStatus,
  GenerateOnboardingInput,
  GenerateOnboardingOutput,
  GenerateOnboardingAboutMeInput,
} from '../types/onboarding';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { openai } from '../lib/openai';
import { zodResponseFormat } from 'openai/helpers/zod';


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

  const model = 'gpt-4o-mini';
  const system = env.OPENAI_ONBOARDING_SYSTEM_PROMPT;

  // DIRECT INPUT: No compression, no modifications
  const prompt = `Onboarding form input (JSON):\n${JSON.stringify(body, null, 2)}`;
  
  logger.info(`AI generation (OpenAI Structured) starting for user ${clerkUserId}`);

  const response = await openai.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    response_format: zodResponseFormat(openAiResumeSchema, 'resume'),
    temperature: 0,
  });

  const rawData = response.choices[0].message.parsed;

  if (!rawData) {
    throw new AppError(
      'AI failed to generate structured data',
      ErrorCode.AI_GENERATION_ERROR,
      500,
      { refusal: response.choices[0].message.refusal }
    );
  }

  logger.info({ aiResponse: rawData }, 'Structured AI Response');
  
  // DIRECT VALIDATION: No fixes, no cleaning. 
  // If AI gives bad data (like empty strings for URLs), it WILL fail here.
  const validation = baseResumeDataSchema.safeParse(rawData);
  
  if (!validation.success) {
    logger.error({ 
      errors: validation.error.issues,
      rawData 
    }, 'AI Response failed strict validation');

    throw new AppError(
      'AI-generated data failed strict validation',
      ErrorCode.AI_GENERATION_ERROR,
      500,
      { 
        validationErrors: validation.error.issues,
        rawAiResponse: rawData 
      }
    );
  }

  const baseResume = await prisma.baseResume.create({
    data: {
      userId: clerkUserId,
      name: 'My First Resume',
      data: validation.data,
    },
  });

  return {
    baseResumeId: baseResume.id,
    data: validation.data,
    rawAiResponse: rawData,
    meta: {
      model,
      finishReason: response.choices[0].finish_reason,
    },
  };
}

// export async function generateFromAboutMe(
//   input: GenerateOnboardingAboutMeInput,
// ): Promise<GenerateOnboardingOutput> {
//   const { clerkUserId, text: rawText } = input;

//   const model = 'gemini-2.0-flash-exp';
//   const system = env.GEMINI_ONBOARDING_SYSTEM_PROMPT;

//   let attempts = 0;
//   const maxAttempts = 3;
//   let lastError: unknown;

//   while (attempts < maxAttempts) {
//     attempts++;
//     logger.info(
//       `AI generation attempt ${attempts}/${maxAttempts} for user ${clerkUserId} (About Me)`,
//     );

//     try {
//       // For raw text, we don't use the onboarding compressor. 
//       // We just ensure we don't exceed token limits if the text is massive.
//       const truncatedText = rawText.slice(0, 50000); // 50k chars is plenty for a CV

//       const prompt = [
//         'SOURCE MATERIAL (Raw Text from CV/Profile):',
//         '---',
//         truncatedText,
//         '---',
//         '',
//         'CRITICAL INSTRUCTION:',
//         '1. PARSE EVERYTHING: Extract as much detail as possible from the text above.',
//         '2. GENERATE IDs: Since this is raw text, you MUST generate stable, unique IDs for all items (experiences, projects, skills, education, bullets).',
//         '3. MISSING INFO: If some sections are missing, return an empty array for that section.',
//         '4. DATE FORMAT: All dates MUST be in "YYYY-MM" format. If you only have a year, use "YYYY-01".',
//         '5. BOOLEAN FIELDS: "isCurrent" must be true for ongoing items, false otherwise.',
//         '6. SUFFICIENCY CHECK: Add a top-level field "_isDataSufficient" (boolean). Set to false if the source text is too sparse to create a meaningful resume (e.g. missing both experiences and projects, or missing contact info).',
//       ].join('\n');

//       const { text: aiResponse, finishReason } = await geminiGenerateText({
//         model,
//         system,
//         prompt,
//         temperature: 0,
//         maxOutputTokens: 32000,
//         responseMimeType: 'application/json',
//       });

//       if (finishReason === 'MAX_TOKENS') {
//         throw new AppError(
//           'The provided text is too detailed for the AI to process. Please try a shorter version.',
//           ErrorCode.AI_GENERATION_ERROR,
//           400,
//         );
//       }

//       const parsed = JSON.parse(aiResponse);

//       // Check for sufficiency before scrubbing non-schema fields
//       const rawParsed = parsed as Record<string, unknown>;
//       if (rawParsed._isDataSufficient === false) {
//         throw new AppError(
//           'The provided text does not contain enough information to generate a resume. Please provide more detail about your experience and skills.',
//           ErrorCode.INSUFFICIENT_DATA,
//           400,
//         );
//       }

//       logger.info({ aiResponse }, 'Raw AI Response');

//       const result = baseResumeDataSchema.safeParse(parsed);
//       if (!result.success) {
//         throw new AppError(
//           'AI-generated data validation failed',
//           ErrorCode.AI_GENERATION_ERROR,
//           500,
//           {
//             validationErrors: result.error.issues,
//             rawAiResponse: parsed
//           },
//         );
//       }

//       const baseResume = await prisma.baseResume.create({
//         data: {
//           userId: clerkUserId,
//           name: 'My First Resume',
//           data: result.data,
//         },
//       });

//       return {
//         baseResumeId: baseResume.id,
//         data: result.data,
//         rawAiResponse: parsed,
//         meta: { model, finishReason: String(finishReason) },
//       };
//     } catch (err: unknown) {
//       lastError = err;
//       if (err instanceof AppError && err.errorCode === ErrorCode.VALIDATION_ERROR) throw err;
//       const message = err instanceof Error ? err.message : 'Unknown error';
//       logger.error(`[Attempt ${attempts}] Critical system error: ${message}`);
//       if (attempts < maxAttempts) {
//         await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
//       }
//     }
//   }

//   throw lastError;
// }


