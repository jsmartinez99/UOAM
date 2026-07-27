/**
 * Helpers compartidos para los controllers HTTP.
 *
 * Reducen la duplicación de try/catch y validaciones en los endpoints.
 */
import type { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(400, message, details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Autenticación requerida') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Acceso denegado') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Recurso no encontrado') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

/**
 * Extrae un campo string requerido del body. Lanza BadRequestError si falta.
 * Trims whitespace.
 */
export function requireStringField(body: unknown, field: string): string {
  const value = (body as Record<string, unknown> | null | undefined)?.[field];
  if (typeof value !== 'string') {
    throw new BadRequestError(`Campo requerido: ${field}`);
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    throw new BadRequestError(`Campo requerido: ${field}`);
  }
  return trimmed;
}

/**
 * Extrae un campo array requerido del body. Lanza BadRequestError si falta o no es array.
 */
export function requireArrayField<T = unknown>(body: unknown, field: string, minLength = 1): T[] {
  const value = (body as Record<string, unknown> | null | undefined)?.[field];
  if (!Array.isArray(value) || value.length < minLength) {
    throw new BadRequestError(
      `Campo requerido: ${field} (array con al menos ${minLength} elementos)`,
    );
  }
  return value as T[];
}

/**
 * Envuelve un handler async para centralizar el manejo de errores.
 * Los HttpError se serializan con su status; el resto cae a 500.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/**
 * Middleware final de errores. Convierte HttpError a su status; el resto a 500.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  res.status(500).json({ error: message });
}
