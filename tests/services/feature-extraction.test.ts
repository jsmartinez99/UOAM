import { describe, it, expect } from 'vitest';
import { FeatureExtractionService } from '../../src/services/feature-extraction.service';

describe('FeatureExtractionService', () => {
  it('debe mapear características crudas a firma 6D', () => {
    const service = new FeatureExtractionService();
    const rawFeatures = { format: 'musicxml', data: '...' };
    const signature = service.extract(rawFeatures);
    
    expect(signature).toBeDefined();
    expect(signature.organology).toBeInstanceOf(Array);
    expect(signature.harmony).toBeInstanceOf(Array);
  });
});
