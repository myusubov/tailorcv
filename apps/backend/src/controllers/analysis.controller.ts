import type { Request, Response, NextFunction } from 'express';
import {
  createAnalysisJob,
  getAnalysisJob,
  getUserAnalysisJobs,
} from '../services/analysis.service';
import { ClerkLocals } from '../types/locals';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import { addJob } from '../lib/queue';

/**
 * POST /api/v1/analysis/start
 * Starts a new repository analysis job
 */
export async function startAnalysis(
  req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) {
  try {
    const { repositoryIds } = req.body;
    const { clerkUserId } = res.locals;

    if (!repositoryIds || !Array.isArray(repositoryIds) || repositoryIds.length === 0) {
      throw new AppError(
        'repositoryIds must be a non-empty array',
        ErrorCode.BAD_REQUEST,
        400,
      );
    }

    if (repositoryIds.length > 3) {
      throw new AppError(
        'Maximum 3 repositories allowed',
        ErrorCode.BAD_REQUEST,
        400,
      );
    }

    const job = await createAnalysisJob({
      userId: clerkUserId,
      repositoryIds,
    });

    // Queue the background worker to process the analysis
    await addJob('analysis.process', { jobId: job.id });

    return successResponse(res, { jobId: job.id, status: job.status }, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/analysis/:jobId
 * Gets the status and details of an analysis job
 */
export async function getAnalysisStatus(
  req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { clerkUserId } = res.locals;

    const job = await getAnalysisJob(jobId);

    // Verify job belongs to user
    if (job.userId !== clerkUserId) {
      throw new AppError(
        'Job not found',
        ErrorCode.NOT_FOUND,
        404,
      );
    }

    return successResponse(res, job, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/analysis/:jobId/results
 * Gets the final results of a completed analysis job
 */
export async function getAnalysisResults(
  req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { clerkUserId } = res.locals;

    const job = await getAnalysisJob(jobId);

    // Verify job belongs to user
    if (job.userId !== clerkUserId) {
      throw new AppError(
        'Job not found',
        ErrorCode.NOT_FOUND,
        404,
      );
    }

    // Check if job is completed
    if (job.status !== 'COMPLETED') {
      throw new AppError(
        'Analysis not yet completed',
        ErrorCode.BAD_REQUEST,
        400,
      );
    }

    if (!job.results) {
      throw new AppError(
        'Results not found',
        ErrorCode.NOT_FOUND,
        404,
      );
    }

    return successResponse(res, job.results, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/analysis
 * Lists all analysis jobs for the authenticated user
 */
export async function listAnalysisJobs(
  req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) {
  try {
    const { clerkUserId } = res.locals;

    const jobs = await getUserAnalysisJobs(clerkUserId);

    return successResponse(res, jobs, 200);
  } catch (error) {
    next(error);
  }
}
