/**
 * Tests TDD — Módulo C: Reconocimiento y Búsqueda Semántica (Qdrant)
 *
 * Ciclo: RED → GREEN → REFACTOR
 * Verifica búsqueda KNN, filtrado por threshold y reporte de atribución.
 */
import { describe, it, expect, vi } from 'vitest';
import { QdrantSearchEngine } from '../../src/engines/qdrant-search-engine';
import { VectorDatabaseClient, VectorSearchHit } from '../../src/ports/vector-database.port';

// ─── Helpers ─────────────────────────────────────────────────────

function createMockClient(results: VectorSearchHit[]): VectorDatabaseClient {
  return {
    search: vi.fn().mockResolvedValue(results),
  };
}

const mockTargetFeatures = [0.12, 0.85, 0.45, 0.67, 0.91, 0.33];

// ─── Suite ───────────────────────────────────────────────────────

describe('Qdrant Search Engine', () => {
  // ── Test original del spec (Fase Roja) ──

  it('debe devolver un score de similitud mayor a 0.8 para arreglos relacionados', async () => {
    const mockClient = createMockClient([
      { payload: 'Ogerman', score: 0.85 },
    ]);
    const engine = new QdrantSearchEngine(mockClient);

    const results = await engine.searchSimilar(mockTargetFeatures);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0.8);
    expect(results[0].arranger).toBe('Ogerman');
  });

  // ── Filtrado por threshold ──

  it('debe filtrar resultados por debajo del threshold', async () => {
    const mockClient = createMockClient([
      { payload: 'Ogerman', score: 0.92 },
      { payload: 'Mancini', score: 0.45 },
      { payload: 'Schifrin', score: 0.78 },
    ]);
    const engine = new QdrantSearchEngine(mockClient);

    const results = await engine.searchSimilar(mockTargetFeatures, 0.8);

    expect(results).toHaveLength(1);
    expect(results[0].arranger).toBe('Ogerman');
  });

  it('debe devolver lista vacía si ningún resultado supera el threshold', async () => {
    const mockClient = createMockClient([
      { payload: 'Unknown', score: 0.3 },
      { payload: 'Another', score: 0.2 },
    ]);
    const engine = new QdrantSearchEngine(mockClient);

    const results = await engine.searchSimilar(mockTargetFeatures, 0.8);

    expect(results).toHaveLength(0);
  });

  // ── Validación de entrada ──

  it('debe lanzar error si el vector de features está vacío', async () => {
    const mockClient = createMockClient([]);
    const engine = new QdrantSearchEngine(mockClient);

    await expect(engine.searchSimilar([])).rejects.toThrow(
      'Vector de features vacío',
    );
  });

  // ── Llamada correcta al cliente ──

  it('debe invocar al cliente Qdrant con la colección y parámetros correctos', async () => {
    const mockClient = createMockClient([{ payload: 'Ogerman', score: 0.9 }]);
    const engine = new QdrantSearchEngine(mockClient, 'custom_collection');

    await engine.searchSimilar(mockTargetFeatures);

    expect(mockClient.search).toHaveBeenCalledWith('custom_collection', {
      vector: mockTargetFeatures,
      limit: 5,
    });
  });

  // ── Reporte de atribución ──

  describe('Attribution Report', () => {
    it('debe generar reporte con confianza HIGH para score >= 0.85', async () => {
      const mockClient = createMockClient([
        { payload: 'Ogerman', score: 0.92 },
        { payload: 'Mancini', score: 0.71 },
      ]);
      const engine = new QdrantSearchEngine(mockClient);

      const report = await engine.generateAttribution(mockTargetFeatures);

      expect(report.confidence).toBe('HIGH');
      expect(report.topMatch?.arranger).toBe('Ogerman');
      expect(report.totalCandidates).toBe(2);
    });

    it('debe generar reporte con confianza MEDIUM para score entre 0.7 y 0.85', async () => {
      const mockClient = createMockClient([
        { payload: 'Schifrin', score: 0.78 },
      ]);
      const engine = new QdrantSearchEngine(mockClient);

      const report = await engine.generateAttribution(mockTargetFeatures);

      expect(report.confidence).toBe('MEDIUM');
      expect(report.topMatch?.arranger).toBe('Schifrin');
    });

    it('debe generar reporte con confianza LOW para score entre 0.5 y 0.7', async () => {
      const mockClient = createMockClient([
        { payload: 'Unknown', score: 0.55 },
      ]);
      const engine = new QdrantSearchEngine(mockClient);

      const report = await engine.generateAttribution(mockTargetFeatures);

      expect(report.confidence).toBe('LOW');
    });

    it('debe generar reporte con confianza NONE si no hay candidatos válidos', async () => {
      const mockClient = createMockClient([
        { payload: 'Noise', score: 0.1 },
      ]);
      const engine = new QdrantSearchEngine(mockClient);

      const report = await engine.generateAttribution(mockTargetFeatures);

      expect(report.confidence).toBe('NONE');
      expect(report.topMatch).toBeNull();
      expect(report.totalCandidates).toBe(0);
    });
  });
});
