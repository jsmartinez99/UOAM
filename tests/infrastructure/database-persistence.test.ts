import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppDataSource } from '../../src/infrastructure/database/data-source.js';
import { ArrangerProfileEntity } from '../../src/infrastructure/database/entities/arranger-profile.entity.js';
import { ArrangerProfile } from '../../src/domain/arranger-profile.js';

describe('DatabasePersistence (Arranger Profile)', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    // Cleanup test data
    const repo = AppDataSource.getRepository(ArrangerProfileEntity);
    await repo.delete({ name: 'Test Arranger Persistence' });
  });

  // ── Persistencia exitosa de perfil de arreglista ──

  it('debe persistir y recuperar un perfil de arreglista', async () => {
    const profile = new ArrangerProfile('Test Arranger Persistence', {
      organology: ['Flute', 'Violin'],
      harmony: ['Extended chords'],
      counterpoint: ['Oblique motion'],
      texture: ['Low Close-Voicing (C2-C3)'],
      rhythm: ['Bossa nova'],
      taste: ['The Ogerman Swell'],
    });

    const repo = AppDataSource.getRepository(ArrangerProfileEntity);
    const entity = repo.create({
      id: profile.id,
      name: profile.name,
      dimensions: profile.dimensions,
    });
    await repo.save(entity);

    // Recuperar desde la base de datos
    const saved = await repo.findOneBy({ id: profile.id });
    expect(saved).toBeDefined();
    expect(saved!.name).toBe('Test Arranger Persistence');
    expect(saved!.dimensions.organology).toContain('Flute');
    expect(saved!.dimensions.harmony).toContain('Extended chords');
    expect(saved!.dimensions.counterpoint).toContain('Oblique motion');
    expect(saved!.dimensions.texture).toContain('Low Close-Voicing (C2-C3)');
    expect(saved!.dimensions.rhythm).toContain('Bossa nova');
    expect(saved!.dimensions.taste).toContain('The Ogerman Swell');
  });

  it('debe recuperar todos los perfiles del repositorio', async () => {
    const repo = AppDataSource.getRepository(ArrangerProfileEntity);
    const all = await repo.find();

    // Debe haber al menos el perfil que acabamos de insertar
    const existing = all.find(a => a.name === 'Test Arranger Persistence');
    expect(existing).toBeDefined();
    expect(existing!.dimensions.organology).toContain('Flute');
  });
});
