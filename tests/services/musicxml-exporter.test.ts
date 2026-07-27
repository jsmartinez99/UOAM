import { describe, it, expect } from 'vitest';
import { MusicXMLExporterService } from '../../src/services/musicxml-exporter.service';
import { StandaloneArrangementOutput } from '../../src/services/standalone-arranger.service';

describe('MusicXMLExporterService', () => {
  const exporter = new MusicXMLExporterService();

  it('debe exportar un arreglo en 5 secciones a notación MusicXML válida', () => {
    const mockArrangement: StandaloneArrangementOutput = {
      title: 'Quítame la ropa antes del amanecer',
      targetArranger: 'Claus Ogerman',
      keyCenter: 'Cm',
      tempoBpm: 78,
      timeSignature: '4/4',
      depthScore: 0.88,
      isProfessionalAssimilation: true,
      sections: [
        {
          name: 'Introduction',
          bars: { start: 1, end: 8 },
          densityCap: 0.2,
          dynamicEnvelope: 'pp',
          activeInstruments: ['Piano'],
          harmonicTechniques: ['Pedal point'],
          counterpointMotion: 'homophonic',
          aestheticGestures: ['Restraint first'],
        },
        {
          name: 'Exposition',
          bars: { start: 9, end: 24 },
          densityCap: 0.4,
          dynamicEnvelope: 'p',
          activeInstruments: ['Violins I (divisi)', 'Violins II'],
          harmonicTechniques: ['Added 6th chords'],
          counterpointMotion: 'contrary',
          aestheticGestures: ['Ogerman Swell'],
        },
        {
          name: 'Development',
          bars: { start: 25, end: 40 },
          densityCap: 0.7,
          dynamicEnvelope: 'mf',
          activeInstruments: ['Violins I', 'Violins II', 'Violas'],
          harmonicTechniques: ['Quartal voicings'],
          counterpointMotion: 'contrary',
          aestheticGestures: ['Ogerman Swell'],
        },
        {
          name: 'Climax',
          bars: { start: 41, end: 48 },
          densityCap: 0.9,
          dynamicEnvelope: 'f',
          activeInstruments: ['Full String Orchestra'],
          harmonicTechniques: ['Altered dominants'],
          counterpointMotion: 'contrary',
          aestheticGestures: ['Ogerman Swell'],
        },
        {
          name: 'Coda',
          bars: { start: 49, end: 56 },
          densityCap: 0.2,
          dynamicEnvelope: 'ppp',
          activeInstruments: ['Piano'],
          harmonicTechniques: ['Cadential resolution'],
          counterpointMotion: 'homophonic',
          aestheticGestures: ['Fade Out'],
        },
      ],
    };

    const xml = exporter.exportToMusicXML(mockArrangement);

    expect(xml).toBeDefined();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<score-partwise version="3.1">');
    expect(xml).toContain('<work-title>Quítame la ropa antes del amanecer</work-title>');
    expect(xml).toContain('<creator type="composer">Claus Ogerman</creator>');
    expect(xml).toContain('Introduction (Compases 1-8)');
    expect(xml).toContain('Coda (Compases 49-56)');
  });
});
