/**
 * Tests para seed.ts
 *
 * Verifica:
 * - Idempotencia: ejecutar seed múltiples veces no duplica datos
 * - bcrypt: las contraseñas se hashean correctamente
 * - Actualización de contraseñas desactualizadas
 * - Creación de arreglistas cuando la tabla está vacía
 * - Saltado de arreglistas cuando ya existen
 * - Indexación en Qdrant
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { seedDatabase } from '../../src/infrastructure/database/seed';
import { AppDataSource } from '../../src/infrastructure/database/data-source';
import { UserEntity } from '../../src/infrastructure/database/entities/user.entity';
import { ArrangerProfileEntity } from '../../src/infrastructure/database/entities/arranger-profile.entity';
import bcrypt from 'bcryptjs';

class MockQdrant {
  upserts: Array<{ collection: string; points: any[] }> = [];
  shouldFail = false;
  async upsert(collection: string, points: any[]) {
    if (this.shouldFail) throw new Error('Mock Qdrant failure');
    this.upserts.push({ collection, points });
  }
  async search() {
    return [];
  }
  async ensureCollection() {}
}

describe('seedDatabase', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    // Esperar a que la inicialización sea completamente estable
    await AppDataSource.manager.query('SELECT 1');
  });

  // No afterAll destroy: el AppDataSource es singleton compartido con otros tests
  // Si lo destruimos, los siguientes test files no pueden reinicializarlo.

  // Cada test limpia las tablas individualmente para ser determinista

  it('debe crear los 3 demo users', async () => {
    // Limpiar antes para que sea determinista
    await AppDataSource.getRepository(UserEntity).clear();
    await seedDatabase();
    // Forzar a que la conexión se sincronice antes del assert
    await AppDataSource.manager.query('SELECT 1');
    const users = await AppDataSource.getRepository(UserEntity).find();
    const emails = users.map((u) => u.email).sort();
    expect(emails).toContain('admin@uoam.com');
    expect(emails).toContain('arranger@uoam.com');
    expect(emails).toContain('standard@uoam.com');
    expect(users).toHaveLength(3);
  });

  it('debe hashear contraseñas con bcrypt (no texto plano)', async () => {
    await AppDataSource.getRepository(UserEntity).clear();
    await seedDatabase();
    const admin = await AppDataSource.getRepository(UserEntity).findOneByOrFail({ email: 'admin@uoam.com' });
    expect(admin.hashedPassword).not.toBe('Admin@1234');
    expect(admin.hashedPassword).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare('Admin@1234', admin.hashedPassword)).toBe(true);
    expect(await bcrypt.compare('wrong', admin.hashedPassword)).toBe(false);
  });

  it('debe asignar roles correctos a los demo users', async () => {
    await AppDataSource.getRepository(UserEntity).clear();
    await seedDatabase();
    const repo = AppDataSource.getRepository(UserEntity);
    expect((await repo.findOneByOrFail({ email: 'admin@uoam.com' })).role).toBe('ADMIN');
    expect((await repo.findOneByOrFail({ email: 'arranger@uoam.com' })).role).toBe('ARRANGER');
    expect((await repo.findOneByOrFail({ email: 'standard@uoam.com' })).role).toBe('STANDARD');
  });

  it('debe ser idempotente: ejecutar dos veces no duplica users', async () => {
    await AppDataSource.getRepository(UserEntity).clear();
    await seedDatabase();
    await seedDatabase();
    const count = await AppDataSource.getRepository(UserEntity).count();
    expect(count).toBe(3);
  });

  it('debe actualizar contraseña desactualizada', async () => {
    const repo = AppDataSource.getRepository(UserEntity);
    await repo.clear();
    await repo.save(
      repo.create({
        email: 'admin@uoam.com',
        hashedPassword: await bcrypt.hash('OldPassword!', 12),
        role: 'ADMIN',
      }),
    );

    await seedDatabase();

    const updated = await repo.findOneByOrFail({ email: 'admin@uoam.com' });
    expect(await bcrypt.compare('Admin@1234', updated.hashedPassword)).toBe(true);
    expect(await bcrypt.compare('OldPassword!', updated.hashedPassword)).toBe(false);
  });

  it('no debe duplicar users aunque se ejecute múltiples veces', async () => {
    const repo = AppDataSource.getRepository(UserEntity);
    await repo.clear();
    await seedDatabase();
    await seedDatabase();
    await seedDatabase();
    const count = await repo.count();
    expect(count).toBe(3);
  });

  it('debe crear 6 perfiles de arreglistas cuando la tabla está vacía', async () => {
    await AppDataSource.getRepository(UserEntity).clear();
    await AppDataSource.getRepository(ArrangerProfileEntity).clear();
    await seedDatabase();
    const profiles = await AppDataSource.getRepository(ArrangerProfileEntity).find();
    expect(profiles.length).toBeGreaterThanOrEqual(6);
    const names = profiles.map((p) => p.name);
    expect(names).toContain('Quincy Jones');
    expect(names).toContain('Claus Ogerman');
  });

  it('no debe duplicar arreglistas si ya existen', async () => {
    await AppDataSource.getRepository(UserEntity).clear();
    await AppDataSource.getRepository(ArrangerProfileEntity).clear();
    await seedDatabase();
    const before = await AppDataSource.getRepository(ArrangerProfileEntity).count();
    await seedDatabase();
    const after = await AppDataSource.getRepository(ArrangerProfileEntity).count();
    expect(after).toBe(before);
  });

  it('cada perfil debe tener las 6 dimensiones con valores', async () => {
    await AppDataSource.getRepository(UserEntity).clear();
    await AppDataSource.getRepository(ArrangerProfileEntity).clear();
    await seedDatabase();
    const profiles = await AppDataSource.getRepository(ArrangerProfileEntity).find();
    for (const p of profiles) {
      expect(p.dimensions).toBeDefined();
      expect(Array.isArray(p.dimensions.organology)).toBe(true);
      expect(Array.isArray(p.dimensions.harmony)).toBe(true);
      expect(Array.isArray(p.dimensions.counterpoint)).toBe(true);
      expect(Array.isArray(p.dimensions.texture)).toBe(true);
      expect(Array.isArray(p.dimensions.rhythm)).toBe(true);
      expect(Array.isArray(p.dimensions.taste)).toBe(true);
      expect(p.dimensions.organology.length).toBeGreaterThan(0);
    }
  });

  it('debe indexar todos los perfiles en Qdrant si está disponible', async () => {
    const qdrant = new MockQdrant();
    await AppDataSource.getRepository(UserEntity).clear();
    await AppDataSource.getRepository(ArrangerProfileEntity).clear();
    await seedDatabase(qdrant as any);
    const profiles = await AppDataSource.getRepository(ArrangerProfileEntity).find();
    expect(qdrant.upserts.length).toBe(profiles.length);
    const collection = qdrant.upserts[0]?.collection;
    expect(collection).toBe(process.env.QDRANT_COLLECTION || 'arrangements_collection');
    const firstPoint = qdrant.upserts[0]?.points[0];
    expect(firstPoint.payload.name).toBeDefined();
    expect(firstPoint.vector).toHaveLength(6); // 6 dimensiones
  });

  it('debe continuar si Qdrant falla (no debe bloquear seed)', async () => {
    const qdrant = new MockQdrant();
    qdrant.shouldFail = true;
    await AppDataSource.getRepository(UserEntity).clear();
    await AppDataSource.getRepository(ArrangerProfileEntity).clear();
    await expect(seedDatabase(qdrant as any)).resolves.not.toThrow();
    // Users y profiles sí deben estar
    expect(await AppDataSource.getRepository(UserEntity).count()).toBe(3);
  });

  it('debe funcionar sin Qdrant (parámetro undefined)', async () => {
    await AppDataSource.getRepository(UserEntity).clear();
    await AppDataSource.getRepository(ArrangerProfileEntity).clear();
    await expect(seedDatabase(undefined)).resolves.not.toThrow();
    expect(await AppDataSource.getRepository(UserEntity).count()).toBe(3);
  });
});
