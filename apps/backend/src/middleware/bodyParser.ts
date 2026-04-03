import express from 'express';
import type { RequestHandler } from 'express';

/** Routes that should skip body parsing (e.g., webhook routes that need raw body) */
const RAW_BODY_ROUTES = ['/api/v1/webhooks'];

const shouldSkipParsing = (path: string): boolean =>
  RAW_BODY_ROUTES.some((route) => path.startsWith(route));

// Pre-instantiate middleware once to avoid per-request allocation
const rawParser = express.raw({ type: 'application/json' });
const standardJsonParser = express.json();
const standardUrlencodedParser = express.urlencoded({ extended: true });

/** JSON body parser that skips raw-body routes */
export const jsonParser: RequestHandler = (req, res, next) => {
  if (shouldSkipParsing(req.path)) {
    // Preserve raw body as Buffer for webhook signature verification
    return rawParser(req, res, next);
  }
  standardJsonParser(req, res, next);
};

/** URL-encoded body parser that skips raw-body routes */
export const urlencodedParser: RequestHandler = (req, res, next) => {
  if (shouldSkipParsing(req.path)) return next();
  standardUrlencodedParser(req, res, next);
};
