import { Router } from 'express';
import { requireClerkAuth } from '../middleware/auth';
import { validateParams } from '../middleware/validate';
import {
  getResumeController,
  retryResumeController,
} from '../controllers/resume.controller';
import { resumeIdParamsSchema } from '../schemas/resume.schema';

export const resumeRouter = Router();

resumeRouter.get(
  '/:id',
  requireClerkAuth,
  validateParams(resumeIdParamsSchema),
  getResumeController,
);

resumeRouter.post(
  '/:id/retry',
  requireClerkAuth,
  validateParams(resumeIdParamsSchema),
  retryResumeController,
);
