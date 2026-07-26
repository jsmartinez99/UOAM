/**
 * Módulo A: Catálogo Mundial y Firma Hexadimensional (Core Domain)
 *
 * Cada perfil de arreglista es una entidad raíz inmutable compuesta
 * por una Firma de 6 Dimensiones (6D Signature).
 *
 * Arquitectura: Hexagonal (Ports & Adapters) — esta es la capa de dominio pura,
 * sin dependencias de infraestructura.
 */
/** Claves válidas de la firma 6D */
export const DIMENSION_KEYS = [
    'organology',
    'harmony',
    'counterpoint',
    'texture',
    'rhythm',
    'taste',
];
// ─── Domain Errors ───────────────────────────────────────────────
export class DomainValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DomainValidationError';
    }
}
// ─── Aggregate Root ──────────────────────────────────────────────
/**
 * Entidad raíz del Bounded Context "Catálogo de Arreglistas".
 *
 * Invariantes:
 *  - La firma 6D debe estar completa (las 6 dimensiones presentes).
 *  - Cada dimensión debe ser un array no vacío.
 *  - El nombre no puede estar vacío.
 *  - Una vez creado, el perfil es inmutable (readonly).
 */
export class ArrangerProfile {
    name;
    dimensions;
    id;
    constructor(name, dimensions, id) {
        this.name = name;
        this.dimensions = dimensions;
        this.validateName(name);
        this.validateSignature(dimensions);
        this.id = id ?? crypto.randomUUID();
    }
    // ── Validaciones de dominio ──
    validateName(name) {
        if (!name || name.trim().length === 0) {
            throw new DomainValidationError('Dominio Inválido: El nombre del arreglista no puede estar vacío');
        }
    }
    validateSignature(dim) {
        for (const key of DIMENSION_KEYS) {
            if (!dim[key] || !Array.isArray(dim[key]) || dim[key].length === 0) {
                throw new DomainValidationError(`Dominio Inválido: La firma 6D debe estar completa. Falla en: ${key}`);
            }
        }
    }
    // ── Queries de dominio ──
    /** Devuelve la firma 6D como vector plano para indexación */
    toDimensionSummary() {
        const summary = {};
        for (const key of DIMENSION_KEYS) {
            summary[key] = this.dimensions[key].length;
        }
        return summary;
    }
    /** Compara si dos perfiles comparten al menos N dimensiones idénticas */
    sharesSignatureWith(other, minShared = 1) {
        let shared = 0;
        for (const key of DIMENSION_KEYS) {
            const intersection = this.dimensions[key].filter((v) => other.dimensions[key].includes(v));
            if (intersection.length > 0)
                shared++;
        }
        return shared >= minShared;
    }
}
//# sourceMappingURL=arranger-profile.js.map