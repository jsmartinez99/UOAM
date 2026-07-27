import { describe, it, expect } from 'vitest';
import { SymbolicIngestorImpl } from '../../src/infrastructure/ingestors/symbolic-ingestor';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('SymbolicIngestor', () => {
  it('debe procesar un archivo MusicXML válido', async () => {
    const ingestor = new SymbolicIngestorImpl();
    const result = await ingestor.ingest(join(FIXTURES_DIR, 'sample.musicxml'));
    expect(result.rawFeatures).toBeDefined();
    expect(result.rawFeatures.format).toBe('musicxml');
    expect(result.rawFeatures.parts).toBeDefined();
    expect(result.rawFeatures.parts.length).toBeGreaterThan(0);
    expect(result.rawFeatures.measures).toBeDefined();
    expect(result.rawFeatures.measures.length).toBeGreaterThan(0);
  });

  it('debe procesar un archivo MIDI válido', async () => {
    const ingestor = new SymbolicIngestorImpl();
    // MIDI parsing not yet implemented - should return basic format info
    const result = await ingestor.ingest(join(FIXTURES_DIR, 'sample.mid'));
    expect(result.rawFeatures).toBeDefined();
    expect(result.rawFeatures.format).toBe('midi');
  });
});
