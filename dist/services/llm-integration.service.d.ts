/**
 * Módulo D: Ingesta, Generación e Integración LLM (RAG & Audio/Symbolic Processing)
 *
 * Pipeline RAG (Retrieval-Augmented Generation):
 *   1. El Módulo C recupera contexto vectorial (arranger + confidence + dimension)
 *   2. Este servicio construye un prompt determinista inyectando ese contexto
 *   3. El LLM genera análisis técnico basado SOLO en el contexto proporcionado
 *
 * Principio clave: el LLM no inventa teoría — recibe contexto verificado.
 */
import { LLMClient, RAGContext, AnalysisReport } from '../ports/llm-client.port.js';
export declare class InsufficientConfidenceError extends Error {
    constructor(confidence: number);
}
export declare class EmptyContextError extends Error {
    constructor();
}
export declare class LLMIntegrationService {
    private readonly llmClient;
    constructor(llmClient: LLMClient);
    /**
     * Genera un reporte analítico de arreglo musical usando RAG.
     *
     * @param context - Contexto recuperado del motor de búsqueda semántica (Módulo C)
     * @returns Reporte con análisis técnico del LLM
     * @throws InsufficientConfidenceError si la confianza < 50%
     * @throws EmptyContextError si el contexto está incompleto
     */
    generateArrangementReport(context: RAGContext): Promise<AnalysisReport>;
    /**
     * Genera un reporte comparativo entre múltiples atribuciones.
     */
    generateComparativeReport(contexts: RAGContext[]): Promise<AnalysisReport>;
    private validateContext;
    private buildRAGPrompt;
    private buildComparativePrompt;
}
//# sourceMappingURL=llm-integration.service.d.ts.map