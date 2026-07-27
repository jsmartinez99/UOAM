import { AudioIngestor, IngestorResult } from './ingestor.interface.js';

export class AudioIngestorImpl implements AudioIngestor {
  async ingest(filePath: string): Promise<IngestorResult> {
    if (filePath.endsWith('.wav')) {
      return { rawFeatures: { format: 'wav', features: { mfcc: [], chroma: [] } } };
    } else if (filePath.endsWith('.mp3')) {
      return { rawFeatures: { format: 'mp3', features: { mfcc: [], chroma: [] } } };
    }
    throw new Error('Formato no soportado');
  }
}
