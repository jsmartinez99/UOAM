import { Dimensions6D, ArrangerProfile } from '../domain/arranger-profile.js';
import { XMLParser } from 'fast-xml-parser';

/**
 * Servicio para analizar archivos musicales (MusicXML, MIDI) y extraer
 * la firma 6D del arreglista.
 * 
 * En una implementación real, esto usaría librerías como:
 * - musicxml2json / fast-xml-parser para MusicXML
 * - midi-parser-js / tone para MIDI
 * - Análisis armónico, rítmico, textural, etc.
 */

// ─── Patrones de detección por dimensión ────────────────────────────

const ORGANOLOGY_PATTERNS = [
  'flute', 'piccolo', 'oboe', 'clarinet', 'bassoon',
  'horn', 'trumpet', 'trombone', 'tuba',
  'violin', 'viola', 'cello', 'double bass',
  'piano', 'harp', 'guitar', 'percussion',
  'saxophone', 'alto sax', 'tenor sax', 'baritone sax',
  'flugelhorn', 'euphonium', 'english horn', 'bass clarinet',
];

const HARMONY_PATTERNS = [
  'major 7', 'minor 7', 'dominant 7', 'diminished 7', 'half diminished',
  '9th', '11th', '13th', 'altered', 'sus4', 'sus2',
  'tritone substitution', 'secondary dominant', 'modal interchange',
  'quartal harmony', 'quintal harmony', 'cluster', 'polychord',
  'upper structure triad', 'slash chord', 'pedal point',
];

const COUNTERPOINT_PATTERNS = [
  'canon', 'fugue', 'invertible counterpoint', 'imitation',
  'stretto', 'augmentation', 'diminution', 'retrograde',
  'parallel motion', 'contrary motion', 'oblique motion',
  'voice leading', 'suspension', 'anticipation', 'appoggiatura',
  'passing tone', 'neighbor tone', 'escape tone',
];

const TEXTURE_PATTERNS = [
  'homophonic', 'polyphonic', 'monophonic', 'heterophonic',
  'divisi', 'unison', 'octave doubling', 'close voicing',
  'open voicing', 'drop 2', 'drop 3', 'spread voicing',
  'block chords', 'shell voicings', 'guide tones',
  'layered', 'call and response', 'antiphonal',
];

const RHYTHM_PATTERNS = [
  'swing', 'straight', 'latin', 'bossa nova', 'samba',
  'afro-cuban', 'clave', 'montuno', 'tumbao',
  'syncopation', 'hemiola', 'cross rhythm', 'polyrhythm',
  'rubato', 'accelerando', 'ritardando', 'fermata',
  'shuffle', 'funk', 'rock', 'ballad', 'waltz',
];

const TASTE_PATTERNS = [
  'ogerman swell', 'basie ending', 'ellington dissonance',
  'gil evans texture', 'thad jones voicing', 'nestico simplicity',
  'holman color', 'mccoy modal', 'jarrett lyricism',
  'hancock harmony', 'chick corea rhythm', 'wayne shorter space',
];

// ─── Utilidades ────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ');
}

function detectPatterns(text: string, patterns: string[]): string[] {
  const normalized = normalizeText(text);
  return patterns.filter((p) => normalized.includes(p.toLowerCase()));
}

function extractUnique(arr: string[]): string[] {
  return [...new Set(arr)];
}

function ensureNonEmpty(arr: string[], fallback: string[]): string[] {
  return arr.length > 0 ? arr : fallback;
}

// ─── Análisis MusicXML ──────────────────────────────────────────────

function analyzeMusicXML(xmlContent: string): Dimensions6D {
  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    const result = parser.parse(xmlContent);
    const score = result['score-partwise'] || result;
    
    const allText = JSON.stringify(score);
    const partNames = score.partList?.['score-part']?.map((p: { 'part-name'?: { '#text'?: string } }) => p['part-name']?.['#text'] || '') || [];
    const partNamesText = partNames.join(' ');

    // Extract all text content for pattern matching
    const fullText = allText + ' ' + partNamesText;
    
    return {
      organology: ensureNonEmpty(
        extractUnique([
          ...detectPatterns(fullText, ORGANOLOGY_PATTERNS),
          ...partNames.map((n: string) => normalizeText(n)).filter(Boolean),
        ]),
        ['ensemble']
      ),
      harmony: ensureNonEmpty(
        extractUnique(detectPatterns(fullText, HARMONY_PATTERNS)),
        ['traditional harmony']
      ),
      counterpoint: ensureNonEmpty(
        extractUnique(detectPatterns(fullText, COUNTERPOINT_PATTERNS)),
        ['homophonic']
      ),
      texture: ensureNonEmpty(
        extractUnique(detectPatterns(fullText, TEXTURE_PATTERNS)),
        ['homophonic']
      ),
      rhythm: ensureNonEmpty(
        extractUnique(detectPatterns(fullText, RHYTHM_PATTERNS)),
        ['straight']
      ),
      taste: ensureNonEmpty(
        extractUnique(detectPatterns(fullText, TASTE_PATTERNS)),
        ['personal style']
      ),
    };
  } catch {
    // Fallback si falla el parsing
    return getDefaultDimensions();
  }
}

// ─── Análisis MIDI (parser real) ──────────────────────────────────

function readUInt16BE(buf: Buffer, offset: number): number {
  return (buf[offset] << 8) | buf[offset + 1];
}

function readUInt32BE(buf: Buffer, offset: number): number {
  return (buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3];
}

function readVariableLength(buf: Buffer, offset: number): { value: number; bytesRead: number } {
  let value = 0;
  let bytesRead = 0;
  let byte: number;
  do {
    if (offset + bytesRead >= buf.length) return { value: 0, bytesRead };
    byte = buf[offset + bytesRead++];
    value = (value << 7) | (byte & 0x7f);
  } while (byte & 0x80 && bytesRead < 4);
  return { value, bytesRead };
}

function detectTempoBPM(buf: Buffer): number | null {
  let offset = 14;
  if (buf.toString('ascii', 0, 4) !== 'MThd' || buf.toString('ascii', 8, 12) !== 'MTrk') {
    return null;
  }
  while (offset < buf.length - 8) {
    const header = buf.toString('ascii', offset, offset + 4);
    if (header === 'MTrk') {
      const trackLen = readUInt32BE(buf, offset + 4);
      const trackEnd = offset + 8 + trackLen;
      let pos = offset + 8;
      while (pos < trackEnd - 7) {
        const vlq = readVariableLength(buf, pos);
        pos += vlq.bytesRead;
        const status = buf[pos];
        if (status === 0xff && buf[pos + 1] === 0x51 && buf[pos + 2] === 0x03) {
          const microsPerQuarter = (buf[pos + 3] << 16) | (buf[pos + 4] << 8) | buf[pos + 5];
          return Math.round(60_000_000 / microsPerQuarter);
        }
        pos += 1;
      }
      offset = trackEnd;
    } else {
      offset += 1;
    }
  }
  return null;
}

function countTracks(buf: Buffer): number {
  if (buf.toString('ascii', 0, 4) !== 'MThd') return 0;
  return readUInt16BE(buf, 10);
}

function analyzeMIDI(buffer: Buffer): Dimensions6D {
  const tracks = countTracks(buffer);
  const bpm = detectTempoBPM(buffer);
  const hasMultipleTracks = tracks >= 2;

  const rhythmTags: string[] = [];
  if (bpm !== null) {
    if (bpm < 70) rhythmTags.push('ballad');
    else if (bpm < 100) rhythmTags.push('swing', 'shuffle');
    else if (bpm < 140) rhythmTags.push('funk', 'latin', 'bossa nova');
    else rhythmTags.push('rock', 'latin');
  } else {
    rhythmTags.push('straight');
  }

  return {
    organology: hasMultipleTracks ? ['ensemble', 'keyboard', 'bass', 'drums'] : ['keyboard'],
    harmony: hasMultipleTracks ? ['traditional harmony', 'quartal harmony'] : ['traditional harmony'],
    counterpoint: hasMultipleTracks ? ['polyphonic', 'voice leading'] : ['homophonic'],
    texture: hasMultipleTracks ? ['layered', 'homophonic'] : ['homophonic'],
    rhythm: rhythmTags,
    taste: ['personal style'],
  };
}

function getDefaultDimensions(): Dimensions6D {
  return {
    organology: ['ensemble'],
    harmony: ['traditional harmony'],
    counterpoint: ['homophonic'],
    texture: ['homophonic'],
    rhythm: ['straight'],
    taste: ['personal style'],
  };
}

// ─── Servicio principal ────────────────────────────────────────────

export class MusicFileAnalyzer {
  /**
   * Analiza un archivo musical y extrae la firma 6D
   */
   static async analyze(file: Buffer, mimeType: string, filename: string): Promise<{
     dimensions: Dimensions6D;
     detectedFormat: string;
     confidence: number;
     metadata: Record<string, unknown>;
   }> {
     let dimensions: Dimensions6D;
     let detectedFormat = 'unknown';
     let confidence = 0.5;
     const metadata: Record<string, unknown> = { filename };

      if (mimeType.includes('xml') || filename.endsWith('.xml') || filename.endsWith('.musicxml') || filename.endsWith('.mxl')) {
        detectedFormat = 'MusicXML';
        const xmlContent = file.toString('utf-8');
        dimensions = await analyzeMusicXML(xmlContent);
        metadata.format = 'MusicXML';
        metadata.size = file.length;
      } else if (mimeType.includes('midi') || filename.endsWith('.mid') || filename.endsWith('.midi')) {
        detectedFormat = 'MIDI';
        dimensions = analyzeMIDI(file);
        metadata.format = 'MIDI';
        metadata.size = file.length;
      } else {
        dimensions = getDefaultDimensions();
      }

     return { dimensions, detectedFormat, confidence, metadata };
   }

  /**
   * Genera un nombre sugerido para el perfil basado en el análisis
   */
   static suggestName(dimensions: Dimensions6D, metadata: Record<string, unknown>): string {
    const baseName = (metadata.filename as string | undefined)?.replace(/\.[^.]+$/, '') || 'Unknown Arranger';
    const dominantDim = Object.entries(dimensions)
      .sort((a, b) => b[1].length - a[1].length)[0];
    
    if (dominantDim[1].length > 3) {
      return `${baseName} (${dominantDim[0].charAt(0).toUpperCase() + dominantDim[0].slice(1)} focus)`;
    }
    return baseName;
  }

  /**
   * Analiza un archivo y devuelve un ArrangerProfile completo
   */
   async analyzeFile(buffer: Buffer, filename: string): Promise<{
     profile: ArrangerProfile;
     analysis: {
       dimensions: Dimensions6D;
       detectedFormat: string;
       confidence: number;
       metadata: Record<string, unknown>;
     };
   }> {
    const mimeType = filename.endsWith('.xml') || filename.endsWith('.musicxml') || filename.endsWith('.mxl')
      ? 'application/xml'
      : filename.endsWith('.mid') || filename.endsWith('.midi')
        ? 'audio/midi'
        : 'application/octet-stream';
    
    const analysis = await MusicFileAnalyzer.analyze(buffer, mimeType, filename);
    const name = MusicFileAnalyzer.suggestName(analysis.dimensions, analysis.metadata);
    const profile = new ArrangerProfile(name, analysis.dimensions);
    
    return { profile, analysis };
  }
}