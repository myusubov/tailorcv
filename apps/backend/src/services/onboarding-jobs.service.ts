import { ErrorCode } from 'shared';
import { prisma } from '../lib';
import { addJob } from '../lib/queue';
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

/**
 * Starts a new onboarding job from form data
 * Creates a database record and queues the job for background processing
 * @param input - User ID and onboarding form body
 * @returns Job ID for tracking progress
 */
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
      payload,
    },
    select: { id: true },
  });

  await addJob('onboarding.generate', { jobId: job.id }, { jobKey: job.id });

  return { jobId: job.id };
}

/**
 * Starts a new onboarding job from "About Me" text
 * Extracts resume data from raw text using AI
 * @param input - User ID and raw text content
 * @returns Job ID for tracking progress
 */
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
      payload,
    },
    select: { id: true },
  });

  await addJob('onboarding.generate', { jobId: job.id }, { jobKey: job.id });

  return { jobId: job.id };
}

/**
 * Starts a new onboarding job from GitHub repositories
 * Fetches commits/PRs and extracts resume data using AI
 * @param input - User ID and repository IDs
 * @returns Job ID for tracking progress
 */
export async function startOnboardingGithubJob(input: {
  clerkUserId: string;
  repositoryIds: string[];
}): Promise<StartOnboardingJobOutput> {
  const payload: OnboardingJobPayload = {
    repositoryIds: input.repositoryIds,
    _type: 'github',
  };
  const job = await prisma.onboardingJob.create({
    data: {
      userId: input.clerkUserId,
      status: 'QUEUED',
      stage: 'QUEUED',
      progressPct: 0,
      payload,
    },
    select: { id: true },
  });

  await addJob('onboarding.generate', { jobId: job.id }, { jobKey: job.id });

  return { jobId: job.id };
}

/**
 * Retrieves the status and details of an onboarding job
 * Used for polling job progress from the frontend
 * @param input - User ID and job ID
 * @returns Job status, progress, and results (if completed)
 * @throws AppError if job not found or doesn't belong to user
 */
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
