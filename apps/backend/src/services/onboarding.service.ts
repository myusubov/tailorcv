import { logger, prisma } from '../lib';
import { baseResumeDataSchema, ErrorCode, type BaseResumeData, openAiResumeSchema } from 'shared';
import { z } from 'zod';
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
import { aiExtractionResponseSchema } from '../schemas/ai-extraction.schema';


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

export async function generateFromAboutMe(
  input: GenerateOnboardingAboutMeInput,
): Promise<GenerateOnboardingOutput> {
  const { clerkUserId, text: rawText } = input;

  const model = 'gpt-4o-mini';
  const system = env.OPENAI_ONBOARDING_SYSTEM_PROMPT;

  logger.info({ 
    clerkUserId, 
    textLength: rawText.length 
  }, 'AI generation attempt for user (About Me)');

  const truncatedText = rawText.slice(0, 30000); // Token safety
  const prompt = `SOURCE MATERIAL (Raw Text from CV/Profile):\n---\n${truncatedText}\n---\n\nCRITICAL INSTRUCTION:\n1. PARSE EVERYTHING: Extract as much detail as possible from the text above into the resume schema.\n2. DATA SUFFICIENCY: Set "_isDataSufficient" to false if critical info like project/experience START DATES or basic career context is missing. Provide reasoning in "_insufficientReason" (or empty string if sufficient).\n3. DATE FORMAT: All dates MUST be in "YYYY-MM" format. If you only have a year, use "YYYY-01". Every project/experience MUST have a startDate.\n4. BOOLEAN FIELDS: "isCurrent" must be true for ongoing items, false otherwise.`;

  const response = await openai.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt }
    ],
    response_format: zodResponseFormat(aiExtractionResponseSchema, 'resume_extraction'),
    temperature: 0,
  });

  const parsedResponse = response.choices[0].message.parsed;

  if (!parsedResponse) {
    throw new AppError(
      'AI failed to provide a valid response format',
      ErrorCode.AI_GENERATION_ERROR,
      500,
    );
  }

  if (parsedResponse._isDataSufficient === false) {
    const reason = parsedResponse._insufficientReason || 'Insufficient data';
    logger.warn({ clerkUserId, reason }, 'AI determined source material is insufficient');
    throw new AppError(
      reason,
      ErrorCode.INSUFFICIENT_DATA,
      400,
    );
  }

  logger.info({ 
    clerkUserId, 
    finishReason: response.choices[0].finish_reason 
  }, 'Successfully extracted resume data from raw text');

  const baseResume = await prisma.baseResume.create({
    data: {
      userId: clerkUserId,
      name: 'My First Resume',
      data: parsedResponse.data,
    },
  });

  return {
    baseResumeId: baseResume.id,
    data: parsedResponse.data,
    rawAiResponse: parsedResponse,
    meta: { model, finishReason: response.choices[0].finish_reason },
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


