import { describe, it, expect, vi } from 'vitest';
import { MusicIngestionService } from '../../src/services/music-ingestion.service';
import { SymbolicIngestor } from '../../src/infrastructure/ingestors/ingestor.interface';
import { FeatureExtractionService } from '../../src/services/feature-extraction.service';

describe('MusicIngestionService', () => {
  it('debe procesar un archivo musical y devolver una firma 6D', async () => {
    const mockIngestor: SymbolicIngestor = {
      ingest: vi.fn().mockResolvedValue({ rawFeatures: { format: 'musicxml' } }),
    };
    const featureExtractor = new FeatureExtractionService();
    const service = new MusicIngestionService(mockIngestor, featureExtractor);
    
    const profile = await service.ingest('path/to/file.musicxml', 'Test Arranger');
    expect(profile).toBeDefined();
    expect(profile.dimensions.organology).toBeDefined();
  });
});
