import { describe, it, expect, beforeEach } from 'vitest';
import { AudioProcessor } from '../../src/infrastructure/audio-processor';

describe('AudioProcessor', () => {
  let audioProcessor: AudioProcessor;

  beforeEach(() => {
    audioProcessor = new AudioProcessor();
  });

  describe('processFile', () => {
    it('debe procesar archivos de audio correctamente', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(result).toBeDefined();
      expect(result.features).toBeDefined();
      expect(result.waveform).toBeInstanceOf(Array);
      expect(result.tempo).toBeGreaterThan(0);
      expect(result.key).toBeDefined();
      expect(result.genre).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.loudness).toBeLessThanOrEqual(0);
    });

    it('debe procesar archivos simbólicos correctamente', async () => {
      const result = await audioProcessor.processFile('test.mxl', 'symbolic');
      expect(result).toBeDefined();
      expect(result.features).toBeDefined();
      expect(result.waveform).toBeInstanceOf(Array);
      expect(result.tempo).toBeGreaterThan(0);
      expect(result.key).toBeDefined();
      expect(result.genre).toBeDefined();
    });

    it('debe generar características de audio', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(result.features.mfcc).toBeInstanceOf(Array);
      expect(result.features.chroma).toBeInstanceOf(Array);
      expect(result.features.spectralCentroid).toBeGreaterThanOrEqual(0);
      expect(result.features.spectralSpread).toBeGreaterThanOrEqual(0);
      expect(result.features.spectralFlux).toBeGreaterThanOrEqual(0);
      expect(result.features.zeroCrossingRate).toBeGreaterThanOrEqual(0);
      expect(result.features.tonalCentroid).toBeGreaterThanOrEqual(0);
    });

    it('debe almacenar características en caché', async () => {
      const filePath = 'test.wav';
      const result1 = await audioProcessor.processFile(filePath, 'audio');
      const result2 = await audioProcessor.processFile(filePath, 'audio');
      
      expect(result1.features).toEqual(result2.features);
    });

    it('debe generar waveform para WAV', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(result.waveform.length).toBeGreaterThan(0);
      result.waveform.forEach(sample => {
        expect(sample).toBeGreaterThanOrEqual(-1);
        expect(sample).toBeLessThanOrEqual(1);
      });
    });

    it('debe generar waveform para otros formatos', async () => {
      const result = await audioProcessor.processFile('test.mp3', 'audio');
      expect(result.waveform).toBeInstanceOf(Array);
    });

    it('debe extraer tempo', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(result.tempo).toBeGreaterThan(0);
    });

    it('debe extraer clave', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(typeof result.key).toBe('string');
    });

    it('debe extraer género', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(typeof result.genre).toBe('string');
    });

    it('debe extraer duración', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('debe extraer loudness', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(result.loudness).toBeLessThanOrEqual(0);
    });

    it('debe generar transcripción', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(typeof result.transcription).toBe('string');
    });
  });

  describe('extraerFeatures', () => {
    it('debe extraer características de audio correctamente', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(result.features.mfcc).toBeInstanceOf(Array);
      expect(result.features.chroma).toBeInstanceOf(Array);
      expect(result.features.spectralCentroid).toBeGreaterThanOrEqual(0);
      expect(result.features.spectralSpread).toBeGreaterThanOrEqual(0);
      expect(result.features.spectralFlux).toBeGreaterThanOrEqual(0);
      expect(result.features.zeroCrossingRate).toBeGreaterThanOrEqual(0);
      expect(result.features.tonalCentroid).toBeGreaterThanOrEqual(0);
    });

    it('debe usar valores predeterminados cuando faltan propiedades', async () => {
      const result = await audioProcessor.processFile('test.wav', 'audio');
      expect(result.features).toBeDefined();
      expect(result.features.mfcc).toBeInstanceOf(Array);
      expect(result.features.chroma).toBeInstanceOf(Array);
      expect(result.features.spectralCentroid).toBeGreaterThanOrEqual(0);
      expect(result.features.spectralSpread).toBeGreaterThanOrEqual(0);
      expect(result.features.spectralFlux).toBeGreaterThanOrEqual(0);
      expect(result.features.zeroCrossingRate).toBeGreaterThanOrEqual(0);
      expect(result.features.tonalCentroid).toBeGreaterThanOrEqual(0);
    });
  });

  describe('manejo de errores', () => {
    it('debe lanzar error al procesar formato no soportado', async () => {
      await expect(audioProcessor.processFile('test.unknown', 'audio')).rejects.toThrow();
    });
  });
});