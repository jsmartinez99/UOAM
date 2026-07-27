import { describe, it, expect } from 'vitest';
import { StandaloneArrangerService } from '../../src/services/standalone-arranger.service';
import { ArrangerProfile } from '../../src/domain/arranger-profile';
import { MusicFileAnalyzer } from '../../src/services/music-file-analyzer.service';

describe('arrangement-technical-transformation Specification', () => {
  const arrangerService = new StandaloneArrangerService();

  // ── Scenario 1: Traducción de rearmonización a parámetros técnicos ──
  it('Traducción de rearmonización a parámetros técnicos', () => {
    const profile = new ArrangerProfile('Claus Ogerman', {
      organology: ['Strings', 'Woodwinds'],
      harmony: ['Added 6th chords', 'Quartal voicings', 'Tritone substitution'],
      counterpoint: ['Contrary motion in 2 voices'],
      texture: ['Lush strings', 'Ethereal cloud'],
      rhythm: ['Bossa nova'],
      taste: ['Ogerman Swell', 'Restraint first'],
    });

    const result = arrangerService.generateArrangement({
      targetArrangerProfile: profile,
    });

    expect(result.sections).toHaveLength(5);
    expect(result.sections[1].harmonicTechniques).toContain('Added 6th chords');
  });

  // ── Scenario 2: Mapeo de gestos estéticos de autor en la dimensión de Gusto (Taste) ──
  it('Mapeo de gestos estéticos de autor en la dimensión de Gusto (Taste)', () => {
    const profile = new ArrangerProfile('Nelson Riddle', {
      organology: ['Violins', 'Brass Section'],
      harmony: ['Added 6th chords'],
      counterpoint: ['Independent lines'],
      texture: ['Dense saxes'],
      rhythm: ['Swing'],
      taste: ['Riddle Lift', 'Riddle Kick'],
    });

    const result = arrangerService.generateArrangement({
      targetArrangerProfile: profile,
    });

    const introGestures = result.sections[0].aestheticGestures;
    expect(introGestures.some((g) => g.includes('Riddle Lift'))).toBe(true);
  });

  // ── Scenario 3: Ingesta exitosa de la obra en MP3 ──
  it('Ingesta exitosa de la obra en MP3', async () => {
    const mockAudioBuffer = Buffer.from('MOCK_MP3_AUDIO_HEADER_DATA_QUITAME_LA_ROPA');
    const result = await MusicFileAnalyzer.analyze(mockAudioBuffer, 'audio/mpeg', 'Quítame la ropa antes del amanecer 1.mp3');

    expect(result).toBeDefined();
    expect(result.dimensions).toHaveProperty('organology');
    expect(result.dimensions).toHaveProperty('harmony');
    expect(result.dimensions).toHaveProperty('rhythm');
  });

  // ── Scenario 4: Re-armonización y orquestación estilo Claus Ogerman / Piazzolla ──
  it('Re-armonización y orquestación estilo Claus Ogerman / Piazzolla', () => {
    const ogermanProfile = new ArrangerProfile('Claus Ogerman', {
      organology: ['Violins I', 'Violins II', 'Violas'],
      harmony: ['Added 6th chords', 'Quartal voicings'],
      counterpoint: ['Contrary motion'],
      texture: ['Lush strings', 'Delayed string entry'],
      rhythm: ['Bossa nova'],
      taste: ['Ogerman Swell', 'Restraint first'],
    });

    const result = arrangerService.generateArrangement({
      title: 'Quítame la ropa antes del amanecer (Estilo Ogerman)',
      targetArrangerProfile: ogermanProfile,
      keyCenter: 'Cm',
      tempoBpm: 78,
    });

    expect(result.title).toContain('Quítame la ropa antes del amanecer');
    expect(result.sections[2].aestheticGestures.some((g) => g.includes('Ogerman Swell'))).toBe(true);
  });

  // ── Scenario 5: Generación autónoma de arreglo en 5 secciones desde cero ──
  it('Generación autónoma de arreglo en 5 secciones desde cero', () => {
    const result = arrangerService.generateArrangement({
      title: 'Arreglo Autónomo Piazzolla 3+3+2',
      dimensionsOverride: {
        organology: ['Bandoneon', 'Violin', 'Contrabass', 'Piano'],
        harmony: ['Minor Keys', 'Quartal voicings', 'Tritone substitution'],
        counterpoint: ['Fugue', 'Contrary motion'],
        texture: ['Aggressive Divisi', 'Divisi'],
        rhythm: ['3+3+2 Accentuation', 'Sesquiáltera'],
        taste: ['Piazzolla Accent', 'Rubato Lift'],
      },
    });

    expect(result.sections).toHaveLength(5);
    expect(result.sections.map((s) => s.name)).toEqual([
      'Introduction',
      'Exposition',
      'Development',
      'Climax',
      'Coda',
    ]);
  });

  // ── Scenario 6: Certificación de Asimilación Profesional Completa ──
  it('Certificación de Asimilación Profesional Completa', () => {
    const professionalProfile = new ArrangerProfile('Carlos Centurión', {
      organology: ['Grand Piano', 'Tenor Sax', 'Upright Bass', 'Violins I (divisi)'],
      harmony: ['Quartal voicings', 'Added 6th chords', 'Tritone substitution'],
      counterpoint: ['Contrary motion in 2 voices'],
      texture: ['Harp-like Piano Cascades', 'Ethereal cloud'],
      rhythm: ['Sesquiáltera (6/8 vs 3/4)', '3+3+2 Accentuation'],
      taste: ['Cascada & McCoy Voicing', 'Ogerman Swell', 'Riddle Lift', 'Restraint first'],
    });

    const result = arrangerService.generateArrangement({
      targetArrangerProfile: professionalProfile,
    });

    expect(result.depthScore).toBeGreaterThanOrEqual(0.85);
    expect(result.isProfessionalAssimilation).toBe(true);
  });
});
