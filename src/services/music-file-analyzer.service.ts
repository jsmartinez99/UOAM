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

interface MeasureAnalysis {
  sectionName: string;
  dynamics: string;
  instrument: string;
  measureNumber: number;
}

function extractMeasuresFromPart(part: Record<string, unknown>): Record<string, unknown>[] {
  const raw = part['measure'] as Record<string, unknown>[] | Record<string, unknown> | undefined;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function extractDirectionWords(dirType: Record<string, unknown>): string {
  const words = dirType['words'];
  if (!words) return '';
  if (typeof words === 'string') return words;
  if (typeof words === 'object') {
    const text = (words as Record<string, unknown>)['#text'];
    return typeof text === 'string' ? text : '';
  }
  return '';
}

function extractDynamics(dirType: Record<string, unknown>): string {
  const dyn = dirType['dynamics'];
  if (!dyn || typeof dyn !== 'object') return '';
  const keys = Object.keys(dyn as Record<string, unknown>).filter(k => !k.startsWith('@_') && k !== '#text');
  return keys.length > 0 ? keys[0] : '';
}

function extractInstrumentId(note: Record<string, unknown>): string {
  const instr = note['instrument'];
  if (!instr || typeof instr !== 'object') return '';
  return (instr as Record<string, unknown>)['@_id'] as string || '';
}

const INSTRUMENT_ID_MAP: Record<string, string> = {
  'Tenor-Sax': 'Tenor Sax',
  'Alto-Sax': 'Alto Sax',
  'Baritone-Sax': 'Baritone Sax',
  'Soprano-Sax': 'Soprano Sax',
  'Trumpet': 'Trumpet',
  'Trombone': 'Trombone',
  'Bass': 'Double Bass',
  'Piano': 'Piano',
  'Guitar': 'Guitar',
  'Drums': 'Drums',
  'Percussion': 'Percussion',
  'Flute': 'Flute',
  'Clarinet': 'Clarinet',
  'Horn': 'French Horn',
  'Tuba': 'Tuba',
  'Violin': 'Violin',
  'Viola': 'Viola',
  'Cello': 'Cello',
  'Contrabass': 'Contrabass',
  'Harp': 'Harp',
};

function getSectionWord(sectionName: string): string {
  return sectionName.split('(')[0]?.trim() || sectionName;
}

function parseMeasureRange(sectionWord: string): { sectionName: string; start: number; end: number } | null {
  const match = sectionWord.match(/Compases\s+(\d+)\s*-\s*(\d+)/i);
  if (match) {
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    const sectionName = getSectionWord(sectionWord);
    return { sectionName, start, end };
  }
  return null;
}

function analyzeMusicXML(xmlContent: string): { dimensions: Dimensions6D; metadata: Record<string, unknown> } {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
    const result = parser.parse(xmlContent);
    const score = (result['score-partwise'] || result) as Record<string, unknown>;

    const allText = JSON.stringify(score);

    // ── 1. Extract part names ──
    const partList = score['part-list'] as Record<string, unknown> | undefined;
    const rawScoreParts = partList?.['score-part'];
    const scoreParts: Record<string, unknown>[] = rawScoreParts
      ? Array.isArray(rawScoreParts) ? rawScoreParts : [rawScoreParts]
      : [];
    const partNames: string[] = scoreParts.map(p => {
      const name = p['part-name'];
      if (typeof name === 'string') return name;
      if (name && typeof name === 'object') return (name as Record<string, unknown>)['#text'] as string || '';
      return '';
    }).filter(Boolean);

    // ── 2. Parse measures ──
    const partsData = score['part'];
    const partArray: Record<string, unknown>[] = partsData
      ? Array.isArray(partsData) ? partsData : [partsData]
      : [];

    const measures: MeasureAnalysis[] = [];
    const allInstruments = new Set<string>();
    const allDynamics = new Set<string>();
    const allSectionWords: string[] = [];

    for (const part of partArray) {
      for (const measure of extractMeasuresFromPart(part)) {
        const measureNum = parseInt(String(measure['@_number'] ?? '0'), 10);
        const dirs = measure['direction'];
        const directionArray: Record<string, unknown>[] = dirs
          ? Array.isArray(dirs) ? dirs : [dirs]
          : [];

        let sectionWord = '';
        let dynamics = '';

        for (const dir of directionArray) {
          const dt = dir['direction-type'] as Record<string, unknown> | undefined;
          if (!dt) continue;
          const w = extractDirectionWords(dt);
          if (w) sectionWord = w;
          const d = extractDynamics(dt);
          if (d) dynamics = d;
        }

        // Instrument from notes
        const notes = measure['note'];
        const noteArray: Record<string, unknown>[] = notes
          ? Array.isArray(notes) ? notes : [notes]
          : [];
        let instrument = '';
        for (const note of noteArray) {
          const instrId = extractInstrumentId(note);
          if (instrId) {
            instrument = INSTRUMENT_ID_MAP[instrId] || instrId.replace(/-/g, ' ');
            allInstruments.add(instrument);
          }
        }

        // Parse measure range from section word (e.g., "Introduction (Compases 1-8)")
        const rangeInfo = parseMeasureRange(sectionWord);
        if (rangeInfo) {
          // Expand this single measure into multiple measures based on the range
          const { sectionName, start, end } = rangeInfo;
          for (let m = start; m <= end; m++) {
            allSectionWords.push(sectionName);
            if (dynamics) allDynamics.add(dynamics);
            measures.push({ sectionName, dynamics, instrument, measureNumber: m });
          }
        } else {
          // No range found, use as-is
          if (sectionWord) allSectionWords.push(sectionWord);
          if (dynamics) allDynamics.add(dynamics);
          measures.push({ sectionName: sectionWord, dynamics, instrument, measureNumber: measureNum });
        }
      }
    }

    // ── 3. Key / time from first measure ──
    let keyFifths = 0;
    let keyMode = 'major';
    let timeBeats = 4;
    let timeBeatType = 4;

    for (const part of partArray) {
      const mArr = extractMeasuresFromPart(part);
      if (mArr.length > 0) {
        const attrs = mArr[0]['attributes'] as Record<string, unknown> | undefined;
        if (attrs) {
          const key = attrs['key'] as Record<string, unknown> | undefined;
          if (key) {
            keyFifths = Number(key['fifths'] ?? 0);
            keyMode = String(key['mode'] ?? 'major');
          }
          const time = attrs['time'] as Record<string, unknown> | undefined;
          if (time) {
            timeBeats = Number(time['beats'] ?? 4);
            timeBeatType = Number(time['beat-type'] ?? 4);
          }
        }
      }
      break;
    }

    // ── 4. Build 6D from structured data ──

    // Organology: part names + instrument refs
    let organology: string[] = [];
    if (partNames.length > 0) organology.push(...partNames.map(n => normalizeText(n)));
    if (allInstruments.size > 0) organology.push(...Array.from(allInstruments));
    organology = [...new Set(organology)];

    // Supplement with keyword matching on full text
    const kwOrganology = detectPatterns(allText, ORGANOLOGY_PATTERNS);
    organology = extractUnique([...organology, ...kwOrganology]);

    // Harmony: derived from key + keyword match
    let harmony: string[] = ['traditional harmony'];
    if (keyMode === 'minor') harmony.push('modal harmony', 'minor tonality');
    if (keyFifths !== 0) harmony.push('diatonic');
    const kwHarmony = detectPatterns(allText, HARMONY_PATTERNS);
    harmony = extractUnique([...harmony, ...kwHarmony]);

    // Counterpoint: section structure suggests formal counterpoint
    let counterpoint: string[] = ['homophonic', 'voice leading'];
    if (allSectionWords.length > 1) {
      counterpoint.push('sectional form', 'formal structure');
    }
    const kwCounterpoint = detectPatterns(allText, COUNTERPOINT_PATTERNS);
    counterpoint = extractUnique([...counterpoint, ...kwCounterpoint]);

    // Texture: derived from part/instrument count
    let texture: string[] = ['homophonic'];
    if (allInstruments.size <= 2) texture.push('solo texture', 'intimate');
    else if (allInstruments.size <= 5) texture.push('small ensemble');
    else texture.push('orchestral');
    if (partNames.length > 0) texture.push('ensemble texture');
    const kwTexture = detectPatterns(allText, TEXTURE_PATTERNS);
    texture = extractUnique([...texture, ...kwTexture]);

    // Rhythm: time signature + keyword match
    let rhythm: string[] = [];
    if (timeBeats === 4 && timeBeatType === 4) {
      rhythm.push('straight', 'ballad', '4/4');
    } else if (timeBeats === 3) {
      rhythm.push('waltz', '3/4');
    } else {
      rhythm.push('straight');
    }
    const kwRhythm = detectPatterns(allText, RHYTHM_PATTERNS);
    rhythm = extractUnique([...rhythm, ...kwRhythm]);

    // Taste: section words → structural features, dynamics arc
    let taste: string[] = ['personal style', 'hybrid approach'];
    const sectionNames = allSectionWords.map(s => getSectionWord(s));
    const dynamisArray = Array.from(allDynamics);

    if (sectionNames.length > 0) {
      taste.push('formal analysis', 'structural narrative');
      if (sectionNames.some(n => /introduction/i.test(n))) taste.push('thematic introduction');
      if (sectionNames.some(n => /exposition/i.test(n))) taste.push('expository development');
      if (sectionNames.some(n => /development/i.test(n))) taste.push('developmental variation');
      if (sectionNames.some(n => /climax|climactic/i.test(n))) taste.push('climactic peak');
      if (sectionNames.some(n => /coda/i.test(n))) taste.push('resolving coda');
    }
    if (dynamisArray.length > 1) {
      taste.push('dynamic narrative arc', 'expressive range');
    }
    const kwTaste = detectPatterns(allText, TASTE_PATTERNS);
    taste = extractUnique([...taste, ...kwTaste]);

    const dimensions: Dimensions6D = {
      organology: ensureNonEmpty(organology, ['ensemble']),
      harmony: ensureNonEmpty(harmony, ['traditional harmony']),
      counterpoint: ensureNonEmpty(counterpoint, ['homophonic']),
      texture: ensureNonEmpty(texture, ['homophonic']),
      rhythm: ensureNonEmpty(rhythm, ['straight']),
      taste: ensureNonEmpty(taste, ['personal style']),
    };

    // ── 5. Metadata ──
    const metadata: Record<string, unknown> = {
      format: 'MusicXML',
      partNames,
      instrumentCount: allInstruments.size,
      instruments: Array.from(allInstruments),
      measures: measures.length,
      sections: allSectionWords,
      dynamics: dynamisArray,
      keySignature: `${keyFifths} ${keyMode}`,
      timeSignature: `${timeBeats}/${timeBeatType}`,
      structuralAnalysis: measures.map(m => ({
        measure: m.measureNumber,
        section: m.sectionName || undefined,
        dynamics: m.dynamics || undefined,
        instrument: m.instrument || undefined,
      })),
    };

    return { dimensions, metadata };
  } catch {
    return { dimensions: getDefaultDimensions(), metadata: { format: 'MusicXML' } };
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

/**
 * Servicio de análisis de archivos musicales (MusicXML y MIDI).
 *
 * Detecta el formato por MIME type o extensión, parsea el contenido,
 * y extrae una firma 6D parcial mediante heurísticas (no análisis
 * simbólico profundo).
 */
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
        const parsed = await analyzeMusicXML(xmlContent);
        dimensions = parsed.dimensions;
        Object.assign(metadata, parsed.metadata);
        metadata.size = file.length;
      } else if (mimeType.includes('midi') || filename.endsWith('.mid') || filename.endsWith('.midi')) {
        detectedFormat = 'MIDI';
        dimensions = analyzeMIDI(file);
        metadata.format = 'MIDI';
        metadata.size = file.length;
      } else if (mimeType.includes('wav') || filename.endsWith('.wav')) {
        detectedFormat = 'WAV';
        dimensions = getDefaultDimensions();
        metadata.format = 'WAV';
        metadata.size = file.length;
      } else if (mimeType.includes('mp3') || filename.endsWith('.mp3') || mimeType.includes('mpeg')) {
        detectedFormat = 'MP3';
        dimensions = getDefaultDimensions();
        metadata.format = 'MP3';
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
        : filename.endsWith('.wav')
          ? 'audio/wav'
          : filename.endsWith('.mp3')
            ? 'audio/mp3'
            : 'application/octet-stream';
    
    const analysis = await MusicFileAnalyzer.analyze(buffer, mimeType, filename);
    const name = MusicFileAnalyzer.suggestName(analysis.dimensions, analysis.metadata);
    const profile = new ArrangerProfile(name, analysis.dimensions);
    
    return { profile, analysis };
  }
}