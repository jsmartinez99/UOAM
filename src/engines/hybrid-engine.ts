/**
 * Módulo B: Selección Granular y Matriz Híbrida (Hybrid Engine)
 *
 * Fusiona firmas 6D de múltiples arreglistas y resuelve conflictos
 * de tesitura, instrumentación y textura usando un patrón Strategy.
 *
 * Regla de Negocio principal:
 *   Cuando se mezclan dimensiones incompatibles (ej. voicings graves
 *   con instrumentos agudos), el motor aplica transposición de octava
 *   o sustitución de instrumentos basándose en formantes armónicos.
 */

import { Dimensions6D, DIMENSION_KEYS } from '../domain/arranger-profile.js';

// ─── Tipos del Motor Híbrido ─────────────────────────────────────

export interface MergeInput {
  organology: string[];
  texture: string[];
}

export interface MergedProfile {
  resolvedFeatures: Record<string, string[]>;
  resolutionLog: string[];
}

/** Rango de tesitura estándar por instrumento (MIDI note range simplificado) */
export interface InstrumentRange {
  name: string;
  low: string;   // Nota más grave efectiva
  high: string;  // Nota más aguda efectiva
}

/** Regla de conflicto que el motor puede evaluar y resolver */
export interface ConflictRule {
  /** Condición que detecta el conflicto */
  detect: (input: MergeInput) => boolean;
  /** Acción de resolución que modifica el perfil fusionado */
  resolve: (input: MergeInput) => { resolvedTexture: string[]; log: string };
}

// ─── Reglas de Resolución de Conflictos ──────────────────────────

/**
 * Regla: Flute + Low Close-Voicing
 * La flauta no alcanza registros graves (C2-C3).
 * Resolución: transponer la textura +1 octava a Medium (C4-C5).
 */
const fluteLowVoicingRule: ConflictRule = {
  detect: (input) =>
    input.organology.includes('Flute') &&
    input.texture.some((t) => t.includes('Low Close-Voicing')),
  resolve: (input) => {
    const resolvedTexture = input.texture.map((t) =>
      t.includes('Low Close-Voicing') ? 'Medium Close-Voicing (C4-C5)' : t,
    );
    return {
      resolvedTexture,
      log: 'Conflict resolved: Flute transposed +1 Octave',
    };
  },
};

/**
 * Regla: Piccolo + Low Register Textures
 * El piccolo suena una octava por encima; registros bajos son imposibles.
 * Resolución: transponer a High Register.
 */
const piccoloLowRegisterRule: ConflictRule = {
  detect: (input) =>
    input.organology.includes('Piccolo') &&
    input.texture.some((t) => t.includes('Low')),
  resolve: (input) => {
    const resolvedTexture = input.texture.map((t) =>
      t.includes('Low') ? t.replace('Low', 'High') : t,
    );
    return {
      resolvedTexture,
      log: 'Conflict resolved: Piccolo texture shifted to High register',
    };
  },
};

/**
 * Regla: Tuba + High Close-Voicing
 * La tuba no alcanza registros agudos (C5+).
 * Resolución: transponer la textura -1 octava a Low.
 */
const tubaHighVoicingRule: ConflictRule = {
  detect: (input) =>
    input.organology.includes('Tuba') &&
    input.texture.some((t) => t.includes('High Close-Voicing')),
  resolve: (input) => {
    const resolvedTexture = input.texture.map((t) =>
      t.includes('High Close-Voicing') ? 'Low Close-Voicing (C2-C3)' : t,
    );
    return {
      resolvedTexture,
      log: 'Conflict resolved: Tuba transposed -1 Octave to Low register',
    };
  },
};

// ─── Registro de reglas por defecto ──────────────────────────────

const DEFAULT_CONFLICT_RULES: ConflictRule[] = [
  fluteLowVoicingRule,
  piccoloLowRegisterRule,
  tubaHighVoicingRule,
];

// ─── Motor Híbrido ───────────────────────────────────────────────

export class HybridEngine {
  private readonly rules: ConflictRule[];

  constructor(customRules?: ConflictRule[]) {
    this.rules = customRules ?? DEFAULT_CONFLICT_RULES;
  }

  /**
   * Fusiona features de organología y textura,
   * resolviendo automáticamente los conflictos detectados.
   */
  merge(features: MergeInput): MergedProfile {
    const log: string[] = [];
    let resolvedTexture = [...features.texture];

    for (const rule of this.rules) {
      if (rule.detect({ organology: features.organology, texture: resolvedTexture })) {
        const result = rule.resolve({
          organology: features.organology,
          texture: resolvedTexture,
        });
        resolvedTexture = result.resolvedTexture;
        log.push(result.log);
      }
    }

    return {
      resolvedFeatures: {
        organology: [...features.organology],
        texture: resolvedTexture,
      },
      resolutionLog: log,
    };
  }

  /**
   * Fusiona dos firmas 6D completas, aplicando resolución
   * de conflictos en organología/textura y concatenando
   * el resto de dimensiones.
   */
  mergeFullSignatures(
    signatureA: Dimensions6D,
    signatureB: Dimensions6D,
  ): { merged: Dimensions6D; resolutionLog: string[] } {
    // Combinar organología y textura con resolución de conflictos
    const mergeResult = this.merge({
      organology: [...new Set([...signatureA.organology, ...signatureB.organology])],
      texture: [...new Set([...signatureA.texture, ...signatureB.texture])],
    });

    // Para las demás dimensiones, unión sin duplicados
    const merged: Dimensions6D = {
      organology: mergeResult.resolvedFeatures.organology,
      harmony: [...new Set([...signatureA.harmony, ...signatureB.harmony])],
      counterpoint: [...new Set([...signatureA.counterpoint, ...signatureB.counterpoint])],
      texture: mergeResult.resolvedFeatures.texture,
      rhythm: [...new Set([...signatureA.rhythm, ...signatureB.rhythm])],
      taste: [...new Set([...signatureA.taste, ...signatureB.taste])],
    };

    return { merged, resolutionLog: mergeResult.resolutionLog };
  }
}
