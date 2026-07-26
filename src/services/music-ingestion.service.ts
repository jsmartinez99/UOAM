import { SymbolicIngestor } from '../infrastructure/ingestors/ingestor.interface';
import { FeatureExtractionService } from './feature-extraction.service';
import { ArrangerProfile } from '../domain/arranger-profile';

export class MusicIngestionService {
  constructor(
    private readonly symbolicIngestor: SymbolicIngestor,
    private readonly featureExtractor: FeatureExtractionService,
  ) {}

  async ingest(filePath: string, arrangerName: string): Promise<ArrangerProfile> {
    const result = await this.symbolicIngestor.ingest(filePath);
    const dimensions = this.featureExtractor.extract(result.rawFeatures);
    const profile = new ArrangerProfile(arrangerName, dimensions);
    
    return profile;
  }
}

