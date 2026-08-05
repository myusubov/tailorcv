import { Router } from 'express';
import {
  initiateGithubAuth,
  handleGithubCallback,
  getGithubRepos,
  fetchGithubConnection,
  analyzeGithubRepos,
} from '../controllers/github.controller';
import { requireClerkAuth } from '../middleware/auth';
import { requireGithubConnection } from '../middleware/github-auth';
import { validateBody } from '../middleware/validate';
import { analyzeGithubReposRequestBodySchema } from '../schemas/github.schema';

export const githubRouter = Router();

// /api/v1/auth/github
githubRouter.get('/', requireClerkAuth, initiateGithubAuth);

// /api/v1/auth/github/callback
githubRouter.get('/callback', requireClerkAuth, handleGithubCallback);

// /api/v1/auth/github/repos
githubRouter.get(
  '/repos',
  requireClerkAuth,
  requireGithubConnection,
  getGithubRepos,
);

// /api/v1/auth/github/connection
githubRouter.get('/connection', requireClerkAuth, fetchGithubConnection);

// /api/v1/auth/github/analyze
githubRouter.post(
  '/analyze',
  requireClerkAuth,
  requireGithubConnection,
  validateBody(analyzeGithubReposRequestBodySchema),
  analyzeGithubRepos,
);
