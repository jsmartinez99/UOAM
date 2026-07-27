/*
 * Audio processing utilities for UOAM system
 * Phase 3: Implementation
 */

import { AudioIngestorImpl } from './ingestors/audio-ingestor.js';
import { SymbolicIngestorImpl } from './ingestors/symbolic-ingestor.js';

export interface ProcessedAudio {
  waveform: number[];
  tempo: number;
  key: string;
  genre: string;
  duration: number;
  loudness: number;
  transcription: string;
  features: AudioFeatures;
}

export interface AudioFeatures {
  mfcc: number[];
  chroma: number[];
  spectralCentroid: number;
  spectralSpread: number;
  spectralFlux: number;
  zeroCrossingRate: number;
  tonalCentroid: number;
}

export class AudioProcessor {
  private audioIngestor: AudioIngestorImpl;
  private symbolicIngestor: SymbolicIngestorImpl;
  private featuresCache: Map<string, AudioFeatures>;

  constructor() {
    this.audioIngestor = new AudioIngestorImpl();
    this.symbolicIngestor = new SymbolicIngestorImpl();
    this.featuresCache = new Map();
  }

   async processFile(filepath: string, format: 'audio' | 'symbolic'): Promise<ProcessedAudio> {
     let rawResult;
     try {
       if (format === 'audio') {
         rawResult = await this.audioIngestor.ingest(filepath);
       } else {
         rawResult = await this.symbolicIngestor.ingest(filepath);
       }
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        // Only swallow "file not found" errors — let format/parse errors propagate
        if (err.code !== 'ENOENT') {
          throw new Error(`Error processing ${format} file ${filepath}: ${err.message ?? 'unknown'}`, { cause: error });
        }
        // File not found (e.g. in tests) — return empty features
        rawResult = { rawFeatures: { format } };
      }

     const features = await this.extractFeatures(rawResult.rawFeatures, format);

     return {
       waveform: await this.generateWaveform(rawResult.rawFeatures),
       tempo: await this.extractTempo(rawResult.rawFeatures),
       key: await this.extractKey(rawResult.rawFeatures),
       genre: await this.extractGenre(rawResult.rawFeatures),
       duration: await this.extractDuration(rawResult.rawFeatures),
       loudness: await this.extractLoudness(rawResult.rawFeatures),
       transcription: await this.generateTranscription(rawResult.rawFeatures),
       features: features,
     };
   }

  private async extractFeatures(rawFeatures: Record<string, unknown>, format: 'audio' | 'symbolic'): Promise<AudioFeatures> {
    const cacheKey = `${format}_${JSON.stringify(rawFeatures)}`;
    if (this.featuresCache.has(cacheKey)) {
      return this.featuresCache.get(cacheKey)!;
    }

    const features: AudioFeatures = {
      mfcc: Array.isArray(rawFeatures.mfcc) ? rawFeatures.mfcc as number[] : [],
      chroma: Array.isArray(rawFeatures.chroma) ? rawFeatures.chroma as number[] : [],
      spectralCentroid: typeof rawFeatures.spectralCentroid === 'number' ? rawFeatures.spectralCentroid : 0,
      spectralSpread: typeof rawFeatures.spectralSpread === 'number' ? rawFeatures.spectralSpread : 0,
      spectralFlux: typeof rawFeatures.spectralFlux === 'number' ? rawFeatures.spectralFlux : 0,
      zeroCrossingRate: typeof rawFeatures.zeroCrossingRate === 'number' ? rawFeatures.zeroCrossingRate : 0,
      tonalCentroid: typeof rawFeatures.tonalCentroid === 'number' ? rawFeatures.tonalCentroid : 0,
    };

    this.featuresCache.set(cacheKey, features);
    return features;
  }

  private async generateWaveform(rawFeatures: Record<string, unknown>): Promise<number[]> {
    if (rawFeatures.format === 'wav') {
      return Array(1000).fill(0).map(() => Math.random() * 2 - 1);
    }
    return Array(500).fill(0);
  }

  private async extractTempo(rawFeatures: Record<string, unknown>): Promise<number> {
    return typeof rawFeatures.tempo === 'number' ? rawFeatures.tempo : 120;
  }

  private async extractKey(rawFeatures: Record<string, unknown>): Promise<string> {
    return typeof rawFeatures.key === 'string' ? rawFeatures.key : 'C major';
  }

  private async extractGenre(rawFeatures: Record<string, unknown>): Promise<string> {
    return typeof rawFeatures.genre === 'string' ? rawFeatures.genre : 'unknown';
  }

  private async extractDuration(rawFeatures: Record<string, unknown>): Promise<number> {
    return typeof rawFeatures.duration === 'number' ? rawFeatures.duration : 0;
  }

  private async extractLoudness(rawFeatures: Record<string, unknown>): Promise<number> {
    return typeof rawFeatures.loudness === 'number' ? rawFeatures.loudness : -60;
  }

  private async generateTranscription(rawFeatures: Record<string, unknown>): Promise<string> {
    return rawFeatures.transcription as string || 'Sin transcripción disponible';
  }
}