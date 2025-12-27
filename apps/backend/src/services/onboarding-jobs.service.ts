import { ErrorCode } from 'shared';
import { prisma, getWorkerUtils } from '../lib';
import { AppError } from '../utils/AppError';
import type { OnboardingGenerateBaseBody } from '../schemas/onboarding-generate.schema';
import type { GenerateOnboardingOutput } from '../types/onboarding';
import { logger } from '../lib/logger';
import type {
  OnboardingJobError,
  OnboardingJobPayload,
  OnboardingJobStage,
  OnboardingJobStatus,
} from '../types/onboarding-job';

export type StartOnboardingJobOutput = { jobId: string };

export type GetOnboardingJobOutput = {
  id: string;
  status: OnboardingJobStatus;
  stage: OnboardingJobStage;
  progressPct: number;
  createdAt: string;
  updatedAt: string;
  resultBaseResumeId?: string;
  error?: OnboardingJobError;
  rawAiResponse?: unknown;
};

export async function startOnboardingJob(input: {
  clerkUserId: string;
  body: OnboardingGenerateBaseBody;
}): Promise<StartOnboardingJobOutput> {
  const payload: OnboardingJobPayload = { ...input.body, _type: 'form' };
  const job = await prisma.onboardingJob.create({
    data: {
      userId: input.clerkUserId,
      status: 'QUEUED',
      stage: 'QUEUED',
      progressPct: 0,
      payload
    },
    select: { id: true },
  });

  const workerUtils = await getWorkerUtils();
  await workerUtils.addJob(
    'onboarding.generate',
    { jobId: job.id },
    { jobKey: job.id },
  );

  return { jobId: job.id };
}

export async function startOnboardingAboutMeJob(input: {
  clerkUserId: string;
  text: string;
}): Promise<StartOnboardingJobOutput> {
  const payload: OnboardingJobPayload = { text: input.text, _type: 'about-me' };
  const job = await prisma.onboardingJob.create({
    data: {
      userId: input.clerkUserId,
      status: 'QUEUED',
      stage: 'QUEUED',
      progressPct: 0,
      payload
    },
    select: { id: true },
  });

  const workerUtils = await getWorkerUtils();
  await workerUtils.addJob(
    'onboarding.generate',
    { jobId: job.id },
    { jobKey: job.id },
  );

  return { jobId: job.id };
}

export async function getOnboardingJob(input: {
  clerkUserId: string;
  jobId: string;
}): Promise<GetOnboardingJobOutput> {
  const job = await prisma.onboardingJob.findFirst({
    where: { id: input.jobId, userId: input.clerkUserId },
    select: {
      id: true,
      status: true,
      stage: true,
      progressPct: true,
      createdAt: true,
      updatedAt: true,
      resultBaseResumeId: true,
      error: true,
      rawAiResponse: true,
    },
  });

  if (!job) throw new AppError('Job not found', ErrorCode.NOT_FOUND, 404);

  return {
    id: job.id,
    status: job.status as OnboardingJobStatus,
    stage: job.stage as OnboardingJobStage,
    progressPct: job.progressPct,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    resultBaseResumeId: job.resultBaseResumeId ?? undefined,
    error: (job.error as OnboardingJobError) ?? undefined,
    rawAiResponse: job.rawAiResponse ?? undefined,
  };
}
