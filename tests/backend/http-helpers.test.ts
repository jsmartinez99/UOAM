import { describe, it, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  requireStringField,
  requireArrayField,
  asyncHandler,
  errorHandler,
} from '../../src/backend/http-helpers';

function createMockRes() {
  const res: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}
import { vi } from 'vitest';

describe('HTTP Helpers', () => {
  describe('Error classes', () => {
    it('HttpError preserves status and message', () => {
      const err = new HttpError(418, 'I am a teapot');
      expect(err.status).toBe(418);
      expect(err.message).toBe('I am a teapot');
      expect(err.name).toBe('HttpError');
    });

    it('BadRequestError defaults to status 400', () => {
      const err = new BadRequestError('bad');
      expect(err.status).toBe(400);
      expect(err.message).toBe('bad');
    });

    it('UnauthorizedError defaults to "Autenticación requerida"', () => {
      const err = new UnauthorizedError();
      expect(err.status).toBe(401);
      expect(err.message).toBe('Autenticación requerida');
    });

    it('ForbiddenError defaults to "Acceso denegado"', () => {
      const err = new ForbiddenError();
      expect(err.status).toBe(403);
    });

    it('NotFoundError defaults to "Recurso no encontrado"', () => {
      const err = new NotFoundError();
      expect(err.status).toBe(404);
    });
  });

  describe('requireStringField', () => {
    it('returns the field value when present and non-empty', () => {
      expect(requireStringField({ name: 'Quincy' }, 'name')).toBe('Quincy');
    });

    it('trims whitespace', () => {
      expect(requireStringField({ name: '  Quincy  ' }, 'name')).toBe('Quincy');
    });

    it('throws BadRequestError when missing', () => {
      expect(() => requireStringField({}, 'name')).toThrow(BadRequestError);
    });

    it('throws BadRequestError when not a string', () => {
      expect(() => requireStringField({ name: 123 }, 'name')).toThrow(BadRequestError);
    });

    it('throws BadRequestError when empty/whitespace', () => {
      expect(() => requireStringField({ name: '   ' }, 'name')).toThrow(BadRequestError);
    });
  });

  describe('requireArrayField', () => {
    it('returns the array when present with minimum length', () => {
      expect(requireArrayField<string>({ ids: ['a', 'b'] }, 'ids', 2)).toEqual(['a', 'b']);
    });

    it('throws when array is shorter than minLength', () => {
      expect(() => requireArrayField({ ids: ['a'] }, 'ids', 2)).toThrow(BadRequestError);
    });

    it('throws when not an array', () => {
      expect(() => requireArrayField({ ids: 'a' }, 'ids')).toThrow(BadRequestError);
    });
  });

  describe('asyncHandler', () => {
    it('forwards success to the wrapped handler', async () => {
      const handler = asyncHandler(async (_req, res) => {
        res.status(200).json({ ok: true });
      });
      const res = createMockRes();
      const next = vi.fn();
      await handler({} as Request, res as unknown as Response, next as NextFunction);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next()', async () => {
      const handler = asyncHandler(async () => {
        throw new Error('boom');
      });
      const res = createMockRes();
      const next = vi.fn();
      await handler({} as Request, res as unknown as Response, next as NextFunction);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('errorHandler', () => {
    it('serializes HttpError with its status', () => {
      const res = createMockRes();
      errorHandler(new BadRequestError('bad input'), {} as Request, res as unknown as Response, vi.fn() as NextFunction);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'bad input' });
    });

    it('serializes generic Error as 500', () => {
      const res = createMockRes();
      errorHandler(new Error('unexpected'), {} as Request, res as unknown as Response, vi.fn() as NextFunction);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'unexpected' });
    });

    it('serializes non-Error as 500 with generic message', () => {
      const res = createMockRes();
      errorHandler('a string', {} as Request, res as unknown as Response, vi.fn() as NextFunction);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });
});
