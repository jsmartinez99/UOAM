import { Dimensions6D, ArrangerProfile } from '../domain/arranger-profile.js';

export interface ScoreNote {
  midi: number;
  durationBeats: number;
  voiceIndex: number;
}

export interface ChordEvent {
  barIndex: number;
  rootMidi: number;
  intervals: number[];
  quality: 'major' | 'minor' | 'dominant7' | 'major7' | 'minor7' | 'half-diminished7' | 'diminished7' | 'sus4';
  romanNumeral: string;
}

export interface SectionScore {
  notes: ScoreNote[];
  chords: ChordEvent[];
  melody: ScoreNote[];
  bassLine: ScoreNote[];
}

export interface ArrangementSection {
  name: 'Introduction' | 'Exposition' | 'Development' | 'Climax' | 'Coda';
  bars: { start: number; end: number };
  densityCap: number;
  dynamicEnvelope: 'ppp' | 'pp' | 'p' | 'mf' | 'f' | 'ff';
  activeInstruments: string[];
  harmonicTechniques: string[];
  counterpointMotion: 'contrary' | 'oblique' | 'parallel' | 'homophonic';
  aestheticGestures: string[];
  score: SectionScore;
}

export interface StandaloneArrangementOutput {
  title: string;
  targetArranger: string;
  keyCenter: string;
  tempoBpm: number;
  timeSignature: string;
  sections: ArrangementSection[];
  depthScore: number;
  isProfessionalAssimilation: boolean;
}

export interface GenerateArrangementOptions {
  title?: string;
  keyCenter?: string;
  tempoBpm?: number;
  timeSignature?: string;
  targetArrangerProfile?: ArrangerProfile;
  dimensionsOverride?: Partial<Dimensions6D>;
}

const PITCH_CLASSES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

const noteToMidi = (note: string, octave: number): number => {
  const pc = PITCH_CLASSES[note];
  if (pc === undefined) return 60;
  return (octave + 1) * 12 + pc;
};

interface ParsedKey {
  tonic: string;
  octave: number;
  mode: 'major' | 'minor';
}

const parseKey = (key: string | undefined): ParsedKey => {
  if (!key) return { tonic: 'C', octave: 4, mode: 'minor' };
  const m = key.match(/^([A-G][#b]?)\s*(major|minor|m|M)?\s*(\d)?/i);
  if (!m) return { tonic: 'C', octave: 4, mode: 'minor' };
  const octave = m[3] ? parseInt(m[3], 10) : 4;
  let mode: 'major' | 'minor' = 'major';
  if (m[2]) {
    const lower = m[2].toLowerCase();
    if (lower === 'm' || lower === 'minor') mode = 'minor';
  } else if (key.toLowerCase().endsWith('m') && !key.toLowerCase().endsWith(' major')) {
    mode = 'minor';
  }
  return { tonic: m[1], octave, mode };
};

const SCALE_INTERVALS: Record<'major' | 'minor', number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const buildTonicMidi = (parsed: ParsedKey): number => noteToMidi(parsed.tonic, parsed.octave);

const buildScaleMidis = (parsed: ParsedKey): number[] => {
  const tonic = buildTonicMidi(parsed);
  return SCALE_INTERVALS[parsed.mode].map((iv) => tonic + iv);
};

const ROMAN_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const ROMAN_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

const CHORD_QUALITIES_MAJOR: Array<{ intervals: number[]; quality: ChordEvent['quality']; roman: string }> = [
  { intervals: [0, 4, 7], quality: 'major', roman: ROMAN_MAJOR[0] },
  { intervals: [0, 3, 7], quality: 'minor', roman: ROMAN_MAJOR[1] },
  { intervals: [0, 3, 7], quality: 'minor', roman: ROMAN_MAJOR[2] },
  { intervals: [0, 4, 7], quality: 'major', roman: ROMAN_MAJOR[3] },
  { intervals: [0, 4, 7], quality: 'major', roman: ROMAN_MAJOR[4] },
  { intervals: [0, 3, 7], quality: 'minor', roman: ROMAN_MAJOR[5] },
  { intervals: [0, 3, 6], quality: 'diminished7', roman: ROMAN_MAJOR[6] },
];

const CHORD_QUALITIES_MINOR: Array<{ intervals: number[]; quality: ChordEvent['quality']; roman: string }> = [
  { intervals: [0, 3, 7], quality: 'minor', roman: ROMAN_MINOR[0] },
  { intervals: [0, 3, 6], quality: 'half-diminished7', roman: ROMAN_MINOR[1] },
  { intervals: [0, 4, 7], quality: 'major', roman: ROMAN_MINOR[2] },
  { intervals: [0, 3, 7], quality: 'minor', roman: ROMAN_MINOR[3] },
  { intervals: [0, 4, 7], quality: 'major', roman: ROMAN_MINOR[4] },
  { intervals: [0, 3, 7], quality: 'major', roman: ROMAN_MINOR[5] },
  { intervals: [0, 4, 7], quality: 'major', roman: ROMAN_MINOR[6] },
];

const PROGRESSION_PATTERNS: Record<'intro' | 'exposition' | 'development' | 'climax' | 'coda', number[]> = {
  intro: [0, 5, 3, 4],
  exposition: [0, 3, 4, 0, 5, 4, 1, 4],
  development: [0, 1, 4, 5, 3, 6, 4, 1],
  climax: [5, 6, 4, 5, 3, 4, 0, 4],
  coda: [0, 4, 0],
};

const buildChordForDegree = (
  parsed: ParsedKey,
  scaleMidis: number[],
  degree: number,
  alterations: { bVII?: boolean; bIII?: boolean } = {},
): { rootMidi: number; intervals: number[]; quality: ChordEvent['quality']; roman: string } => {
  const qualities = parsed.mode === 'major' ? CHORD_QUALITIES_MAJOR : CHORD_QUALITIES_MINOR;
  const normalizedDegree = ((degree % 7) + 7) % 7;
  const base = qualities[normalizedDegree];
  let rootMidi = scaleMidis[normalizedDegree];
  let roman = base.roman;
  if (parsed.mode === 'minor') {
    if (normalizedDegree === 4) {
      rootMidi = scaleMidis[4];
      roman = 'V (raised 7th)';
      const tmp = qualities[6];
      return { rootMidi, intervals: tmp.intervals, quality: 'major', roman };
    }
  }
  if (alterations.bVII && normalizedDegree === 6) {
    return { rootMidi: scaleMidis[6] - 2, intervals: [0, 4, 7, 10], quality: 'dominant7', roman: '♭VII7' };
  }
  if (alterations.bIII && normalizedDegree === 2) {
    return { rootMidi: scaleMidis[2] - 2, intervals: [0, 4, 7], quality: 'major', roman: '♭III' };
  }
  return { rootMidi, intervals: base.intervals, quality: base.quality, roman };
};

const buildSectionScore = (
  sectionName: ArrangementSection['name'],
  parsedKey: ParsedKey,
  sectionBars: number,
  beatsPerBar: number,
  densityCap: number,
  counterpointMotion: ArrangementSection['counterpointMotion'],
  harmonicTechniques: string[],
): SectionScore => {
  const scaleMidis = buildScaleMidis(parsedKey);
  const phaseKey: keyof typeof PROGRESSION_PATTERNS =
    sectionName === 'Introduction' ? 'intro'
    : sectionName === 'Exposition' ? 'exposition'
    : sectionName === 'Development' ? 'development'
    : sectionName === 'Climax' ? 'climax'
    : 'coda';
  const progression = PROGRESSION_PATTERNS[phaseKey];
  const chords: ChordEvent[] = [];
  const alterationFlags = parseAlterations(harmonicTechniques);

  for (let bar = 0; bar < sectionBars; bar++) {
    const degree = progression[bar % progression.length];
    const built = buildChordForDegree(parsedKey, scaleMidis, degree, alterationFlags);
    chords.push({
      barIndex: bar,
      rootMidi: built.rootMidi,
      intervals: built.intervals,
      quality: built.quality,
      romanNumeral: built.roman,
    });
  }

  const voiceCount = Math.max(1, Math.min(3, Math.floor(densityCap / 35) + 1));
  const notes: ScoreNote[] = [];
  const melody: ScoreNote[] = [];
  const bassLine: ScoreNote[] = [];

  for (let bar = 0; bar < sectionBars; bar++) {
    const chord = chords[bar];
    const chordTones = chord.intervals.map((iv) => chord.rootMidi + iv);
    const bassRoot = chord.rootMidi - 12;
    bassLine.push({ midi: bassRoot, durationBeats: beatsPerBar, voiceIndex: 0 });

    let noteDuration: number;
    let subdivisionsPerBeat: number;
    if (densityCap >= 0.7) {
      noteDuration = 0.5;
      subdivisionsPerBeat = 2;
    } else if (densityCap >= 0.4) {
      noteDuration = 1;
      subdivisionsPerBeat = 1;
    } else {
      noteDuration = beatsPerBar;
      subdivisionsPerBeat = 0;
    }

    if (subdivisionsPerBeat === 0) {
      const beatStep = 0;
      const baseMidi = chordTones[beatStep % chordTones.length];
      if (counterpointMotion === 'homophonic' || voiceCount === 1) {
        notes.push({ midi: baseMidi, durationBeats: noteDuration, voiceIndex: 0 });
        for (let v = 1; v < voiceCount; v++) {
          const harmonyOffset = [0, -4, -7, 12, 7][v] ?? -4;
          notes.push({ midi: baseMidi + harmonyOffset, durationBeats: noteDuration, voiceIndex: v });
        }
      }
    } else {
      for (let beat = 0; beat < beatsPerBar; beat++) {
        for (let sub = 0; sub < subdivisionsPerBeat; sub++) {
          const beatStep = (beat * subdivisionsPerBeat + sub) % chordTones.length;
          const baseMidi = chordTones[beatStep];

          if (counterpointMotion === 'homophonic') {
            notes.push({ midi: baseMidi, durationBeats: noteDuration, voiceIndex: 0 });
            for (let v = 1; v < voiceCount; v++) {
              const harmonyOffset = [0, -4, -7, 12, 7][v] ?? -4;
              notes.push({ midi: baseMidi + harmonyOffset, durationBeats: noteDuration, voiceIndex: v });
            }
          } else if (counterpointMotion === 'parallel') {
            if (voiceCount >= 2) {
              notes.push({ midi: baseMidi, durationBeats: noteDuration, voiceIndex: 0 });
              notes.push({ midi: chordTones[(beatStep + 1) % chordTones.length] + 12, durationBeats: noteDuration, voiceIndex: 1 });
              if (voiceCount >= 3) notes.push({ midi: chordTones[(beatStep + 2) % chordTones.length] - 12, durationBeats: noteDuration, voiceIndex: 2 });
            } else {
              notes.push({ midi: baseMidi, durationBeats: noteDuration, voiceIndex: 0 });
            }
          } else {
            if (voiceCount >= 2) {
              notes.push({ midi: baseMidi, durationBeats: noteDuration, voiceIndex: 0 });
              if (sub === 0) {
                notes.push({ midi: baseMidi - 5, durationBeats: noteDuration, voiceIndex: 1 });
              } else {
                notes.push({ midi: baseMidi + 2, durationBeats: noteDuration, voiceIndex: 1 });
              }
              if (voiceCount >= 3) {
                notes.push({ midi: baseMidi + 7, durationBeats: noteDuration, voiceIndex: 2 });
              }
            } else {
              notes.push({ midi: baseMidi, durationBeats: noteDuration, voiceIndex: 0 });
            }
          }

          if (bar % 2 === 0 && beat === 0 && sub === 0) {
            melody.push({ midi: baseMidi + 12, durationBeats: 2, voiceIndex: 0 });
          }
        }
      }
    }
  }

  return { notes, chords, melody, bassLine };
};

const parseAlterations = (techniques: string[]): { bVII?: boolean; bIII?: boolean } => {
  const flags: { bVII?: boolean; bIII?: boolean } = {};
  for (const t of techniques) {
    const lower = t.toLowerCase();
    if (lower.includes('bvii') || lower.includes('♭vii') || lower.includes('mixolidian') || lower.includes('dorian')) {
      flags.bVII = true;
    }
    if (lower.includes('biii') || lower.includes('♭iii') || lower.includes('modal interchange') || lower.includes('picardy')) {
      flags.bIII = true;
    }
  }
  return flags;
};

export class StandaloneArrangerService {
  generateArrangement(options: GenerateArrangementOptions): StandaloneArrangementOutput {
    const title = options.title || 'Nuevo Arreglo Autónomo';
    const targetArranger = options.targetArrangerProfile?.name || 'Estilo Personalizado';
    const keyCenter = options.keyCenter || 'Cm';
    const tempoBpm = options.tempoBpm || 78;
    const timeSignature = options.timeSignature || '4/4';

    const dims: Dimensions6D = {
      organology: options.dimensionsOverride?.organology || options.targetArrangerProfile?.dimensions.organology || ['Violins I', 'Violins II', 'Violas', 'Acoustic Grand Piano'],
      harmony: options.dimensionsOverride?.harmony || options.targetArrangerProfile?.dimensions.harmony || ['Added 6th chords', 'Tritone substitution', 'Quartal voicings'],
      counterpoint: options.dimensionsOverride?.counterpoint || options.targetArrangerProfile?.dimensions.counterpoint || ['Contrary motion in 2 voices', 'Call and response'],
      texture: options.dimensionsOverride?.texture || options.targetArrangerProfile?.dimensions.texture || ['Ethereal cloud', '3-layer stratification', 'Delayed string entry'],
      rhythm: options.dimensionsOverride?.rhythm || options.targetArrangerProfile?.dimensions.rhythm || ['Rubato pulse', '6/8 vs 3/4 sesquiáltera'],
      taste: options.dimensionsOverride?.taste || options.targetArrangerProfile?.dimensions.taste || ['Riddle Lift', 'Ogerman Swell', 'Restraint first'],
    };

    const depthScore = this.calculateDepthScore(dims);
    const isProfessionalAssimilation = depthScore >= 0.85;

    const parsedKey = parseKey(keyCenter);
    const beatsPerBar = parseBeatsPerBar(timeSignature);

    const sectionDefs: Array<{
      name: ArrangementSection['name'];
      bars: { start: number; end: number };
      densityCap: number;
      dynamicEnvelope: ArrangementSection['dynamicEnvelope'];
      instrumentIndices: number[];
      harmonySlice: number[];
      counterpointMotion: ArrangementSection['counterpointMotion'];
      aestheticGestures: string[];
    }> = [
      {
        name: 'Introduction',
        bars: { start: 1, end: 8 },
        densityCap: 0.2,
        dynamicEnvelope: 'pp',
        instrumentIndices: [0],
        harmonySlice: [0],
        counterpointMotion: 'homophonic',
        aestheticGestures: dims.taste.filter((t) => t.toLowerCase().includes('lift') || t.toLowerCase().includes('restraint')).slice(0, 1),
      },
      {
        name: 'Exposition',
        bars: { start: 9, end: 24 },
        densityCap: 0.4,
        dynamicEnvelope: 'p',
        instrumentIndices: [0, 1],
        harmonySlice: [0, 1],
        counterpointMotion: 'contrary',
        aestheticGestures: dims.taste.slice(0, 1),
      },
      {
        name: 'Development',
        bars: { start: 25, end: 40 },
        densityCap: 0.7,
        dynamicEnvelope: 'mf',
        instrumentIndices: [0, 1, 2],
        harmonySlice: [0, 1, 2],
        counterpointMotion: 'contrary',
        aestheticGestures: dims.taste.filter((t) => t.toLowerCase().includes('swell') || t.toLowerCase().includes('voicing')).slice(0, 1),
      },
      {
        name: 'Climax',
        bars: { start: 41, end: 48 },
        densityCap: 0.9,
        dynamicEnvelope: 'f',
        instrumentIndices: dims.organology.length > 0
          ? Array.from({ length: Math.max(2, dims.organology.length) }, (_, i) => i % dims.organology.length)
          : [0],
        harmonySlice: [0, 1, 2, 3],
        counterpointMotion: 'contrary',
        aestheticGestures: dims.taste,
      },
      {
        name: 'Coda',
        bars: { start: 49, end: 56 },
        densityCap: 0.2,
        dynamicEnvelope: 'ppp',
        instrumentIndices: [0],
        harmonySlice: [dims.harmony.length - 1],
        counterpointMotion: 'homophonic',
        aestheticGestures: ['Early String Exit', 'Fade Out'],
      },
    ];

    const sections: ArrangementSection[] = sectionDefs.map((def) => {
      const sectionBars = def.bars.end - def.bars.start + 1;
        const harmonicTechniques = def.harmonySlice
          .map((i) => dims.harmony[i] || dims.harmony[dims.harmony.length - 1] || 'Pedal point')
          .filter((v, i, arr) => arr.indexOf(v) === i);
      const score = buildSectionScore(
        def.name,
        parsedKey,
        sectionBars,
        beatsPerBar,
        def.densityCap,
        def.counterpointMotion,
        harmonicTechniques,
      );
      return {
        name: def.name,
        bars: def.bars,
        densityCap: def.densityCap,
        dynamicEnvelope: def.dynamicEnvelope,
        activeInstruments: def.instrumentIndices
          .map((i) => dims.organology[i] || dims.organology[0] || 'Piano')
          .filter((v, i, arr) => arr.indexOf(v) === i),
        harmonicTechniques,
        counterpointMotion: def.counterpointMotion,
        aestheticGestures: def.aestheticGestures,
        score,
      };
    });

    return {
      title,
      targetArranger,
      keyCenter,
      tempoBpm,
      timeSignature,
      sections,
      depthScore,
      isProfessionalAssimilation,
    };
  }

  private calculateDepthScore(dims: Dimensions6D): number {
    let score = 0.5;
    const requiredKeywords = ['added 6th', 'quartal', 'contrary', 'swell', 'lift', 'sesquiáltera', '3+3+2', 'restraint', 'divisi'];

    let matchedDimensionsCount = 0;

    for (const key of Object.keys(dims) as Array<keyof Dimensions6D>) {
      const items = dims[key];
      const hasProfessionalKeyword = items.some((item) =>
        requiredKeywords.some((kw) => item.toLowerCase().includes(kw)),
      );
      if (hasProfessionalKeyword) {
        matchedDimensionsCount++;
      }
    }

    if (matchedDimensionsCount >= 4) {
      score += 0.38;
    } else if (matchedDimensionsCount >= 2) {
      score += 0.20;
    }

    return Math.min(1.0, Math.round(score * 100) / 100);
  }
}

const parseBeatsPerBar = (timeSig: string | undefined): number => {
  if (!timeSig) return 4;
  const m = timeSig.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 4;
};
