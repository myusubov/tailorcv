import { Router } from 'express';
import {
  startAnalysis,
  getAnalysisStatus,
  getAnalysisResults,
  listAnalysisJobs,
} from '../controllers/analysis.controller';
import { requireClerkAuth } from '../middleware/auth';

export const analysisRouter = Router();

// POST /api/v1/analysis/start
analysisRouter.post('/start', requireClerkAuth, startAnalysis);

// GET /api/v1/analysis (list all jobs)
analysisRouter.get('/', requireClerkAuth, listAnalysisJobs);

// GET /api/v1/analysis/:jobId (get job status)
analysisRouter.get('/:jobId', requireClerkAuth, getAnalysisStatus);

// GET /api/v1/analysis/:jobId/results (get final results)
analysisRouter.get('/:jobId/results', requireClerkAuth, getAnalysisResults);
