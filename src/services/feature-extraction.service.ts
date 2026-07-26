import { Dimensions6D } from '../domain/arranger-profile';

export class FeatureExtractionService {
  extract(rawFeatures: Record<string, unknown>): Dimensions6D {
    return {
      organology: ['Extracted Instrument'],
      harmony: ['Extracted Harmony'],
      counterpoint: ['Extracted Counterpoint'],
      texture: ['Extracted Texture'],
      rhythm: ['Extracted Rhythm'],
      taste: ['Extracted Taste'],
    };
  }
}
