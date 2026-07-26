/**
 * Módulo A: Catálogo Mundial y Firma Hexadimensional (Core Domain)
 *
 * Cada perfil de arreglista es una entidad raíz inmutable compuesta
 * por una Firma de 6 Dimensiones (6D Signature).
 *
 * Arquitectura: Hexagonal (Ports & Adapters) — esta es la capa de dominio pura,
 * sin dependencias de infraestructura.
 */
/**
 * Las 6 dimensiones técnicas obligatorias que definen
 * la identidad estilística de un arreglista.
 */
export interface Dimensions6D {
    /** Instrumentación, rangos de tesitura efectivos y combinaciones tímbricas */
    organology: string[];
    /** Lenguaje interválico, extensiones, sustituciones, voicings y tensiones */
    harmony: string[];
    /** Movimiento de voces, independencia rítmica y líneas secundarias */
    counterpoint: string[];
    /** Disposición espacial, divisi, acoplamiento y densidad orquestal */
    texture: string[];
    /** Feel, groove, subdivisión, síncopas y métricas predominantes */
    rhythm: string[];
    /** Recursos estilísticos únicos (ej. "The Ogerman Swell") */
    taste: string[];
}
/** Claves válidas de la firma 6D */
export declare const DIMENSION_KEYS: readonly (keyof Dimensions6D)[];
export declare class DomainValidationError extends Error {
    constructor(message: string);
}
/**
 * Entidad raíz del Bounded Context "Catálogo de Arreglistas".
 *
 * Invariantes:
 *  - La firma 6D debe estar completa (las 6 dimensiones presentes).
 *  - Cada dimensión debe ser un array no vacío.
 *  - El nombre no puede estar vacío.
 *  - Una vez creado, el perfil es inmutable (readonly).
 */
export declare class ArrangerProfile {
    readonly name: string;
    readonly dimensions: Dimensions6D;
    readonly id: string;
    constructor(name: string, dimensions: Dimensions6D, id?: string);
    private validateName;
    private validateSignature;
    /** Devuelve la firma 6D como vector plano para indexación */
    toDimensionSummary(): Record<string, number>;
    /** Compara si dos perfiles comparten al menos N dimensiones idénticas */
    sharesSignatureWith(other: ArrangerProfile, minShared?: number): boolean;
}
//# sourceMappingURL=arranger-profile.d.ts.map