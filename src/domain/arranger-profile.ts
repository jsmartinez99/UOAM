/**
 * Módulo A: Catálogo Mundial y Firma Hexadimensional (Core Domain)
 *
 * Cada perfil de arreglista es una entidad raíz inmutable compuesta
 * por una Firma de 6 Dimensiones (6D Signature).
 *
 * Arquitectura: Hexagonal (Ports & Adapters) — esta es la capa de dominio pura,
 * sin dependencias de infraestructura.
 */

// ─── Value Objects ───────────────────────────────────────────────

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
export const DIMENSION_KEYS: readonly (keyof Dimensions6D)[] = [
  'organology',
  'harmony',
  'counterpoint',
  'texture',
  'rhythm',
  'taste',
] as const;

// ─── Domain Errors ───────────────────────────────────────────────

export class DomainValidationError extends Error {
  constructor(message: string) {
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
  public readonly id: string;

  constructor(
    public readonly name: string,
    public readonly dimensions: Dimensions6D,
    id?: string,
  ) {
    this.validateName(name);
    this.validateSignature(dimensions);
    this.id = id ?? crypto.randomUUID();
  }

  // ── Validaciones de dominio ──

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new DomainValidationError(
        'Dominio Inválido: El nombre del arreglista no puede estar vacío',
      );
    }
  }

  private validateSignature(dim: Dimensions6D): void {
    for (const key of DIMENSION_KEYS) {
      if (!dim[key] || !Array.isArray(dim[key]) || dim[key].length === 0) {
        throw new DomainValidationError(
          `Dominio Inválido: La firma 6D debe estar completa. Falla en: ${key}`,
        );
      }
    }
  }

  // ── Queries de dominio ──

  /** Devuelve la firma 6D como vector plano para indexación */
  public toDimensionSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const key of DIMENSION_KEYS) {
      summary[key] = this.dimensions[key].length;
    }
    return summary;
  }

  /** Compara si dos perfiles comparten al menos N dimensiones idénticas */
  public sharesSignatureWith(other: ArrangerProfile, minShared: number = 1): boolean {
    let shared = 0;
    for (const key of DIMENSION_KEYS) {
      const intersection = this.dimensions[key].filter((v) =>
        other.dimensions[key].includes(v),
      );
      if (intersection.length > 0) shared++;
    }
    return shared >= minShared;
  }
}
