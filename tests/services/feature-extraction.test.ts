import { describe, it, expect } from 'vitest';
import { FeatureExtractionService } from '../../src/services/feature-extraction.service';

describe('FeatureExtractionService', () => {
  it('debe mapear características crudas a firma 6D', () => {
    const service = new FeatureExtractionService();
    const rawFeatures = { format: 'musicxml', data: '...' };
    const signature = service.extract(rawFeatures);
    
    expect(signature).toBeDefined();
    expect(signature.organology).toBeInstanceOf(Array);
    expect(signature.harmony).toBeInstanceOf(Array);
  });

  // ── Embedding generado tras extracción ──

  it('debe generar todas las 6 dimensiones tras la extracción', () => {
    const service = new FeatureExtractionService();
    const rawFeatures = {
      organology: ['Flute', 'Violin'],
      harmony: ['Extended chords'],
      counterpoint: ['Oblique motion'],
      texture: ['Low Close-Voicing (C2-C3)'],
      rhythm: ['Bossa nova'],
      taste: ['The Ogerman Swell'],
    };

    const signature = service.extract(rawFeatures);

    // Las 6 dimensiones deben estar presentes
    expect(signature).toHaveProperty('organology');
    expect(signature).toHaveProperty('harmony');
    expect(signature).toHaveProperty('counterpoint');
    expect(signature).toHaveProperty('texture');
    expect(signature).toHaveProperty('rhythm');
    expect(signature).toHaveProperty('taste');

    // Cada dimensión debe tener al menos un elemento
    expect(signature.organology.length).toBeGreaterThan(0);
    expect(signature.harmony.length).toBeGreaterThan(0);
    expect(signature.counterpoint.length).toBeGreaterThan(0);
    expect(signature.texture.length).toBeGreaterThan(0);
    expect(signature.rhythm.length).toBeGreaterThan(0);
    expect(signature.taste.length).toBeGreaterThan(0);

    // Los valores deben reflejar los datos de entrada
    expect(signature.organology).toContain('Flute');
    expect(signature.taste).toContain('The Ogerman Swell');
  });

  it('debe usar valores por defecto cuando faltan dimensiones en la entrada', () => {
    const service = new FeatureExtractionService();
    const rawFeatures = { format: 'musicxml' };

    const signature = service.extract(rawFeatures);

    // Cada dimensión debe tener un valor por defecto
    expect(signature.organology).toBeInstanceOf(Array);
    expect(signature.harmony).toBeInstanceOf(Array);
    expect(signature.counterpoint).toBeInstanceOf(Array);
    expect(signature.texture).toBeInstanceOf(Array);
    expect(signature.rhythm).toBeInstanceOf(Array);
    expect(signature.taste).toBeInstanceOf(Array);
  });
});
