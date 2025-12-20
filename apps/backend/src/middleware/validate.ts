import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export const validateBody =
  <T>(schema: ZodType<T>): RequestHandler =>
  (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed as any;
      (res.locals as any).body = parsed as T;
      next();
    } catch (err) {
      next(err);
    }
  };

export const validateParams =
  <T>(schema: ZodType<T>): RequestHandler =>
  (req, res, next) => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as any;
      (res.locals as any).params = parsed as T;
      next();
    } catch (err) {
      next(err);
    }
  };

export const validateQuery =
  <T>(schema: ZodType<T>): RequestHandler =>
  (req, res, next) => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as any;
      (res.locals as any).query = parsed as T;
      next();
    } catch (err) {
      next(err);
    }
  };
