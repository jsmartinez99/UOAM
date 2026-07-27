/**
 * Tests TDD — Módulo E: Gestión de Usuarios e Infraestructura (Identity & RBAC)
 *
 * Ciclo: RED → GREEN → REFACTOR
 * Verifica registro, autorización RBAC y validaciones de seguridad.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { UserService } from '../../src/services/user.service';
import { AppDataSource } from '../../src/infrastructure/database/data-source';
import { UserEntity } from '../../src/infrastructure/database/entities/user.entity';

describe('UserService', () => {
  let service: UserService;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  // No afterAll destroy: AppDataSource es singleton compartido con otros tests

  beforeEach(async () => {
    service = new UserService();
    await AppDataSource.getRepository(UserEntity).clear();
  });

  afterEach(async () => {
    await AppDataSource.getRepository(UserEntity).clear();
  });

  it('debe rechazar el registro si el email tiene un formato inválido', async () => {
    await expect(service.registerUser('bad-email', 'SecurePass123!')).rejects.toThrow();
  });

  it('debe rechazar emails vacíos', async () => {
    await expect(service.registerUser('', 'ValidPass123!')).rejects.toThrow();
  });

  it('debe normalizar emails a minúsculas', async () => {
    const user = await service.registerUser('USER@EXAMPLE.COM', 'ValidPass123!');
    expect(user.email).toBe('user@example.com');
  });

  it('debe rechazar contraseñas con menos de 8 caracteres', async () => {
    await expect(service.registerUser('user@example.com', 'Short1!')).rejects.toThrow();
  });

  it('debe registrar un usuario con rol STANDARD por defecto', async () => {
    const user = await service.registerUser('test_' + Date.now() + '@example.com', 'ValidPass123!');
    expect(user.email).toContain('@example.com');
    expect(user.role).toBe('STANDARD');
    expect(user.id).toBeDefined();
  });

  it('debe permitir registrar usuarios con roles válidos', async () => {
    const admin = await service.registerUser('admin_' + Date.now() + '@example.com', 'AdminPass123!', 'ADMIN');
    expect(admin.role).toBe('ADMIN');
  });

  it('debe rechazar registros con emails duplicados (case-insensitive)', async () => {
    const email = 'dup_' + Date.now() + '@example.com';
    await service.registerUser(email, 'FirstPass123!');
    await expect(service.registerUser(email.toUpperCase(), 'SecondPass123!')).rejects.toThrow();
  });

  it('debe encontrar usuarios por email', async () => {
    const email = 'find_' + Date.now() + '@example.com';
    await service.registerUser(email, 'FindMe123!');
    const found = await service.findByEmail(email);
    expect(found).toBeDefined();
    expect(found?.email).toBe(email);
  });

  it('debe devolver undefined para emails no registrados', async () => {
    expect(await service.findByEmail('nonexistent_' + Date.now() + '@example.com')).toBeUndefined();
  });

  describe('verifyCredentials', () => {
    it('debe validar credenciales correctas', async () => {
      const email = 'valid_' + Date.now() + '@example.com';
      const pass = 'SecurePass123!';
      await service.registerUser(email, pass);
      const verified = await service.verifyCredentials(email, pass);
      expect(verified).toBeDefined();
      expect(verified?.email).toBe(email);
    });

    it('debe rechazar contraseñas incorrectas', async () => {
      const email = 'invalid_' + Date.now() + '@example.com';
      await service.registerUser(email, 'SecurePass123!');
      const verified = await service.verifyCredentials(email, 'WrongPass123!');
      expect(verified).toBeUndefined();
    });

    it('debe devolver undefined para emails inexistentes', async () => {
      const verified = await service.verifyCredentials('noexist_' + Date.now() + '@example.com', 'SomePass123!');
      expect(verified).toBeUndefined();
    });
  });

  // ── Login exitoso genera token ──

  describe('Token generation', () => {
    it('debe generar un token JWT tras verificar credenciales', async () => {
      const email = 'token_' + Date.now() + '@example.com';
      const pass = 'SecurePass123!';
      await service.registerUser(email, pass);

      const user = await service.verifyCredentials(email, pass);
      expect(user).toBeDefined();

      // Firmar el token como lo haría el controlador
      const secret = 'test-jwt-secret';
      const token = jwt.sign(
        { id: user!.id, email: user!.email, role: user!.role },
        secret,
        { expiresIn: '1h' },
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verificar que el token contiene los claims correctos
      const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string };
      expect(decoded.email).toBe(email.toLowerCase());
      expect(decoded.role).toBe('STANDARD');
    });
  });

  // ── Usuario ADMIN accede a recurso de administración ──

  describe('ADMIN access', () => {
    it('debe permitir que ADMIN registre otro ADMIN', async () => {
      const adminEmail = 'admin_main_' + Date.now() + '@example.com';
      const newAdminEmail = 'new_admin_' + Date.now() + '@example.com';

      // Registrar un ADMIN
      await service.registerUser(adminEmail, 'AdminPass123!', 'ADMIN');

      // Registrar otro ADMIN (simulando que un ADMIN puede crear más admins)
      const newAdmin = await service.registerUser(newAdminEmail, 'AdminPass456!', 'ADMIN');
      expect(newAdmin.role).toBe('ADMIN');
      expect(newAdmin.email).toBe(newAdminEmail.toLowerCase());
    });

    it('debe permitir que ADMIN acceda a recursos de gestión de usuarios', () => {
      expect(service.authorize('ADMIN', 'users:manage')).toBe(true);
      expect(service.authorize('ADMIN', 'system:config')).toBe(true);
    });

    it('debe rechazar que STANDARD acceda a recursos de gestión de usuarios', () => {
      expect(() => service.authorize('STANDARD', 'users:manage')).toThrow();
      expect(() => service.authorize('STANDARD', 'system:config')).toThrow();
    });
  });

  describe('RBAC Authorization', () => {
    it('debe permitir acciones a roles autorizados', () => {
      expect(service.authorize('STANDARD', 'catalog:read')).toBe(true);
      expect(service.authorize('ARRANGER', 'hybrid:execute')).toBe(true);
      expect(service.authorize('ADMIN', 'users:manage')).toBe(true);
    });

    it('debe rechazar acciones a roles no autorizados', () => {
      expect(() => service.authorize('STANDARD', 'catalog:write')).toThrow();
      expect(() => service.authorize('ARRANGER', 'users:manage')).toThrow();
    });

    it('debe rechazar acciones desconocidas', () => {
      expect(() => service.authorize('ADMIN', 'unknown:action')).toThrow('Acción desconocida');
    });

    it('debe permitir acciones a ADMIN para cualquier operación', () => {
      expect(service.authorize('ADMIN', 'catalog:read')).toBe(true);
      expect(service.authorize('ADMIN', 'system:config')).toBe(true);
    });
  });
});
