import { describe, it, expect } from 'vitest';
import { AudioIngestorImpl } from '../../src/infrastructure/ingestors/audio-ingestor';

describe('AudioIngestor', () => {
  it('debe procesar un archivo WAV válido', async () => {
    const ingestor = new AudioIngestorImpl();
    const result = await ingestor.ingest('path/to/valid.wav');
    expect(result.rawFeatures).toBeDefined();
    expect(result.rawFeatures.format).toBe('wav');
  });

  it('debe procesar un archivo MP3 válido', async () => {
    const ingestor = new AudioIngestorImpl();
    const result = await ingestor.ingest('path/to/valid.mp3');
    expect(result.rawFeatures).toBeDefined();
    expect(result.rawFeatures.format).toBe('mp3');
  });

  it('debe rechazar formatos no soportados', async () => {
    const ingestor = new AudioIngestorImpl();
    await expect(ingestor.ingest('path/to/invalid.ogg')).rejects.toThrow('Formato no soportado');
  });
});
