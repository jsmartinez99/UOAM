/**
 * Tests TDD — Módulo E: Gestión de Usuarios e Infraestructura (Identity & RBAC)
 *
 * Ciclo: RED → GREEN → REFACTOR
 * Verifica registro, autorización RBAC y validaciones de seguridad.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  UserService,
  InvalidEmailError,
  WeakPasswordError,
  UnauthorizedError,
  DuplicateEmailError,
} from '../../src/services/user.service';

// ─── Suite ───────────────────────────────────────────────────────

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  // ── Test original del spec (Fase Roja) ──

  it('debe rechazar el registro si el email tiene un formato inválido', async () => {
    await expect(service.registerUser('bad-email', 'SecurePass123!')).rejects.toThrow(
      InvalidEmailError,
    );
  });

  // ── Validación de email ──

  it('debe rechazar emails vacíos', async () => {
    await expect(service.registerUser('', 'ValidPass123!')).rejects.toThrow(
      InvalidEmailError,
    );
  });

  it('debe rechazar emails sin dominio', async () => {
    await expect(service.registerUser('user@', 'ValidPass123!')).rejects.toThrow(
      InvalidEmailError,
    );
  });

  it('debe rechazar emails sin @', async () => {
    await expect(service.registerUser('user.example.com', 'ValidPass123!')).rejects.toThrow(
      InvalidEmailError,
    );
  });

  it('debe normalizar emails a minúsculas', async () => {
    const user = await service.registerUser('USER@EXAMPLE.COM', 'ValidPass123!');
    expect(user.email).toBe('user@example.com');
  });

  // ── Validación de contraseña ──

  it('debe rechazar contraseñas con menos de 8 caracteres', async () => {
    await expect(service.registerUser('user@example.com', 'Short1!')).rejects.toThrow(
      WeakPasswordError,
    );
  });

  it('debe rechazar contraseñas sin mayúsculas', async () => {
    await expect(service.registerUser('user@example.com', 'nouppercase1!')).rejects.toThrow(
      WeakPasswordError,
    );
  });

  it('debe rechazar contraseñas sin minúsculas', async () => {
    await expect(service.registerUser('user@example.com', 'NOLOWER1!')).rejects.toThrow(
      WeakPasswordError,
    );
  });

  it('debe rechazar contraseñas sin números', async () => {
    await expect(service.registerUser('user@example.com', 'NoNumber!')).rejects.toThrow(
      WeakPasswordError,
    );
  });

  it('debe rechazar contraseñas sin caracteres especiales', async () => {
    await expect(service.registerUser('user@example.com', 'NoSpecial123')).rejects.toThrow(
      WeakPasswordError,
    );
  });

  // ── Registro exitoso ──

  it('debe registrar un usuario con rol STANDARD por defecto', async () => {
    const user = await service.registerUser('user@example.com', 'ValidPass123!');

    expect(user.email).toBe('user@example.com');
    expect(user.role).toBe('STANDARD');
    expect(user.id).toBeDefined();
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('debe permitir registrar usuarios con roles válidos', async () => {
    const admin = await service.registerUser('admin@example.com', 'AdminPass123!', 'ADMIN');
    expect(admin.role).toBe('ADMIN');

    const arranger = await service.registerUser(
      'arranger@example.com',
      'ArrangerPass123!',
      'ARRANGER',
    );
    expect(arranger.role).toBe('ARRANGER');
  });

  // ── Evitar duplicados ──

  it('debe rechazar registros con emails duplicados (case-insensitive)', async () => {
    await service.registerUser('user@example.com', 'FirstPass123!');

    await expect(
      service.registerUser('USER@EXAMPLE.COM', 'SecondPass123!'),
    ).rejects.toThrow(DuplicateEmailError);
  });

  // ── Búsqueda ──

  it('debe encontrar usuarios por email', async () => {
    await service.registerUser('findme@example.com', 'FindMe123!');

    const found = service.findByEmail('findme@example.com');
    expect(found).toBeDefined();
    expect(found?.email).toBe('findme@example.com');
  });

  it('debe devolver undefined para emails no registrados', () => {
    expect(service.findByEmail('nonexistent@example.com')).toBeUndefined();
  });

  // ── Autorización RBAC ──

  describe('RBAC Authorization', () => {
    it('debe permitir acciones a roles autorizados', () => {
      expect(service.authorize('STANDARD', 'catalog:read')).toBe(true);
      expect(service.authorize('ARRANGER', 'hybrid:execute')).toBe(true);
      expect(service.authorize('ADMIN', 'users:manage')).toBe(true);
    });

    it('debe rechazar acciones a roles no autorizados', () => {
      expect(() => service.authorize('STANDARD', 'catalog:write')).toThrow(UnauthorizedError);
      expect(() => service.authorize('ARRANGER', 'users:manage')).toThrow(UnauthorizedError);
    });

    it('debe rechazar acciones desconocidas', () => {
      expect(() => service.authorize('ADMIN', 'unknown:action')).toThrow(
        'Acción desconocida',
      );
    });

    it('debe permitir acciones a ADMIN para cualquier operación', () => {
      expect(service.authorize('ADMIN', 'catalog:read')).toBe(true);
      expect(service.authorize('ADMIN', 'system:config')).toBe(true);
    });
  });
});
