import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { rateLimit, securityHeaders } from '../../src/backend/security';

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' } as never,
    ...overrides,
  } as Request;
}

function createMockRes() {
  const headers: Record<string, string> = {};
  const res: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn>; setHeader: ReturnType<typeof vi.fn>; getHeader: (k: string) => string | undefined } = {
    status: vi.fn(),
    json: vi.fn(),
    setHeader: vi.fn((k: string, v: string) => {
      headers[k] = v;
      return res;
    }),
    getHeader: (k: string) => headers[k],
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

describe('Security Middleware', () => {
  describe('securityHeaders', () => {
    it('añade headers defensivos a la respuesta', () => {
      const middleware = securityHeaders();
      const res = createMockRes();
      const next = vi.fn();
      middleware(createMockReq(), res as unknown as Response, next as NextFunction);

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', expect.stringContaining('geolocation=()'));
      expect(res.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', expect.stringContaining('max-age=31536000'));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('rateLimit', () => {
    it('permite la primera solicitud', () => {
      const middleware = rateLimit({ windowMs: 60_000, maxRequests: 3 });
      const res = createMockRes();
      const next = vi.fn();
      middleware(createMockReq({ ip: '1.2.3.4' }), res as unknown as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res.getHeader('X-RateLimit-Limit')).toBe('3');
      expect(res.getHeader('X-RateLimit-Remaining')).toBe('2');
    });

    it('bloquea después de maxRequests y devuelve 429', () => {
      const middleware = rateLimit({ windowMs: 60_000, maxRequests: 2 });
      const next = vi.fn();

      // 2 permits
      middleware(createMockReq({ ip: '5.6.7.8' }), createMockRes() as unknown as Response, next as NextFunction);
      middleware(createMockReq({ ip: '5.6.7.8' }), createMockRes() as unknown as Response, next as NextFunction);
      expect(next).toHaveBeenCalledTimes(2);

      // 3rd bloquea
      const res3 = createMockRes();
      const next3 = vi.fn();
      middleware(createMockReq({ ip: '5.6.7.8' }), res3 as unknown as Response, next3 as NextFunction);
      expect(res3.status).toHaveBeenCalledWith(429);
      expect(res3.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Demasiadas solicitudes' }),
      );
      expect(next3).not.toHaveBeenCalled();
    });

    it('aísla por IP: diferentes IPs tienen contadores independientes', () => {
      const middleware = rateLimit({ windowMs: 60_000, maxRequests: 1 });
      const next = vi.fn();

      middleware(createMockReq({ ip: '1.1.1.1' }), createMockRes() as unknown as Response, next as NextFunction);
      middleware(createMockReq({ ip: '2.2.2.2' }), createMockRes() as unknown as Response, next as NextFunction);
      expect(next).toHaveBeenCalledTimes(2);
    });
  });
});
