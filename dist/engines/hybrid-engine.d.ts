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
import { Dimensions6D } from '../domain/arranger-profile.js';
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
    low: string;
    high: string;
}
/** Regla de conflicto que el motor puede evaluar y resolver */
export interface ConflictRule {
    /** Condición que detecta el conflicto */
    detect: (input: MergeInput) => boolean;
    /** Acción de resolución que modifica el perfil fusionado */
    resolve: (input: MergeInput) => {
        resolvedTexture: string[];
        log: string;
    };
}
export declare class HybridEngine {
    private readonly rules;
    constructor(customRules?: ConflictRule[]);
    /**
     * Fusiona features de organología y textura,
     * resolviendo automáticamente los conflictos detectados.
     */
    merge(features: MergeInput): MergedProfile;
    /**
     * Fusiona dos firmas 6D completas, aplicando resolución
     * de conflictos en organología/textura y concatenando
     * el resto de dimensiones.
     */
    mergeFullSignatures(signatureA: Dimensions6D, signatureB: Dimensions6D): {
        merged: Dimensions6D;
        resolutionLog: string[];
    };
}
//# sourceMappingURL=hybrid-engine.d.ts.map