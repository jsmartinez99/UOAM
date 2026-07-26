import { describe, it, expect } from 'vitest';
import { SymbolicIngestorImpl } from '../../src/infrastructure/ingestors/symbolic-ingestor';

describe('SymbolicIngestor', () => {
  it('debe procesar un archivo MusicXML válido', async () => {
    const ingestor = new SymbolicIngestorImpl();
    // Mocking file path for now, we'll need a real file or mock the file system
    const result = await ingestor.ingest('path/to/valid.musicxml');
    expect(result.rawFeatures).toBeDefined();
    expect(result.rawFeatures.format).toBe('musicxml');
  });

  it('debe procesar un archivo MIDI válido', async () => {
    const ingestor = new SymbolicIngestorImpl();
    const result = await ingestor.ingest('path/to/valid.mid');
    expect(result.rawFeatures).toBeDefined();
    expect(result.rawFeatures.format).toBe('midi');
  });
});
