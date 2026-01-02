/* eslint-disable import/no-anonymous-default-export */
import type { Job } from 'bullmq';
import { prisma } from '../lib';
import { logger } from '../lib/logger';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import { getAnalysisJob, updateJobStatus } from '../services/analysis.service';
import { detectRepoTechStack, fetchRepoCommits, fetchRepoPullRequests, getGithubConnection } from '../services/github.service';

function toJobError(err: unknown) {
  if (err instanceof AppError) {
    return {
      message: err.message,
      code: err.errorCode,
      details: err.details,
    };
  }

  return {
    message:
      (err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message)
        : null) ?? 'Unknown error',
    code: ErrorCode.INTERNAL_ERROR,
  };
}

/**
 * BullMQ worker processor for GitHub analysis job processing
 */
export default async function (job: Job<{ jobId: string }>) {
  const { jobId } = job.data;
  const startedAt = Date.now();

  logger.info({ jobId }, 'worker analysis.process task picked up');

  const dbJob = await getAnalysisJob(jobId);

  if (!dbJob) {
    logger.warn({ jobId }, 'worker analysis.process job not found');
    return;
  }

  try {
    await updateJobStatus({
      jobId,
      status: 'PROCESSING',
    });

    const githubConnection = await getGithubConnection(dbJob.userId);

    if (!githubConnection) {
      throw new AppError('GitHub connection not found', ErrorCode.NOT_FOUND, 404);
    }

    const accessToken = githubConnection.accessToken;

    for (const { repoOwner, repoName, id } of dbJob.repositories) {
      const [commits, prs, techStack] = await Promise.all([
        fetchRepoCommits({
          accessToken,
          owner: repoOwner,
          repo: repoName,
          limit: 100,
        }),
        fetchRepoPullRequests({
          accessToken,
          owner: repoOwner,
          repo: repoName,
          limit: 100,
        }),
        detectRepoTechStack({
          accessToken,
          owner: repoOwner,
          repo: repoName,
        }),
      ]);
      await prisma.analysisRepository.update({
        where: {
          id,
        },
        data: {
          commits: commits as any,
          pullRequests: prs as any,
          techStack,
          status: 'COMPLETED' as const,
        },
      });
    }

    // Aggregate all data from all repositories
    const updatedJob = await getAnalysisJob(jobId);
    const allCommits = updatedJob.repositories.flatMap((r) => (r.commits as any) || []);
    const allPRs = updatedJob.repositories.flatMap((r) => (r.pullRequests as any) || []);
    const allTechStack = [...new Set(updatedJob.repositories.flatMap((r) => r.techStack || []))];

    logger.info(
      {
        jobId,
        totalCommits: allCommits.length,
        totalPRs: allPRs.length,
        techStack: allTechStack,
      },
      'Data aggregated from all repositories',
    );

    // TODO: Call AI to generate resume bullets
    // const bullets = await generateResumeBullets({ commits: allCommits, prs: allPRs, techStack: allTechStack });
    // await saveAnalysisResults({ jobId, bullets, summary: '...', topSkills: allTechStack });

    // Update job status to COMPLETED
    await updateJobStatus({
      jobId: dbJob.id,
      status: 'COMPLETED',
    });

    logger.info(
      {
        jobId: dbJob.id,
        userId: dbJob.userId,
        elapsedMs: Date.now() - startedAt,
      },
      'worker analysis.process success',
    );
  } catch (err) {
    logger.error(
      {
        err,
        jobId: dbJob.id,
        userId: dbJob.userId,
        elapsedMs: Date.now() - startedAt,
      },
      'worker analysis.process failed',
    );

    const jobError = toJobError(err);

    await updateJobStatus({
      jobId: dbJob.id,
      status: 'FAILED',
      errorMessage: jobError.message,
    });

    throw err; // Re-throw so BullMQ knows the job failed
  }
}
