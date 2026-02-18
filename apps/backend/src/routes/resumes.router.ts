import { Router } from 'express';
import {
  createBaseResumeController,
  deleteBaseResumeController,
  getBaseResumeController,
  listBaseResumesController,
  updateBaseResumeController,
} from '../controllers/resumes.controller';
import { requireClerkAuth } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createBaseResumeBodySchema,
  resumeIdParamsSchema,
  updateBaseResumeBodySchema,
} from '../schemas/resumes.schema';

export const resumesRouter = Router();

resumesRouter.post(
  '/base',
  requireClerkAuth,
  validateBody(createBaseResumeBodySchema),
  createBaseResumeController,
);
resumesRouter.get('/base', requireClerkAuth, listBaseResumesController);
resumesRouter.get(
  '/base/:id',
  requireClerkAuth,
  validateParams(resumeIdParamsSchema),
  getBaseResumeController,
);
resumesRouter.patch(
  '/base/:id',
  requireClerkAuth,
  validateParams(resumeIdParamsSchema),
  validateBody(updateBaseResumeBodySchema),
  updateBaseResumeController,
);
resumesRouter.delete(
  '/base/:id',
  requireClerkAuth,
  validateParams(resumeIdParamsSchema),
  deleteBaseResumeController,
);
