import { Dimensions6D } from '../domain/arranger-profile.js';

export interface HybridResult {
  mergedProfile: Dimensions6D;
  resolutionLog: string[];
}

export interface SearchResult {
  arranger: string;
  score: number;
}

export interface AnalysisReport {
  content: string;
  context: Record<string, unknown>;
  generatedAt: Date;
}
