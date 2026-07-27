/**
 * Middleware de seguridad HTTP.
 *
 * - securityHeaders: añade headers defensivos a cada respuesta
 * - rateLimit: previene abuso/brute force en endpoints sensibles
 * - jsonBodyLimit: limita el tamaño de payloads
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';

const MAX_JSON_BODY = '1mb';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * In-memory rate limiter (token bucket simplificado).
 * Para producción con múltiples instancias, usar Redis-backed.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  /** Key extractor. Default: IP. */
  keyFn?: (req: Request) => string;
  message?: string;
}

export function rateLimit(options: RateLimitOptions): RequestHandler {
  const { windowMs, maxRequests, keyFn = defaultKey, message = 'Demasiadas solicitudes' } = options;
  // Periodic cleanup of expired entries (every 5 min)
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  cleanup.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyFn(req);
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt <= now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(maxRequests - 1));
      next();
      return;
    }

    entry.count += 1;
    const remaining = Math.max(0, maxRequests - entry.count);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > maxRequests) {
      res.status(429).json({ error: message, retryAfter: Math.ceil((entry.resetAt - now) / 1000) });
      return;
    }
    next();
  };
}

function defaultKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Headers de seguridad HTTP (defensa en profundidad).
 * No requiere dependencias externas; equivalente a helmet() para los
 * headers más comunes.
 */
export function securityHeaders(): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction): void => {
    // Prevent MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Enable browser XSS filtering (legacy, but harmless)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Restrict browser features
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    // HSTS (1 year; only meaningful over HTTPS)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  };
}

export const jsonBodyLimit = MAX_JSON_BODY;
export const fileSizeLimit = MAX_FILE_SIZE;
