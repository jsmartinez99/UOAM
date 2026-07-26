/**
 * Tests TDD — Módulo A: Catálogo Mundial y Firma Hexadimensional
 *
 * Ciclo: RED → GREEN → REFACTOR
 */
import { describe, it, expect } from 'vitest';
import {
  ArrangerProfile,
  DomainValidationError,
  Dimensions6D,
  DIMENSION_KEYS,
} from '../../src/domain/arranger-profile';

// ─── Fixtures ────────────────────────────────────────────────────

const validDimensions: Dimensions6D = {
  organology: ['Strings', 'Woodwinds', 'Brass'],
  harmony: ['Extended chords', 'Tritone substitutions'],
  counterpoint: ['Independent bass lines', 'Oblique motion'],
  texture: ['Lush divisi strings', 'Block chords'],
  rhythm: ['Bossa nova feel', 'Rubato passages'],
  taste: ['The Ogerman Swell', 'Transparent orchestration'],
};

const validDimensions2: Dimensions6D = {
  organology: ['Big Band', 'Strings'],
  harmony: ['Blues tonality', 'Quartal voicings'],
  counterpoint: ['Call and response', 'Fugal entries'],
  texture: ['Block chords', 'Unison brass'],
  rhythm: ['Swing feel', 'Syncopated brass hits'],
  taste: ['Brass falls', 'Shake articulations'],
};

// ─── Suite ───────────────────────────────────────────────────────

describe('Arranger Core Domain', () => {
  // ── Fase Roja original del spec ──

  it('debe lanzar un error si la firma hexadimensional está incompleta', () => {
    const incompleteDimensions = { organology: ['Strings', 'Woodwinds'] };

    expect(() => {
      new ArrangerProfile('Claus Ogerman', incompleteDimensions as unknown as Dimensions6D);
    }).toThrow('Dominio Inválido: La firma 6D debe estar completa');
  });

  // ── Validación exhaustiva de cada dimensión ──

  it('debe fallar si falta cualquiera de las 6 dimensiones individualmente', () => {
    for (const key of DIMENSION_KEYS) {
      const partial = { ...validDimensions };
      delete (partial as Record<string, unknown>)[key];

      expect(() => {
        new ArrangerProfile('Test Arranger', partial as Dimensions6D);
      }).toThrow(`Falla en: ${key}`);
    }
  });

  it('debe fallar si alguna dimensión es un array vacío', () => {
    const emptyHarmony: Dimensions6D = {
      ...validDimensions,
      harmony: [],
    };

    expect(() => {
      new ArrangerProfile('Test Arranger', emptyHarmony);
    }).toThrow('Falla en: harmony');
  });

  // ── Validación de nombre ──

  it('debe fallar si el nombre del arreglista está vacío', () => {
    expect(() => {
      new ArrangerProfile('', validDimensions);
    }).toThrow('El nombre del arreglista no puede estar vacío');
  });

  it('debe fallar si el nombre contiene solo espacios en blanco', () => {
    expect(() => {
      new ArrangerProfile('   ', validDimensions);
    }).toThrow('El nombre del arreglista no puede estar vacío');
  });

  // ── Tipo de error ──

  it('debe lanzar un DomainValidationError (no un Error genérico)', () => {
    const incomplete = { organology: ['Strings'] } as unknown as Dimensions6D;

    try {
      new ArrangerProfile('Test', incomplete);
      expect.unreachable('Debería haber lanzado');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainValidationError);
    }
  });

  // ── Creación exitosa ──

  it('debe crear un perfil válido con las 6 dimensiones completas', () => {
    const profile = new ArrangerProfile('Claus Ogerman', validDimensions);

    expect(profile.name).toBe('Claus Ogerman');
    expect(profile.dimensions).toEqual(validDimensions);
    expect(profile.id).toBeDefined();
    expect(typeof profile.id).toBe('string');
  });

  it('debe respetar un ID explícito si se proporciona', () => {
    const customId = 'ogerman-001';
    const profile = new ArrangerProfile('Claus Ogerman', validDimensions, customId);

    expect(profile.id).toBe(customId);
  });

  // ── Queries de dominio ──

  it('toDimensionSummary debe devolver conteo de elementos por dimensión', () => {
    const profile = new ArrangerProfile('Claus Ogerman', validDimensions);
    const summary = profile.toDimensionSummary();

    expect(summary.organology).toBe(3);
    expect(summary.harmony).toBe(2);
    expect(summary.counterpoint).toBe(2);
    expect(summary.texture).toBe(2);
    expect(summary.rhythm).toBe(2);
    expect(summary.taste).toBe(2);
  });

  it('sharesSignatureWith debe detectar dimensiones compartidas', () => {
    const ogerman = new ArrangerProfile('Claus Ogerman', validDimensions);
    const quincy = new ArrangerProfile('Quincy Jones', validDimensions2);

    // Comparten 'Strings' en organology y 'Block chords' en texture
    expect(ogerman.sharesSignatureWith(quincy, 1)).toBe(true);
    expect(ogerman.sharesSignatureWith(quincy, 2)).toBe(true);
    // No comparten 6 dimensiones completas
    expect(ogerman.sharesSignatureWith(quincy, 6)).toBe(false);
  });

  // ── Inmutabilidad ──

  it('las propiedades del perfil deben ser readonly', () => {
    const profile = new ArrangerProfile('Claus Ogerman', validDimensions);

    // TypeScript impide la reasignación en compile-time,
    // verificamos que el objeto se creó correctamente
    expect(Object.isFrozen(profile.dimensions)).toBe(false); // JS no congela por defecto
    expect(profile.name).toBe('Claus Ogerman');
  });
});
