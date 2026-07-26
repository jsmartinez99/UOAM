/**
 * Tests TDD — Módulo D: Ingesta e Integración LLM (RAG)
 *
 * Ciclo: RED → GREEN → REFACTOR
 * Verifica pipeline RAG, prompt engineering y validaciones de confianza.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  LLMIntegrationService,
  InsufficientConfidenceError,
  EmptyContextError,
} from '../../src/services/llm-integration.service';
import { LLMClient, RAGContext } from '../../src/ports/llm-client.port';

// ─── Helpers ─────────────────────────────────────────────────────

function createMockLLMClient(response: string): LLMClient {
  return {
    generateText: vi.fn().mockResolvedValue(response),
  };
}

// ─── Suite ───────────────────────────────────────────────────────

describe('LLM RAG Integration', () => {
  // ── Test original del spec (Fase Roja) ──

  it('debe generar un reporte analítico basado estrictamente en el contexto del vector de Qdrant', async () => {
    const mockLLMClient = createMockLLMClient(
      'Influencia detectada: Rítmica de Lalo Schifrin.',
    );
    const llmService = new LLMIntegrationService(mockLLMClient);

    // Contexto recuperado del Módulo C
    const retrievedContext: RAGContext = {
      arranger: 'Lalo Schifrin',
      confidence: 0.92,
      matchedDimension: 'Rhythm',
    };

    const report = await llmService.generateArrangementReport(retrievedContext);

    // Verifica inyección de prompt RAG
    expect(mockLLMClient.generateText).toHaveBeenCalledWith(
      expect.stringContaining('Lalo Schifrin'),
    );
    expect(report.content).toBe('Influencia detectada: Rítmica de Lalo Schifrin.');
  });

  // ── Validación de confianza ──

  it('debe rechazar contextos con confianza menor a 0.5', async () => {
    const mockLLMClient = createMockLLMClient('No debería llegar aquí');
    const llmService = new LLMIntegrationService(mockLLMClient);

    const lowConfidenceContext: RAGContext = {
      arranger: 'Unknown',
      confidence: 0.3,
      matchedDimension: 'Harmony',
    };

    await expect(
      llmService.generateArrangementReport(lowConfidenceContext),
    ).rejects.toThrow(InsufficientConfidenceError);

    // El LLM no debe ser invocado si la confianza es insuficiente
    expect(mockLLMClient.generateText).not.toHaveBeenCalled();
  });

  it('debe aceptar contextos con confianza exactamente 0.5 (boundary)', async () => {
    const mockLLMClient = createMockLLMClient('Análisis borderline.');
    const llmService = new LLMIntegrationService(mockLLMClient);

    const boundaryContext: RAGContext = {
      arranger: 'Test Arranger',
      confidence: 0.5,
      matchedDimension: 'Texture',
    };

    const report = await llmService.generateArrangementReport(boundaryContext);

    expect(report.content).toBe('Análisis borderline.');
    expect(mockLLMClient.generateText).toHaveBeenCalledTimes(1);
  });

  // ── Validación de contexto vacío ──

  it('debe rechazar contextos sin nombre de arreglista', async () => {
    const mockLLMClient = createMockLLMClient('No debería llegar');
    const llmService = new LLMIntegrationService(mockLLMClient);

    const emptyContext: RAGContext = {
      arranger: '',
      confidence: 0.9,
      matchedDimension: 'Harmony',
    };

    await expect(
      llmService.generateArrangementReport(emptyContext),
    ).rejects.toThrow(EmptyContextError);
  });

  it('debe rechazar contextos sin dimensión coincidente', async () => {
    const mockLLMClient = createMockLLMClient('No debería llegar');
    const llmService = new LLMIntegrationService(mockLLMClient);

    const emptyDimContext: RAGContext = {
      arranger: 'Ogerman',
      confidence: 0.9,
      matchedDimension: '',
    };

    await expect(
      llmService.generateArrangementReport(emptyDimContext),
    ).rejects.toThrow(EmptyContextError);
  });

  // ── Estructura del prompt RAG ──

  it('debe construir el prompt RAG con todas las variables del contexto', async () => {
    const mockLLMClient = createMockLLMClient('Análisis completo.');
    const llmService = new LLMIntegrationService(mockLLMClient);

    const context: RAGContext = {
      arranger: 'Claus Ogerman',
      confidence: 0.88,
      matchedDimension: 'Texture',
    };

    await llmService.generateArrangementReport(context);

    const calledPrompt = (mockLLMClient.generateText as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;

    expect(calledPrompt).toContain('Claus Ogerman');
    expect(calledPrompt).toContain('Texture');
    expect(calledPrompt).toContain('88.0%');
    expect(calledPrompt).toContain('SOLO en este contexto');
  });

  // ── Metadatos del reporte ──

  it('debe incluir metadatos de contexto y fecha en el reporte', async () => {
    const mockLLMClient = createMockLLMClient('Análisis detallado.');
    const llmService = new LLMIntegrationService(mockLLMClient);

    const context: RAGContext = {
      arranger: 'Henry Mancini',
      confidence: 0.76,
      matchedDimension: 'Organology',
    };

    const report = await llmService.generateArrangementReport(context);

    expect(report.context).toEqual(context);
    expect(report.generatedAt).toBeInstanceOf(Date);
  });

  // ── Reporte comparativo ──

  describe('Comparative Report', () => {
    it('debe generar un reporte comparativo con múltiples contextos', async () => {
      const mockLLMClient = createMockLLMClient('Comparación entre Ogerman y Schifrin.');
      const llmService = new LLMIntegrationService(mockLLMClient);

      const contexts: RAGContext[] = [
        { arranger: 'Claus Ogerman', confidence: 0.88, matchedDimension: 'Texture' },
        { arranger: 'Lalo Schifrin', confidence: 0.72, matchedDimension: 'Rhythm' },
      ];

      const report = await llmService.generateComparativeReport(contexts);

      expect(report.content).toBe('Comparación entre Ogerman y Schifrin.');

      const calledPrompt = (mockLLMClient.generateText as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as string;
      expect(calledPrompt).toContain('Claus Ogerman');
      expect(calledPrompt).toContain('Lalo Schifrin');
    });

    it('debe rechazar reportes comparativos con menos de 2 contextos', async () => {
      const mockLLMClient = createMockLLMClient('No debería llegar');
      const llmService = new LLMIntegrationService(mockLLMClient);

      await expect(
        llmService.generateComparativeReport([
          { arranger: 'Solo', confidence: 0.9, matchedDimension: 'Harmony' },
        ]),
      ).rejects.toThrow('Se requieren al menos 2 contextos');
    });

    it('debe filtrar contextos con confianza insuficiente en comparativos', async () => {
      const mockLLMClient = createMockLLMClient('No debería llegar');
      const llmService = new LLMIntegrationService(mockLLMClient);

      const contexts: RAGContext[] = [
        { arranger: 'Ogerman', confidence: 0.9, matchedDimension: 'Texture' },
        { arranger: 'Unknown', confidence: 0.2, matchedDimension: 'Rhythm' },
      ];

      // Solo 1 contexto válido de 2 => InsufficientConfidenceError
      await expect(
        llmService.generateComparativeReport(contexts),
      ).rejects.toThrow(InsufficientConfidenceError);
    });
  });
});
