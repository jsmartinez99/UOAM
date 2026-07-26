import { SymbolicIngestor, IngestorResult } from './ingestor.interface';

export class SymbolicIngestorImpl implements SymbolicIngestor {
  async ingest(filePath: string): Promise<IngestorResult> {
    if (filePath.endsWith('.musicxml')) {
      return { rawFeatures: { format: 'musicxml', data: '...' } };
    } else if (filePath.endsWith('.mid')) {
      return { rawFeatures: { format: 'midi', data: '...' } };
    }
    throw new Error('Formato no soportado');
  }
}
