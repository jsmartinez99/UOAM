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

  // ── Embedding generado tras ingesta ──

  it('debe generar las 6 dimensiones tras la ingesta (embedding)', async () => {
    const mockIngestor: SymbolicIngestor = {
      ingest: vi.fn().mockResolvedValue({
        rawFeatures: {
          organology: ['Flute', 'Violin'],
          harmony: ['Extended chords'],
          counterpoint: ['Oblique motion'],
          texture: ['Low Close-Voicing (C2-C3)'],
          rhythm: ['Bossa nova'],
          taste: ['The Ogerman Swell'],
        },
      }),
    };
    const featureExtractor = new FeatureExtractionService();
    const service = new MusicIngestionService(mockIngestor, featureExtractor);

    const profile = await service.ingest('path/to/file.musicxml', 'Test Arranger');

    // El perfil debe tener las 6 dimensiones
    expect(profile.dimensions.organology).toHaveLength(2);
    expect(profile.dimensions.organology).toContain('Flute');
    expect(profile.dimensions.harmony).toContain('Extended chords');
    expect(profile.dimensions.taste).toContain('The Ogerman Swell');
  });

  it('debe rechazar archivos no soportados durante la ingesta', async () => {
    const mockIngestor: SymbolicIngestor = {
      ingest: vi.fn().mockRejectedValue(new Error('Unsupported format')),
    };
    const featureExtractor = new FeatureExtractionService();
    const service = new MusicIngestionService(mockIngestor, featureExtractor);

    await expect(
      service.ingest('path/to/file.unsupported', 'Test Arranger'),
    ).rejects.toThrow('Unsupported format');
  });
});
