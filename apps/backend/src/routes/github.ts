import { Router } from 'express';
import {
  initiateGithubAuth,
  handleGithubCallback,
  getGithubRepos,
  fetchGithubConnection,
} from '../controllers/github.controller';
import { requireClerkAuth } from '../middleware/auth';

export const githubRouter = Router();

// /api/v1/auth/github
githubRouter.get('/', requireClerkAuth, initiateGithubAuth);

// /api/v1/auth/github/callback
githubRouter.get('/callback', requireClerkAuth, handleGithubCallback);

// /api/v1/auth/github/repos
githubRouter.get('/repos', requireClerkAuth, getGithubRepos);

// /api/v1/auth/github/connection
githubRouter.get('/connection', requireClerkAuth, fetchGithubConnection);
