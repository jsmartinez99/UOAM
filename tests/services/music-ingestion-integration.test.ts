import { describe, it, expect, vi } from 'vitest';
import { MusicIngestionService } from '../../src/services/music-ingestion.service';
import { SymbolicIngestorImpl } from '../../src/infrastructure/ingestors/symbolic-ingestor';
import { FeatureExtractionService } from '../../src/services/feature-extraction.service';
import { QdrantSearchEngine } from '../../src/engines/qdrant-search-engine';
import { VectorDatabaseClient } from '../../src/ports/vector-database.port';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = join(__dirname, '..', 'fixtures', 'sample.musicxml');

describe('MusicIngestionService Integration', () => {
  it('debe ejecutar el flujo completo de ingesta', async () => {
    const mockClient: VectorDatabaseClient = { search: vi.fn() };
    const ingestor = new SymbolicIngestorImpl();
    const extractor = new FeatureExtractionService();
    const searchEngine = new QdrantSearchEngine(mockClient);
    
    const service = new MusicIngestionService(ingestor, extractor, searchEngine);
    
    const profile = await service.ingest(fixturePath, 'Test Arranger');
    
    expect(profile.name).toBe('Test Arranger');
    expect(profile.dimensions.organology).toBeDefined();
  });
});
