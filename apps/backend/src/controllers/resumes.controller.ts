import type { NextFunction, Request, Response } from 'express';

import { successResponse } from '../utils/response';
import {
  createBaseResume,
  deleteBaseResume,
  getBaseResumeById,
  listBaseResumes,
  updateBaseResume,
} from '../services/resumes.service';
import type {
  CreateBaseResumeLocals,
  ResumeIdLocals,
  UpdateBaseResumeLocals,
  ClerkLocals,
} from '../types/locals';

export const createBaseResumeController = async (
  _req: Request,
  res: Response<any, CreateBaseResumeLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId, body } = res.locals;

    const baseResume = await createBaseResume({
      clerkUserId,
      name: body.name ?? 'My Resume',
      data: body.data,
    });

    return successResponse(res, baseResume, 201);
  } catch (err) {
    next(err);
  }
};

export const listBaseResumesController = async (
  _req: Request,
  res: Response<any, ClerkLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId } = res.locals;
    const baseResumes = await listBaseResumes({ clerkUserId });
    return successResponse(res, baseResumes, 200);
  } catch (err) {
    next(err);
  }
};

export const getBaseResumeController = async (
  _req: Request,
  res: Response<any, ResumeIdLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId, params } = res.locals;
    const { id } = params;

    const baseResume = await getBaseResumeById({ clerkUserId, id });
    return successResponse(res, baseResume, 200);
  } catch (err) {
    next(err);
  }
};

export const updateBaseResumeController = async (
  _req: Request,
  res: Response<any, UpdateBaseResumeLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId, params, body } = res.locals;
    const { id } = params;

    const baseResume = await updateBaseResume({
      clerkUserId,
      id,
      name: body.name,
      data: body.data,
    });

    return successResponse(res, baseResume, 200);
  } catch (err) {
    next(err);
  }
};

export const deleteBaseResumeController = async (
  _req: Request,
  res: Response<any, ResumeIdLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId, params } = res.locals;
    const { id } = params;

    await deleteBaseResume({ clerkUserId, id });
    return successResponse(res, { id }, 200);
  } catch (err) {
    next(err);
  }
};
