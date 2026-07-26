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
export interface SearchResult {
    arranger: string;
    score: number;
    matchedDimension?: string;
}
export interface AttributionReport {
    topMatch: SearchResult | null;
    candidates: SearchResult[];
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    totalCandidates: number;
}
export declare class QdrantSearchEngine {
    private readonly qdrantClient;
    private readonly collectionName;
    constructor(qdrantClient: VectorDatabaseClient, collectionName?: string);
    /**
     * Busca arreglistas similares dado un vector de features.
     * Filtra resultados por umbral de score mínimo.
     */
    searchSimilar(features: number[], threshold?: number): Promise<SearchResult[]>;
    /**
     * Genera un reporte de atribución estilística completo
     * con nivel de confianza categorizado.
     */
    generateAttribution(features: number[]): Promise<AttributionReport>;
}
//# sourceMappingURL=qdrant-search-engine.d.ts.map