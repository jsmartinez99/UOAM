import { Dimensions6D } from '../domain/arranger-profile';

export class FeatureExtractionService {
  extract(_rawFeatures: Record<string, any>): Dimensions6D {
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
