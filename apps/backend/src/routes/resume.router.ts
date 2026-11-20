import { Router } from 'express';
import { requireClerkAuth } from '../middleware/auth';
import { getResumeController } from '../controllers/resume.controller';

export const resumeRouter = Router();

resumeRouter.get('/:id', requireClerkAuth, getResumeController);
