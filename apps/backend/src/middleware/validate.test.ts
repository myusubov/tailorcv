import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z, ZodError } from 'zod';
import { validateParams } from './validate';

const schema = z.object({ id: z.string() });

describe('validateParams', () => {
  let req: Request;
  let res: Response;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = { params: { id: 'abc' } } as unknown as Request;
    res = { locals: {} } as unknown as Response;
    next = vi.fn();
  });

  it('calls next without an error when the params are valid', () => {
    req = { params: { id: crypto.randomUUID() } } as unknown as Request;

    validateParams(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledOnce();
  });

  it('replaces req.params with the parsed params', () => {
    req = {
      params: { id: 'abc', extra: 'x' },
    } as unknown as Request;

    validateParams(schema)(req, res, next);

    expect(req.params).toEqual({ id: 'abc' });
  });

  it('stores the parsed params on res.locals.params', () => {
    req = { params: { id: 'abc' } } as unknown as Request;

    validateParams(schema)(req, res, next);

    expect(res.locals.params).toEqual({ id: 'abc' });
  });

  it('calls next with the ZodError when the params are invalid', () => {
    req = { params: { id: 123 } } as unknown as Request;

    validateParams(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
  });

  it('leaves req.params unchanged when the params are invalid', () => {
    req = { params: { id: 123 } } as unknown as Request;

    validateParams(schema)(req, res, next);

    expect(req.params).toEqual({ id: 123 });
  });
});
