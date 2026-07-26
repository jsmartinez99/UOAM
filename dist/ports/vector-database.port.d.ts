/**
 * Módulo C: Reconocimiento y Búsqueda Semántica (Vector Indexing)
 *
 * Port (interfaz) del cliente de base de datos vectorial.
 * Siguiendo Arquitectura Hexagonal, definimos el contrato
 * que cualquier adaptador (Qdrant, Pinecone, Weaviate) debe cumplir.
 */
/** Resultado crudo de una búsqueda vectorial */
export interface VectorSearchHit {
    payload: string | Record<string, unknown>;
    score: number;
    id?: string | number;
}
/** Contrato del cliente de búsqueda vectorial (Port) */
export interface VectorDatabaseClient {
    search(collectionName: string, params: {
        vector: number[];
        limit: number;
        score_threshold?: number;
    }): Promise<VectorSearchHit[]>;
    upsert?(collectionName: string, points: Array<{
        id: string | number;
        vector: number[];
        payload: Record<string, unknown>;
    }>): Promise<void>;
}
//# sourceMappingURL=vector-database.port.d.ts.map