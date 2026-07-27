import { describe, it, expect } from 'vitest';
import { HybridEngine } from '../../src/engines/hybrid-engine';
import { ArrangerProfile } from '../../src/domain/arranger-profile';

describe('Carlos Centurión Bicultural Hybridization', () => {
  const hybridEngine = new HybridEngine();

  const centurionProfile = new ArrangerProfile('Carlos Centurión', {
    organology: ['Grand Piano', 'Tenor Sax', 'Upright Bass', 'Paraguayan Percussion'],
    harmony: ['Quartal Voicings', 'Maj9(#11)', 'Paraguayan Folklore Jazz Fusion', 'SubTritone Substitutions'],
    counterpoint: ['Polyrhythmic Counterpoint', '3rds/6ths Parallel Lines', 'Call and Response Fills'],
    texture: ['Harp-like Piano Cascades', '3-Layer Stratification', '6/8 vs 3/4 Polyrhythmic Texture'],
    rhythm: ['Sesquiáltera (6/8 vs 3/4)', 'Kyre\'y Syncopation', 'Polka Paraguaya Groove', 'Jazz Swing Fusion'],
    taste: ['Cascada & McCoy Voicing', 'Paraguayan Jazz Identity', 'Respect for Folcloric Rhythm'],
  });

  const ogermanProfile = new ArrangerProfile('Claus Ogerman', {
    organology: ['Violins I (divisi)', 'Violins II (divisi)', 'Violas'],
    harmony: ['Lush Voicings', 'Added 6th chords'],
    counterpoint: ['Contrary motion in 2 voices'],
    texture: ['Transparent Density', 'Ethereal Cloud', 'Delayed String Entry'],
    rhythm: ['Bossa Nova', 'Subtle Pulse'],
    taste: ['Ogerman Swell', 'Restraint First', 'Anti-Climax'],
  });

  const piazzollaProfile = new ArrangerProfile('Astor Piazzolla', {
    organology: ['Bandoneon', 'Violin', 'Contrabass', 'Piano'],
    harmony: ['Minor Keys', 'Chromaticism'],
    counterpoint: ['Fugue', 'Imitative Counterpoint'],
    texture: ['Aggressive Divisi'],
    rhythm: ['3+3+2 Accentuation', 'Tango Nuevo rhythm'],
    taste: ['Piazzolla Accent', 'Rubato Transitions'],
  });

  it('debe hibridar Carlos Centurión con Claus Ogerman manteniendo la sesquiáltera y las cuerdas etéreas', () => {
    const { mergedProfile } = hybridEngine.mergeFullSignatures(
      centurionProfile.dimensions,
      ogermanProfile.dimensions,
    );

    expect(mergedProfile).toBeDefined();

    // Verificar preservación de organología bicultural
    expect(mergedProfile.organology).toContain('Grand Piano');
    expect(mergedProfile.organology.some((item) => item.includes('Violins'))).toBe(true);

    // Verificar mezcla de rítmica paraguaya y textura de contención de Ogerman
    expect(mergedProfile.rhythm.some((item) => item.includes('Sesquiáltera') || item.includes('6/8'))).toBe(true);
    expect(mergedProfile.taste.some((item) => item.includes('Ogerman Swell') || item.includes('Restraint'))).toBe(true);
  });

  it('debe hibridar Carlos Centurión con Astor Piazzolla fusionando polirritmia paraguaya y Tango Nuevo', () => {
    const { mergedProfile } = hybridEngine.mergeFullSignatures(
      centurionProfile.dimensions,
      piazzollaProfile.dimensions,
    );

    expect(mergedProfile).toBeDefined();
    expect(mergedProfile.rhythm.some((item) => item.includes('3+3+2') || item.includes('Sesquiáltera'))).toBe(true);
    expect(mergedProfile.harmony.some((item) => item.includes('Quartal') || item.includes('Minor Keys'))).toBe(true);
  });
});
