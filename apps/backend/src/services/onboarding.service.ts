import { geminiGenerateText, prisma } from '../lib';
import { baseResumeDataSchema } from 'shared';
import type {
  GetOnboardingStatusInput,
  OnboardingStatus,
  GenerateOnboardingInput,
  GenerateOnboardingOutput,
} from '../types/onboarding';
import { env } from '../config/env';

function extractJsonObject(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI returned non-JSON output');
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

  const prompt = [
    'Onboarding form input (JSON):',
    JSON.stringify(body, null, 2),
  ].join('\n');

  const { text, finishReason } = await geminiGenerateText({
    model,
    system,
    prompt,
    temperature: 0.25,
    maxOutputTokens: 2500,
  });

  console.log({ text, finishReason, system })

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = JSON.parse(extractJsonObject(text));
  }

  const data = baseResumeDataSchema.parse(parsed);

  const baseResume = await prisma.baseResume.create({
    data: {
      userId: clerkUserId,
      name: 'My First Resume',
      data,
    },
  });

  return {
    baseResumeId: baseResume.id,
    data,
    meta: { model, finishReason },
  };
}
