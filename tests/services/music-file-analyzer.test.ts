/**
 * Tests para music-file-analyzer.service.ts
 *
 * Cubre: análisis de archivos MusicXML y MIDI, extracción de 6D, manejo de errores.
 */
import { describe, it, expect } from 'vitest';
import { MusicFileAnalyzer } from '../../src/services/music-file-analyzer.service';
import fs from 'fs';
import path from 'path';

const FIXTURES = '/home/ramses/UOAM/tests/fixtures/music-files';

describe('MusicFileAnalyzer', () => {
  describe('Detección de formato', () => {
    it('debe detectar MusicXML por extensión .musicxml', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'simple.musicxml'));
      const result = await MusicFileAnalyzer.analyze(buf, 'application/xml', 'simple.musicxml');
      expect(result.detectedFormat).toBe('MusicXML');
    });

    it('debe detectar MusicXML por extensión .xml', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'simple.xml'));
      const result = await MusicFileAnalyzer.analyze(buf, 'application/xml', 'simple.xml');
      expect(result.detectedFormat).toBe('MusicXML');
    });

    it('debe detectar MIDI por extensión .mid', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'simple.mid'));
      const result = await MusicFileAnalyzer.analyze(buf, 'audio/midi', 'simple.mid');
      expect(result.detectedFormat).toBe('MIDI');
    });

    it('debe detectar MIDI por extensión .midi', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'simple.midi'));
      const result = await MusicFileAnalyzer.analyze(buf, 'audio/midi', 'simple.midi');
      expect(result.detectedFormat).toBe('MIDI');
    });

    it('debe detectar MusicXML por mimetype si la extensión no ayuda', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'simple.musicxml'));
      const result = await MusicFileAnalyzer.analyze(buf, 'application/xml', 'unknown.bin');
      expect(result.detectedFormat).toBe('MusicXML');
    });

    it('debe retornar "unknown" para formato no detectado', async () => {
      const buf = Buffer.from('random data');
      const result = await MusicFileAnalyzer.analyze(buf, 'application/octet-stream', 'test.bin');
      expect(result.detectedFormat).toBe('unknown');
    });
  });

  describe('Extracción de dimensiones MusicXML', () => {
    it('debe extraer las 6 dimensiones', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'quartet.musicxml'));
      const result = await MusicFileAnalyzer.analyze(buf, 'application/xml', 'quartet.musicxml');
      expect(result.dimensions.organology).toBeDefined();
      expect(result.dimensions.harmony).toBeDefined();
      expect(result.dimensions.counterpoint).toBeDefined();
      expect(result.dimensions.texture).toBeDefined();
      expect(result.dimensions.rhythm).toBeDefined();
      expect(result.dimensions.taste).toBeDefined();
    });

    it('debe detectar instrumentos por nombre de parte', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'quartet.musicxml'));
      const result = await MusicFileAnalyzer.analyze(buf, 'application/xml', 'quartet.musicxml');
      // El fixture tiene Violin, Viola, Cello
      expect(result.dimensions.organology).toContain('violin');
      expect(result.dimensions.organology).toContain('cello');
    });

    it('debe retornar dimensiones no vacías aunque el XML esté vacío', async () => {
      const buf = Buffer.from('<?xml version="1.0"?><score></score>');
      const result = await MusicFileAnalyzer.analyze(buf, 'application/xml', 'empty.musicxml');
      expect(result.dimensions.organology.length).toBeGreaterThan(0);
      expect(result.dimensions.harmony.length).toBeGreaterThan(0);
    });
  });

  describe('Análisis MIDI', () => {
    it('debe parsear header MThd', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'simple.mid'));
      const result = await MusicFileAnalyzer.analyze(buf, 'audio/midi', 'simple.mid');
      expect(result.dimensions).toBeDefined();
    });

    it('debe retornar fallback si el MIDI es inválido', async () => {
      const buf = Buffer.from('NOT A MIDI FILE');
      const result = await MusicFileAnalyzer.analyze(buf, 'audio/midi', 'invalid.mid');
      expect(result.dimensions).toBeDefined();
      expect(result.dimensions.organology.length).toBeGreaterThan(0); // fallback
    });

    it('debe detectar multi-track vs single-track', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'multitrack.mid'));
      const result = await MusicFileAnalyzer.analyze(buf, 'audio/midi', 'multitrack.mid');
      // Multitrack debe tener counterpoint/texture complejos
      expect(result.dimensions.counterpoint.length).toBeGreaterThan(0);
    });
  });

  describe('Metadata y confidence', () => {
    it('debe incluir metadata con filename', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'simple.mid'));
      const result = await MusicFileAnalyzer.analyze(buf, 'audio/midi', 'my-piece.mid');
      expect(result.metadata.filename).toBe('my-piece.mid');
    });

    it('debe incluir size en metadata', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'simple.mid'));
      const result = await MusicFileAnalyzer.analyze(buf, 'audio/midi', 'simple.mid');
      expect(result.metadata.size).toBe(buf.length);
    });

    it('debe tener confidence entre 0 y 1', async () => {
      const buf = fs.readFileSync(path.join(FIXTURES, 'simple.mid'));
      const result = await MusicFileAnalyzer.analyze(buf, 'audio/midi', 'simple.mid');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('suggestName', () => {
    it('debe generar nombre desde el filename', () => {
      const name = MusicFileAnalyzer.suggestName(
        {
          organology: ['a', 'b', 'c', 'd'],
          harmony: ['x'],
          counterpoint: ['x'],
          texture: ['x'],
          rhythm: ['x'],
          taste: ['x'],
        },
        { filename: 'my-piece.mid' },
      );
      expect(name).toContain('my-piece');
    });

    it('debe añadir dimensión dominante si tiene > 3 items', () => {
      const name = MusicFileAnalyzer.suggestName(
        {
          organology: ['a', 'b', 'c', 'd', 'e'],
          harmony: ['x'],
          counterpoint: ['x'],
          texture: ['x'],
          rhythm: ['x'],
          taste: ['x'],
        },
        { filename: 'test.mid' },
      );
      expect(name).toContain('Organology');
    });

    it('debe usar fallback si no hay filename', () => {
      const name = MusicFileAnalyzer.suggestName(
        {
          organology: ['a'],
          harmony: ['x'],
          counterpoint: ['x'],
          texture: ['x'],
          rhythm: ['x'],
          taste: ['x'],
        },
        {},
      );
      expect(name).toBe('Unknown Arranger');
    });
  });
});
