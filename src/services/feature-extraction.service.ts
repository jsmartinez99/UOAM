import { Dimensions6D } from '../domain/arranger-profile.js';

const DIMENSION_KEYS: Array<keyof Dimensions6D> = [
  'organology',
  'harmony',
  'counterpoint',
  'texture',
  'rhythm',
  'taste',
];

export class FeatureExtractionService {
  extract(rawFeatures: Record<string, unknown>): Dimensions6D {
    const result = {} as Dimensions6D;
    for (const key of DIMENSION_KEYS) {
      const value = rawFeatures[key];
      if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
        result[key] = value as string[];
      } else {
        result[key] = [`Extracted ${key.charAt(0).toUpperCase() + key.slice(1)}`];
      }
    }
    return result;
  }
}
