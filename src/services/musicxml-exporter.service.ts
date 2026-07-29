import { StandaloneArrangementOutput, ScoreNote, ChordEvent } from './standalone-arranger.service.js';

const PITCH_CLASSES: Array<{ sharp: string; flat: string }> = [
  { sharp: 'C', flat: 'C' },
  { sharp: 'C#', flat: 'Db' },
  { sharp: 'D', flat: 'D' },
  { sharp: 'D#', flat: 'Eb' },
  { sharp: 'E', flat: 'E' },
  { sharp: 'F', flat: 'F' },
  { sharp: 'F#', flat: 'Gb' },
  { sharp: 'G', flat: 'G' },
  { sharp: 'G#', flat: 'Ab' },
  { sharp: 'A', flat: 'A' },
  { sharp: 'A#', flat: 'Bb' },
  { sharp: 'B', flat: 'B' },
];

const midiToPitch = (midi: number): { step: string; octave: number; alter: number } => {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const entry = PITCH_CLASSES[pc];
  const alter = entry.sharp.includes('#') ? 1 : 0;
  return { step: entry.sharp.charAt(0), octave, alter };
};

const parseTimeSignature = (ts: string | undefined): { beats: number; beatType: number } => {
  if (!ts) return { beats: 4, beatType: 4 };
  const m = ts.match(/^(\d+)\/(\d+)$/);
  if (!m) return { beats: 4, beatType: 4 };
  return { beats: parseInt(m[1], 10), beatType: parseInt(m[2], 10) };
};

const parseKeyFifths = (key: string | undefined): { fifths: number; mode: 'major' | 'minor' } => {
  const m = key?.match(/^([A-G][#b]?)\s*(major|minor|m|M)?/i);
  if (!m) return { fifths: 0, mode: 'minor' };
  const tonic = m[1];
  const modeRaw = (m[2] || '').toLowerCase();
  const keyLower = (key ?? '').toLowerCase();
  const isMinor = modeRaw === 'm' || modeRaw === 'minor' || (!modeRaw && keyLower.endsWith('m') && !keyLower.endsWith(' major'));
  const majorFifths: Record<string, number> = {
    C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
    F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
  };
  const order = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
  const tonicIdx = order.indexOf(tonic);
  let fifths: number;
  if (isMinor && tonicIdx >= 0) {
    const relativeMajorIdx = (tonicIdx - 3 + order.length) % order.length;
    fifths = majorFifths[order[relativeMajorIdx]] ?? 0;
  } else {
    fifths = majorFifths[tonic] ?? 0;
  }
  return { fifths, mode: isMinor ? 'minor' : 'major' };
};

const durationToType = (durationBeats: number, beatType: number): { type: string; divisions: number } => {
  const divisions = durationBeats * (4 / beatType);
  if (divisions === 4) return { type: 'whole', divisions: 4 };
  if (divisions === 2) return { type: 'half', divisions: 2 };
  if (divisions === 1) return { type: 'quarter', divisions: 1 };
  if (divisions === 0.5) return { type: 'eighth', divisions: 0.5 };
  if (divisions === 0.25) return { type: '16th', divisions: 0.25 };
  if (divisions >= 4) return { type: 'whole', divisions: Math.round(divisions) };
  if (divisions >= 2) return { type: 'half', divisions: Math.round(divisions * 2) / 2 };
  if (divisions >= 1) return { type: 'quarter', divisions: Math.round(divisions * 4) / 4 };
  if (divisions >= 0.5) return { type: 'eighth', divisions: Math.round(divisions * 8) / 8 };
  return { type: '16th', divisions: Math.round(divisions * 16) / 16 };
};

const renderNoteXml = (note: ScoreNote, instrumentIds: string[], beatType: number): string => {
  const { step, octave, alter } = midiToPitch(note.midi);
  const { type, divisions } = durationToType(note.durationBeats, beatType);
  const alterXml = alter === 1 ? `<alter>${alter}</alter>` : '';
  const instrumentXml = instrumentIds.length > 0
    ? `\n        <instrument id="${instrumentIds[note.voiceIndex % instrumentIds.length]}"/>`
    : '';
  return `
      <note>${instrumentXml}
        <pitch>
          <step>${step}</step>
          ${alterXml}
          <octave>${octave}</octave>
        </pitch>
        <duration>${divisions}</duration>
        <voice>${note.voiceIndex + 1}</voice>
        <type>${type}</type>
      </note>`;
};

const renderMeasureXml = (
  measureNumber: number,
  sectionName: string,
  dynamicEnvelope: string,
  beats: number,
  beatType: number,
  isFirstMeasure: boolean,
  fifths: number,
  mode: 'major' | 'minor',
  chord: ChordEvent | null,
  notes: ScoreNote[],
  instruments: string[],
): string => {
  const chordAnnotation = chord
    ? `\n      <harmony>
        <root>
          <root-step>${midiToPitch(chord.rootMidi).step}</root-step>
          ${midiToPitch(chord.rootMidi).alter === 1 ? `<root-alter>1</root-alter>` : ''}
        </root>
        <kind text="${chord.quality}">${chordKindAttribute(chord.quality)}</kind>
      </harmony>`
    : '';
  const notesXml = notes.map((n) => renderNoteXml(n, instruments, beatType)).join('');
  const attributes = isFirstMeasure
    ? `
      <attributes>
        <divisions>4</divisions>
        <key>
          <fifths>${fifths}</fifths>
          <mode>${mode}</mode>
        </key>
        <time>
          <beats>${beats}</beats>
          <beat-type>${beatType}</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>`
    : '';
  return `
    <measure number="${measureNumber}">${attributes}
      <direction placement="above">
        <direction-type>
          <words font-weight="bold">${sectionName}</words>
        </direction-type>
      </direction>
      <direction placement="below">
        <direction-type>
          <dynamics><${dynamicEnvelope}/></dynamics>
        </direction-type>
      </direction>${chordAnnotation}${notesXml}
    </measure>`;
};

const chordKindAttribute = (quality: ChordEvent['quality']): string => {
  switch (quality) {
    case 'major': return 'major';
    case 'minor': return 'minor';
    case 'dominant7': return 'dominant';
    case 'major7': return 'major-seventh';
    case 'minor7': return 'minor-seventh';
    case 'half-diminished7': return 'half-diminished';
    case 'diminished7': return 'diminished-seventh';
    case 'sus4': return 'major';
    default: return 'major';
  }
};

export class MusicXMLExporterService {
  exportToMusicXML(arrangement: StandaloneArrangementOutput): string {
    const { beats, beatType } = parseTimeSignature(arrangement.timeSignature);
    const { fifths, mode } = parseKeyFifths(arrangement.keyCenter);
    const partName = `${arrangement.targetArranger} Ensemble`;

    let measureNumber = 1;
    let isFirst = true;
    const measuresXml = arrangement.sections
      .flatMap((sec) => {
        const sectionBars = sec.bars.end - sec.bars.start + 1;
        const measures: string[] = [];
        const sectionInstruments = sec.activeInstruments.map((s) => s.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'));

        const notesByBar: ScoreNote[][] = Array.from({ length: sectionBars }, () => []);
        let cursor = 0;
        for (const note of sec.score.notes) {
          const barIdx = Math.floor(cursor / beats);
          if (barIdx >= sectionBars) break;
          if (cursor % beats + note.durationBeats > beats) {
            cursor = (barIdx + 1) * beats;
          }
          const targetBar = Math.floor(cursor / beats);
          if (targetBar >= sectionBars) break;
          notesByBar[targetBar].push(note);
          cursor += note.durationBeats;
        }

        for (let b = 0; b < sectionBars; b++) {
          const chord = sec.score.chords.find((c) => c.barIndex === b) ?? null;
          const measureNotes = notesByBar[b].length > 0
            ? notesByBar[b]
            : [{ midi: 60, durationBeats: beats, voiceIndex: 0 }];
          measures.push(
            renderMeasureXml(
              measureNumber,
              `${sec.name} (Compases ${sec.bars.start}-${sec.bars.end})`,
              sec.dynamicEnvelope,
              beats,
              beatType,
              isFirst,
              fifths,
              mode,
              chord,
              measureNotes,
              sectionInstruments,
            ),
          );
          measureNumber++;
          isFirst = false;
        }
        return measures;
      })
      .join('');

    const allInstruments = new Set<string>();
    arrangement.sections.forEach((sec) => {
      sec.activeInstruments.forEach((inst) => {
        allInstruments.add(inst.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'));
      });
    });
    const instrumentIds = [...allInstruments];
    const partListXml = instrumentIds.length > 0
      ? instrumentIds.map((id, i) => `    <score-part id="${id}">
      <part-name>P${i + 1}</part-name>
    </score-part>`).join('\n')
      : `    <score-part id="P1">
      <part-name>${this.escapeXml(partName)}</part-name>
    </score-part>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${this.escapeXml(arrangement.title)}</work-title>
  </work>
  <identification>
    <creator type="composer">${this.escapeXml(arrangement.targetArranger)}</creator>
    <encoding>
      <software>UOAM Arranger Ecosystem</software>
    </encoding>
    <rights>UOAM System - Asimilación Profesional (Score: ${Math.round(arrangement.depthScore * 100)}%)</rights>
  </identification>
  <part-list>
${partListXml}
  </part-list>
  <part id="${instrumentIds[0] ?? 'P1'}">${measuresXml}
  </part>
</score-partwise>`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
