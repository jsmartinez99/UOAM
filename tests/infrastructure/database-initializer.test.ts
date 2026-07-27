/**
 * Tests para database-initializer.ts
 *
 * Cubre: patrón Singleton, ensureInitialized, ensureSeeded, isDatabaseInitialized
 */
import { describe, it, expect } from 'vitest';
import { DatabaseInitializer, databaseInitializer } from '../../src/infrastructure/database/database-initializer';
import { AppDataSource } from '../../src/infrastructure/database/data-source';
import { UserEntity } from '../../src/infrastructure/database/entities/user.entity';

describe('DatabaseInitializer', () => {
  it('debe inicializar AppDataSource si no está inicializado', async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await AppDataSource.manager.query('SELECT 1');
  });
  it('debe ser un Singleton: getInstance() devuelve la misma instancia', () => {
    const a = DatabaseInitializer.getInstance();
    const b = DatabaseInitializer.getInstance();
    expect(a).toBe(b);
  });

  it('el singleton exportado debe ser la misma instancia', () => {
    expect(databaseInitializer).toBe(DatabaseInitializer.getInstance());
  });

  it('isDatabaseInitialized debe retornar boolean', () => {
    const result = databaseInitializer.isDatabaseInitialized();
    expect(typeof result).toBe('boolean');
  });

  it('ensureInitialized debe resolver sin error', async () => {
    await expect(databaseInitializer.ensureInitialized()).resolves.not.toThrow();
  });

  it('tras ensureInitialized, isDatabaseInitialized debe ser true', async () => {
    await databaseInitializer.ensureInitialized();
    expect(databaseInitializer.isDatabaseInitialized()).toBe(true);
  });

  it('ensureSeeded debe completar incluso sin Qdrant', async () => {
    await expect(databaseInitializer.ensureSeeded()).resolves.not.toThrow();
  });

    it('ensureSeeded debe invocar el seed (verificar usuarios creados)', async () => {
      // Limpiar primero
      await AppDataSource.getRepository(UserEntity).clear();
      await databaseInitializer.ensureSeeded();
      // Forzar flush
      await AppDataSource.manager.query('SELECT 1');
      const users = await AppDataSource.getRepository(UserEntity).find();
      expect(users.length).toBe(3);
    });

  it('ensureSeeded con Qdrant mock debe aceptar el adaptador', async () => {
    const mockQdrant = {
      upsert: async () => undefined,
      search: async () => [],
      ensureCollection: async () => undefined,
    };
    await expect(databaseInitializer.ensureSeeded(mockQdrant as any)).resolves.not.toThrow();
  });
});
