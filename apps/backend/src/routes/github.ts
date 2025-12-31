import { Router } from 'express';
import {
  initiateGithubAuth,
  handleGithubCallback,
} from '../controllers/github.controller';

export const githubRouter = Router();

// /api/v1/auth/github
githubRouter.get('/', initiateGithubAuth);

// /api/v1/auth/github/callback
githubRouter.get('/callback', handleGithubCallback);
