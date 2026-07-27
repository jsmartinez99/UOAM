import { readFileSync } from 'fs';
import { SymbolicIngestor, IngestorResult } from './ingestor.interface';
import { XMLParser } from 'fast-xml-parser';
import { Midi } from '@tonejs/midi';

export class SymbolicIngestorImpl implements SymbolicIngestor {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true,
  });

  async ingest(filePath: string): Promise<IngestorResult> {
    if (
      filePath.endsWith('.musicxml') ||
      filePath.endsWith('.xml') ||
      filePath.endsWith('.mxl')
    ) {
      return this.parseMusicXML(filePath);
    } else if (filePath.endsWith('.mid') || filePath.endsWith('.midi')) {
      return this.parseMIDI(filePath);
    }
    throw new Error('Formato no soportado');
  }

  private parseMusicXML(filePath: string): IngestorResult {
    const xmlContent = readFileSync(filePath, 'utf-8');
    const parsed = this.parser.parse(xmlContent);

    const features = this.extractMusicXMLFeatures(parsed);
    return { rawFeatures: features };
  }

  private parseMIDI(filePath: string): IngestorResult {
    const buffer = readFileSync(filePath);
    const midi = new Midi(buffer);

    const features = this.extractMIDIFeatures(midi);
    return { rawFeatures: features };
  }

  private extractMIDIFeatures(midi: Midi): Record<string, unknown> {
    return {
      format: 'midi',
      duration: midi.duration,
      ppq: midi.header.ppq,
      timeSignatures: midi.header.timeSignatures.map((ts: any) => ({
        ticks: ts.ticks,
        numerator: ts.numerator,
        denominator: ts.denominator,
      })),
      tempos: midi.header.tempos.map((t: any) => ({
        ticks: t.ticks,
        bpm: t.bpm,
      })),
      tracks: midi.tracks.map(track => ({
        name: track.name,
        instrument: track.instrument,
        channel: track.channel,
        notes: track.notes.map(note => ({
          name: note.name,
          midi: note.midi,
          time: note.time,
          duration: note.duration,
          velocity: note.velocity,
        })),
        controlChanges: Array.isArray(track.controlChanges)
          ? track.controlChanges.map((cc: any) => ({
              number: cc.number,
              value: cc.value,
              time: cc.time,
            }))
          : Object.values(track.controlChanges as any).map((cc: any) => ({
              number: cc.number,
              value: cc.value,
              time: cc.time,
            })),
        pitchBends: track.pitchBends.map((pb: any) => ({
          value: pb.value,
          time: pb.time,
        })),
      })),
    };
  }

  private extractMusicXMLFeatures(parsed: unknown): Record<string, unknown> {
    const score = this.getScorePart(parsed);
    if (!score) {
      return { format: 'musicxml', error: 'No valid score found' };
    }

    return {
      format: 'musicxml',
      title: this.extractTitle(score),
      composer: this.extractComposer(score),
      parts: this.extractParts(score),
      keySignatures: this.extractKeySignatures(score),
      timeSignatures: this.extractTimeSignatures(score),
      tempo: this.extractTempo(score),
      measures: this.extractMeasures(score),
      instruments: this.extractInstruments(score),
    };
  }

  private getScorePart(parsed: unknown): Record<string, unknown> | null {
    if (parsed && typeof parsed === 'object' && 'score-partwise' in parsed) {
      return (parsed as Record<string, unknown>)['score-partwise'] as Record<string, unknown>;
    }
    if (parsed && typeof parsed === 'object' && 'score-timewise' in parsed) {
      return (parsed as Record<string, unknown>)['score-timewise'] as Record<string, unknown>;
    }
    return null;
  }

  private extractTitle(score: Record<string, unknown>): string | undefined {
    const work = score['work'] as Record<string, unknown> | undefined;
    return work?.['work-title'] as string | undefined;
  }

  private extractComposer(score: Record<string, unknown>): string | undefined {
    const identification = score['identification'] as Record<string, unknown> | undefined;
    const creator = identification?.['creator'];
    if (!creator) return undefined;
    if (typeof creator === 'string') return creator;
    if (typeof creator === 'object' && creator !== null && '#text' in creator) {
      return creator['#text'] as string;
    }
    return undefined;
  }

  private extractParts(score: Record<string, unknown>): Array<Record<string, unknown>> {
    const partList = score['part-list'] as Record<string, unknown> | undefined;
    const scoreParts = partList?.['score-part'] as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
    
    if (!scoreParts) return [];
    return Array.isArray(scoreParts) ? scoreParts : [scoreParts];
  }

  private extractInstruments(score: Record<string, unknown>): string[] {
    const parts = this.extractParts(score);
    return parts
      .map(part => {
        const partName = part['part-name'] as string | Record<string, unknown> | undefined;
        return typeof partName === 'string' ? partName : partName?.['#text'] as string | undefined;
      })
      .filter((name): name is string => !!name);
  }

  private extractKeySignatures(score: Record<string, unknown>): Array<Record<string, unknown>> {
    const parts = score['part'] as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
    if (!parts) return [];
    const partArray = Array.isArray(parts) ? parts : [parts];
    
    const keySignatures: Array<Record<string, unknown>> = [];
    for (const part of partArray) {
      const measures = part['measure'] as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
      if (!measures) continue;
      const measuresArray = Array.isArray(measures) ? measures : [measures];
      for (const measure of measuresArray) {
        const attributes = measure['attributes'] as Record<string, unknown> | undefined;
        const key = attributes?.['key'] as Record<string, unknown> | undefined;
        if (key) {
          keySignatures.push({
            measure: measure['@_number'],
            fifths: key['fifths'],
            mode: key['mode'],
          });
        }
      }
    }
    return keySignatures;
  }

  private extractTimeSignatures(score: Record<string, unknown>): Array<Record<string, unknown>> {
    const parts = score['part'] as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
    if (!parts) return [];
    const partArray = Array.isArray(parts) ? parts : [parts];

    const timeSignatures: Array<Record<string, unknown>> = [];
    for (const part of partArray) {
      const rawMeasures = part['measure'] as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
      if (!rawMeasures) continue;
      const measures = Array.isArray(rawMeasures) ? rawMeasures : [rawMeasures];
      for (const measure of measures) {
        const attributes = measure['attributes'] as Record<string, unknown> | undefined;
        const time = attributes?.['time'] as Record<string, unknown> | undefined;
        if (time) {
          timeSignatures.push({
            measure: measure['@_number'],
            beats: time['beats'],
            'beat-type': time['beat-type'],
          });
        }
      }
    }
    return timeSignatures;
  }

  private extractTempo(score: Record<string, unknown>): Array<Record<string, unknown>> {
    const parts = score['part'] as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
    if (!parts) return [];
    const partArray = Array.isArray(parts) ? parts : [parts];

    const tempos: Array<Record<string, unknown>> = [];
    for (const part of partArray) {
      const rawMeasures = part['measure'] as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
      if (!rawMeasures) continue;
      const measures = Array.isArray(rawMeasures) ? rawMeasures : [rawMeasures];
      for (const measure of measures) {
        const direction = measure['direction'] as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
        if (!direction) continue;
        const dirArray = Array.isArray(direction) ? direction : [direction];
        for (const dir of dirArray) {
          const sound = dir['sound'] as Record<string, unknown> | undefined;
          if (sound && 'tempo' in sound) {
            tempos.push({
              measure: measure['@_number'],
              tempo: sound['tempo'],
            });
          }
        }
      }
    }
    return tempos;
  }

  private extractMeasures(score: Record<string, unknown>): Array<Record<string, unknown>> {
    const parts = score['part'] as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
    if (!parts) return [];
    const partArray = Array.isArray(parts) ? parts : [parts];

    // Return measures from the first part
    const firstPart = partArray[0];
    const rawMeasures = firstPart?.['measure'] as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
    if (!rawMeasures) return [];
    return Array.isArray(rawMeasures) ? rawMeasures : [rawMeasures];
  }
}
