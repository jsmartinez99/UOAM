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
export declare class HybridEngine {
    private readonly ruleEngine;
    private readonly astBuilder;
    constructor();
    merge(features: MergeInput): MergedProfile;
    mergeFullSignatures(signatureA: Dimensions6D, signatureB: Dimensions6D): {
        merged: Dimensions6D;
        resolutionLog: string[];
    };
}
//# sourceMappingURL=hybrid-engine.d.ts.map