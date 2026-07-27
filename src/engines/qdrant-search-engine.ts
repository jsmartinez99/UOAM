/**
 * Módulo C: Motor de Búsqueda Semántica (Qdrant Adapter)
 *
 * Las firmas 6D se vectorizan y almacenan en Qdrant.
 * El motor procesa obras de entrada extrayendo embeddings
 * para realizar búsqueda KNN, devolviendo un "Confidence Score"
 * de atribución estilística.
 *
 * Patrón: Ports & Adapters — inyectamos el cliente vectorial
 * para facilitar el testing con mocks.
 */

import { VectorDatabaseClient } from '../ports/vector-database.port.js';

// ─── Tipos del Motor Semántico ───────────────────────────────────

export interface SearchResult {
  /** Nombre o identificador del arreglista encontrado. */
  arranger: string;
  /** Score de similitud coseno (0-1, mayor = más similar). */
  score: number;
  /** Dimensión 6D que más contribuyó a la similitud. */
  matchedDimension?: string;
}

/**
 * Reporte de atribución estilística: top match + confidence + candidatos.
 * `confidence` se calcula con base en el score del top match y los thresholds
 * HIGH (0.85), MEDIUM (0.7), LOW (0.5), NONE (< 0.5).
 */
export interface AttributionReport {
  topMatch: SearchResult | null;
  candidates: SearchResult[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  totalCandidates: number;
}

// ─── Constantes ──────────────────────────────────────────────────

const DEFAULT_COLLECTION = 'arrangements_collection';
const DEFAULT_LIMIT = 5;

const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.7,
  LOW: 0.5,
} as const;

// ─── Motor de Búsqueda ──────────────────────────────────────────

export class QdrantSearchEngine {
  constructor(
    private readonly qdrantClient: VectorDatabaseClient,
    private readonly collectionName: string = DEFAULT_COLLECTION,
  ) {}

  /**
   * Busca arreglistas similares dado un vector de features.
   * Filtra resultados por umbral de score mínimo.
   */
  async searchSimilar(
    features: number[],
    threshold: number = CONFIDENCE_THRESHOLDS.LOW,
  ): Promise<SearchResult[]> {
    if (!features || features.length === 0) {
      throw new Error('Vector de features vacío: no se puede realizar búsqueda');
    }

    const response = await this.qdrantClient.search(this.collectionName, {
      vector: features,
      limit: DEFAULT_LIMIT,
    });

    return response
      .filter((hit) => hit.score >= threshold)
      .map((hit) => {
        const payload = hit.payload as Record<string, unknown> | null | undefined;
        const arranger =
          (payload && typeof payload.name === 'string' && payload.name) ||
          (typeof hit.payload === 'string' ? hit.payload : null) ||
          (payload && typeof payload.id === 'string' ? payload.id : null) ||
          'Unknown';
        return {
          arranger,
          score: hit.score,
          matchedDimension: typeof payload?.matchedDimension === 'string' ? payload.matchedDimension : undefined,
        };
      });
  }

  /**
   * Genera un reporte de atribución estilística completo
   * con nivel de confianza categorizado.
   */
  async generateAttribution(features: number[]): Promise<AttributionReport> {
    const candidates = await this.searchSimilar(features, 0);

    const qualifiedCandidates = candidates.filter(
      (c) => c.score >= CONFIDENCE_THRESHOLDS.LOW,
    );

    const topMatch = qualifiedCandidates.length > 0 ? qualifiedCandidates[0] : null;

    let confidence: AttributionReport['confidence'] = 'NONE';
    if (topMatch) {
      if (topMatch.score >= CONFIDENCE_THRESHOLDS.HIGH) {
        confidence = 'HIGH';
      } else if (topMatch.score >= CONFIDENCE_THRESHOLDS.MEDIUM) {
        confidence = 'MEDIUM';
      } else {
        confidence = 'LOW';
      }
    }

    return {
      topMatch,
      candidates: qualifiedCandidates,
      confidence,
      totalCandidates: qualifiedCandidates.length,
    };
  }
}
