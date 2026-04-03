import express from 'express';
import type { RequestHandler } from 'express';

/** Routes that should skip body parsing (e.g., webhook routes that need raw body) */
const RAW_BODY_ROUTES = ['/api/v1/webhooks'];

const shouldSkipParsing = (path: string): boolean =>
  RAW_BODY_ROUTES.some((route) => path.startsWith(route));

/** JSON body parser that skips raw-body routes */
export const jsonParser: RequestHandler = (req, res, next) => {
  if (shouldSkipParsing(req.path)) {
    // Preserve raw body as Buffer for webhook signature verification
    return express.raw({ type: 'application/json' })(req, res, next);
  }
  express.json()(req, res, next);
};

/** URL-encoded body parser that skips raw-body routes */
export const urlencodedParser: RequestHandler = (req, res, next) => {
  if (shouldSkipParsing(req.path)) return next();
  express.urlencoded({ extended: true })(req, res, next);
};
