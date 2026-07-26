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
// ─── Errores de dominio ──────────────────────────────────────────
export class InsufficientConfidenceError extends Error {
    constructor(confidence) {
        super(`Confianza insuficiente para generar reporte concluyente: ${(confidence * 100).toFixed(1)}% (mínimo requerido: 50%)`);
        this.name = 'InsufficientConfidenceError';
    }
}
export class EmptyContextError extends Error {
    constructor() {
        super('Contexto RAG vacío: se requiere al menos un arreglista y una dimensión');
        this.name = 'EmptyContextError';
    }
}
// ─── Constantes ──────────────────────────────────────────────────
const MIN_CONFIDENCE_THRESHOLD = 0.5;
// ─── Servicio de Integración LLM ─────────────────────────────────
export class LLMIntegrationService {
    llmClient;
    constructor(llmClient) {
        this.llmClient = llmClient;
    }
    /**
     * Genera un reporte analítico de arreglo musical usando RAG.
     *
     * @param context - Contexto recuperado del motor de búsqueda semántica (Módulo C)
     * @returns Reporte con análisis técnico del LLM
     * @throws InsufficientConfidenceError si la confianza < 50%
     * @throws EmptyContextError si el contexto está incompleto
     */
    async generateArrangementReport(context) {
        this.validateContext(context);
        const systemPrompt = this.buildRAGPrompt(context);
        const response = await this.llmClient.generateText(systemPrompt);
        return {
            content: response,
            context,
            generatedAt: new Date(),
        };
    }
    /**
     * Genera un reporte comparativo entre múltiples atribuciones.
     */
    async generateComparativeReport(contexts) {
        if (contexts.length < 2) {
            throw new Error('Se requieren al menos 2 contextos para un reporte comparativo');
        }
        const validContexts = contexts.filter((c) => c.confidence >= MIN_CONFIDENCE_THRESHOLD);
        if (validContexts.length < 2) {
            throw new InsufficientConfidenceError(Math.max(...contexts.map((c) => c.confidence)));
        }
        const prompt = this.buildComparativePrompt(validContexts);
        const response = await this.llmClient.generateText(prompt);
        return {
            content: response,
            context: validContexts[0],
            generatedAt: new Date(),
        };
    }
    // ── Validaciones ──
    validateContext(context) {
        if (!context.arranger || !context.matchedDimension) {
            throw new EmptyContextError();
        }
        if (context.confidence < MIN_CONFIDENCE_THRESHOLD) {
            throw new InsufficientConfidenceError(context.confidence);
        }
    }
    // ── Prompt Engineering ──
    buildRAGPrompt(context) {
        return [
            'Eres un analista musical experto. Basa tu análisis SOLO en este contexto:',
            `Arreglista detectado: ${context.arranger}`,
            `Dimensión principal: ${context.matchedDimension}`,
            `Nivel de confianza: ${(context.confidence * 100).toFixed(1)}%`,
            'Genera un análisis técnico breve.',
        ].join('\n');
    }
    buildComparativePrompt(contexts) {
        const entries = contexts
            .map((c, i) => `${i + 1}. ${c.arranger} — ${c.matchedDimension} (${(c.confidence * 100).toFixed(1)}%)`)
            .join('\n');
        return [
            'Eres un analista musical experto. Compara las siguientes influencias detectadas:',
            entries,
            'Genera un análisis comparativo técnico breve basado SOLO en estos datos.',
        ].join('\n');
    }
}
//# sourceMappingURL=llm-integration.service.js.map