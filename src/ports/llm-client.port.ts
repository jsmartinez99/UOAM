/**
 * Módulo D: Port del cliente LLM
 *
 * Contrato que cualquier proveedor de LLM (OpenAI, Anthropic, Ollama)
 * debe implementar para integrarse al pipeline RAG.
 */

export interface LLMClient {
  /** Genera texto a partir de un prompt del sistema */
  generateText(systemPrompt: string): Promise<string>;
}

/** Contexto recuperado del Módulo C para inyección RAG */
export interface RAGContext {
  arranger: string;
  confidence: number;
  matchedDimension: string;
}

/** Reporte analítico generado por el LLM */
export interface AnalysisReport {
  content: string;
  context: RAGContext;
  generatedAt: Date;
}
