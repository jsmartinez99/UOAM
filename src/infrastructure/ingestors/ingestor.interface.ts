/**
 * Interfaces para los adaptadores de ingesta de archivos musicales.
 */

export interface IngestorResult {
  rawFeatures: Record<string, unknown>;
}

export interface SymbolicIngestor {
  ingest(filePath: string): Promise<IngestorResult>;
}

export interface AudioIngestor {
  ingest(filePath: string): Promise<IngestorResult>;
}
