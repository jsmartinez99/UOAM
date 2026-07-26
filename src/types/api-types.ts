import { Dimensions6D } from '../domain/arranger-profile';

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
  context: any;
  generatedAt: Date;
}
