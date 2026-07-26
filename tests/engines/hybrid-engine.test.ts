/**
 * Tests TDD — Módulo B: Selección Granular y Matriz Híbrida
 *
 * Ciclo: RED → GREEN → REFACTOR
 * Verifica resolución de conflictos de tesitura e instrumentación.
 */
import { describe, it, expect } from 'vitest';
import { HybridEngine, ConflictRule } from '../../src/engines/hybrid-engine';
import { Dimensions6D } from '../../src/domain/arranger-profile';

// ─── Suite ───────────────────────────────────────────────────────

describe('Hybrid Engine - Conflict Resolution', () => {
  // ── Test original del spec (Fase Roja) ──

  it('debe resolver conflictos de tesitura transponiendo la octava (Octave Displacement)', () => {
    const engine = new HybridEngine();

    // Conflicto: Voicings cerrados graves (Duke) + Flautas (que no llegan a ese registro)
    const hybridProfile = engine.merge({
      organology: ['Flute'],
      texture: ['Low Close-Voicing (C2-C3)'],
    });

    expect(hybridProfile.resolutionLog).toContain('Conflict resolved: Flute transposed +1 Octave');
    expect(hybridProfile.resolvedFeatures.texture).toContain('Medium Close-Voicing (C4-C5)');
  });

  // ── Sin conflictos ──

  it('no debe modificar la textura si no hay conflictos', () => {
    const engine = new HybridEngine();

    const result = engine.merge({
      organology: ['Violin'],
      texture: ['Medium Close-Voicing (C4-C5)'],
    });

    expect(result.resolutionLog).toHaveLength(0);
    expect(result.resolvedFeatures.texture).toEqual(['Medium Close-Voicing (C4-C5)']);
  });

  // ── Piccolo + Low Register ──

  it('debe transponer a High register cuando se usa Piccolo con texturas graves', () => {
    const engine = new HybridEngine();

    const result = engine.merge({
      organology: ['Piccolo'],
      texture: ['Low Open-Voicing (C2-C3)'],
    });

    expect(result.resolutionLog).toContain(
      'Conflict resolved: Piccolo texture shifted to High register',
    );
    expect(result.resolvedFeatures.texture).toContain('High Open-Voicing (C2-C3)');
  });

  // ── Tuba + High Register ──

  it('debe transponer a Low register cuando se usa Tuba con voicings agudos', () => {
    const engine = new HybridEngine();

    const result = engine.merge({
      organology: ['Tuba'],
      texture: ['High Close-Voicing (C5-C6)'],
    });

    expect(result.resolutionLog).toContain(
      'Conflict resolved: Tuba transposed -1 Octave to Low register',
    );
    expect(result.resolvedFeatures.texture).toContain('Low Close-Voicing (C2-C3)');
  });

  // ── Múltiples conflictos simultáneos ──

  it('debe resolver múltiples conflictos en secuencia', () => {
    const engine = new HybridEngine();

    const result = engine.merge({
      organology: ['Flute', 'Tuba'],
      texture: ['Low Close-Voicing (C2-C3)', 'High Close-Voicing (C5-C6)'],
    });

    expect(result.resolutionLog.length).toBeGreaterThanOrEqual(2);
  });

  // ── Organología preservada ──

  it('debe preservar la lista de instrumentos original sin modificar', () => {
    const engine = new HybridEngine();

    const result = engine.merge({
      organology: ['Flute', 'Oboe', 'Clarinet'],
      texture: ['Low Close-Voicing (C2-C3)'],
    });

    expect(result.resolvedFeatures.organology).toEqual(['Flute', 'Oboe', 'Clarinet']);
  });

  // ── Reglas customizadas (extensibilidad via Strategy) ──

  it('debe aceptar reglas de conflicto personalizadas', () => {
    const customRule: ConflictRule = {
      detect: (input) =>
        input.organology.includes('Harp') && input.texture.some((t) => t.includes('Staccato')),
      resolve: (input) => ({
        resolvedTexture: input.texture.map((t) =>
          t.includes('Staccato') ? t.replace('Staccato', 'Arpeggiated') : t,
        ),
        log: 'Conflict resolved: Harp cannot staccato, converted to Arpeggiated',
      }),
    };

    const engine = new HybridEngine([customRule]);

    const result = engine.merge({
      organology: ['Harp'],
      texture: ['Staccato Block Chords'],
    });

    expect(result.resolutionLog).toContain(
      'Conflict resolved: Harp cannot staccato, converted to Arpeggiated',
    );
    expect(result.resolvedFeatures.texture).toContain('Arpeggiated Block Chords');
  });

  // ── Fusión completa de firmas 6D ──

  it('debe fusionar dos firmas 6D completas sin duplicados', () => {
    const engine = new HybridEngine();

    const sigA: Dimensions6D = {
      organology: ['Strings', 'Flute'],
      harmony: ['Extended chords'],
      counterpoint: ['Oblique motion'],
      texture: ['Low Close-Voicing (C2-C3)'],
      rhythm: ['Bossa nova'],
      taste: ['The Ogerman Swell'],
    };

    const sigB: Dimensions6D = {
      organology: ['Strings', 'Brass'],
      harmony: ['Quartal voicings'],
      counterpoint: ['Call and response'],
      texture: ['Block chords'],
      rhythm: ['Swing feel'],
      taste: ['Brass falls'],
    };

    const result = engine.mergeFullSignatures(sigA, sigB);

    // Sin duplicados en organology
    expect(result.merged.organology).toContain('Strings');
    expect(result.merged.organology).toContain('Flute');
    expect(result.merged.organology).toContain('Brass');

    // Harmony unidas
    expect(result.merged.harmony).toContain('Extended chords');
    expect(result.merged.harmony).toContain('Quartal voicings');

    // Taste unidas
    expect(result.merged.taste).toContain('The Ogerman Swell');
    expect(result.merged.taste).toContain('Brass falls');

    // El log debe registrar la resolución Flute + Low
    expect(result.resolutionLog.length).toBeGreaterThan(0);
  });
});
