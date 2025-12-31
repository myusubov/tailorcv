import type { Request, Response, NextFunction } from 'express';
import { getGithubAuthUrl } from '../services/github.service';

/**
 * Initiates the GitHub OAuth flow by redirecting to GitHub
 */
export async function initiateGithubAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authUrl = getGithubAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the callback from GitHub after authorization
 */
export async function handleGithubCallback(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Phase 2 will implement the token exchange here
    console.log('Received GitHub callback with code:', code);

    // For now, redirect back to onboarding with a success flag
    // In production, you'd redirect after saving the token.
    res.redirect(`http://localhost:3000/onboarding?step=github&status=success&code=${code}`);
  } catch (error) {
    next(error);
  }
}
