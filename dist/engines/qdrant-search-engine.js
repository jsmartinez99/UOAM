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
// ─── Constantes ──────────────────────────────────────────────────
const DEFAULT_COLLECTION = 'arrangements_collection';
const DEFAULT_LIMIT = 5;
const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.85,
    MEDIUM: 0.7,
    LOW: 0.5,
};
// ─── Motor de Búsqueda ──────────────────────────────────────────
export class QdrantSearchEngine {
    qdrantClient;
    collectionName;
    constructor(qdrantClient, collectionName = DEFAULT_COLLECTION) {
        this.qdrantClient = qdrantClient;
        this.collectionName = collectionName;
    }
    /**
     * Busca arreglistas similares dado un vector de features.
     * Filtra resultados por umbral de score mínimo.
     */
    async searchSimilar(features, threshold = CONFIDENCE_THRESHOLDS.LOW) {
        if (!features || features.length === 0) {
            throw new Error('Vector de features vacío: no se puede realizar búsqueda');
        }
        const response = await this.qdrantClient.search(this.collectionName, {
            vector: features,
            limit: DEFAULT_LIMIT,
        });
        return response
            .filter((hit) => hit.score >= threshold)
            .map((hit) => ({
            arranger: typeof hit.payload === 'string' ? hit.payload : String(hit.payload),
            score: hit.score,
        }));
    }
    /**
     * Genera un reporte de atribución estilística completo
     * con nivel de confianza categorizado.
     */
    async generateAttribution(features) {
        const candidates = await this.searchSimilar(features, 0);
        const qualifiedCandidates = candidates.filter((c) => c.score >= CONFIDENCE_THRESHOLDS.LOW);
        const topMatch = qualifiedCandidates.length > 0 ? qualifiedCandidates[0] : null;
        let confidence = 'NONE';
        if (topMatch) {
            if (topMatch.score >= CONFIDENCE_THRESHOLDS.HIGH) {
                confidence = 'HIGH';
            }
            else if (topMatch.score >= CONFIDENCE_THRESHOLDS.MEDIUM) {
                confidence = 'MEDIUM';
            }
            else {
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
//# sourceMappingURL=qdrant-search-engine.js.map