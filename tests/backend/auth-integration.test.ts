import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateToken, authorizeRole } from '../../src/backend/controllers.js';
import type { Request, Response, NextFunction } from 'express';

describe('AuthIntegration', () => {
  const jwtSecret = 'test-jwt-secret';

  function createMockReq(headers: Record<string, string> = {}): Partial<Request> {
    return {
      headers,
      // Express normaliza los headers a minúsculas
      get: (name: string) => headers[name] || headers[name.toLowerCase()],
    } as Partial<Request>;
  }

  function createMockRes(): Partial<Response> {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    return { status, json } as unknown as Partial<Response>;
  }

  function createMockNext(): NextFunction {
    return vi.fn() as unknown as NextFunction;
  }

  const dependencies = {
    qdrantClient: {} as never,
    llmClient: {} as never,
    jwtSecret,
  };

  // ── Login exitoso ──

  it('debe generar un token JWT válido con datos de usuario', () => {
    const payload = { id: '123', email: 'test@example.com', role: 'STANDARD' };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    // Verificar que el token contiene los datos del usuario
    const decoded = jwt.verify(token, jwtSecret) as typeof payload;
    expect(decoded.id).toBe('123');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('STANDARD');
  });

  // ── Acceso a ruta protegida sin token ──

  it('debe rechazar petición sin token (401)', () => {
    const middleware = authenticateToken(dependencies);
    const req = createMockReq({});
    const res = createMockRes();
    const next = createMockNext();

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Token de autenticación requerido' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar petición con token inválido (403)', () => {
    const middleware = authenticateToken(dependencies);
    const req = createMockReq({ authorization: 'Bearer invalid-token-12345' });
    const res = createMockRes();
    const next = createMockNext();

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Token inválido' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe aceptar petición con token válido (pasa a next)', () => {
    const middleware = authenticateToken(dependencies);
    const payload = { id: '123', email: 'test@example.com', role: 'STANDARD' };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    const req = createMockReq({ authorization: `Bearer ${token}` });
    const res = createMockRes();
    const next = createMockNext();

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.email).toBe('test@example.com');
  });

  // ── Autorización RBAC ──

  it('debe permitir acceso a ADMIN en ruta de administración', () => {
    const middleware = authorizeRole('ADMIN');
    const req = { user: { id: '1', email: 'admin@test.com', role: 'ADMIN' } } as Partial<Request>;
    const res = createMockRes();
    const next = createMockNext();

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('debe denegar acceso a STANDARD en ruta de administración (403)', () => {
    const middleware = authorizeRole('ADMIN');
    const req = { user: { id: '1', email: 'user@test.com', role: 'STANDARD' } } as Partial<Request>;
    const res = createMockRes();
    const next = createMockNext();

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('no autorizado') }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe denegar acceso sin autenticación (401)', () => {
    const middleware = authorizeRole('ADMIN');
    const req = { user: undefined } as Partial<Request>;
    const res = createMockRes();
    const next = createMockNext();

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Autenticación requerida' }),
    );
  });
});
