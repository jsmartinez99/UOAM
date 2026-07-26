import { describe, it, expect, vi } from 'vitest';
import { MusicIngestionService } from '../../src/services/music-ingestion.service';
import { SymbolicIngestorImpl } from '../../src/infrastructure/ingestors/symbolic-ingestor';
import { FeatureExtractionService } from '../../src/services/feature-extraction.service';
import { QdrantSearchEngine } from '../../src/engines/qdrant-search-engine';
import { VectorDatabaseClient } from '../../src/ports/vector-database.port';

describe('MusicIngestionService Integration', () => {
  it('debe ejecutar el flujo completo de ingesta', async () => {
    const mockClient: VectorDatabaseClient = { search: vi.fn() };
    const ingestor = new SymbolicIngestorImpl();
    const extractor = new FeatureExtractionService();
    const searchEngine = new QdrantSearchEngine(mockClient);
    
    const service = new MusicIngestionService(ingestor, extractor, searchEngine);
    
    const profile = await service.ingest('path/to/valid.musicxml', 'Test Arranger');
    
    expect(profile.name).toBe('Test Arranger');
    expect(profile.dimensions.organology).toBeDefined();
  });
});
