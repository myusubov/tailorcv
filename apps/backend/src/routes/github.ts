import { Router } from 'express';
import {
  initiateGithubAuth,
  handleGithubCallback,
  getGithubRepos,
} from '../controllers/github.controller';
import { requireClerkAuth } from 'src/middleware/auth';

export const githubRouter = Router();

// /api/v1/auth/github
githubRouter.get('/', requireClerkAuth, initiateGithubAuth);

// /api/v1/auth/github/callback
githubRouter.get('/callback', requireClerkAuth, handleGithubCallback);

githubRouter.get('/repos', requireClerkAuth, getGithubRepos);