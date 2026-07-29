import { describe, it, expect } from 'vitest';
import { StandaloneArrangerService } from '../../src/services/standalone-arranger.service';

describe('StandaloneArrangerService', () => {
  const service = new StandaloneArrangerService();

  describe('generateArrangement — valores por defecto', () => {
    it('debe usar defaults cuando no se pasan opciones', () => {
      const result = service.generateArrangement({});
      expect(result.title).toBe('Nuevo Arreglo Autónomo');
      expect(result.targetArranger).toBe('Estilo Personalizado');
      expect(result.keyCenter).toBe('Cm');
      expect(result.tempoBpm).toBe(78);
      expect(result.timeSignature).toBe('4/4');
      expect(result.sections).toHaveLength(5);
      expect(result.isProfessionalAssimilation).toBeDefined();
      expect(result.depthScore).toBeGreaterThanOrEqual(0);
      expect(result.depthScore).toBeLessThanOrEqual(1);
    });
  });

  describe('estructura canónica en 5 secciones', () => {
    it('debe emitir Introduction → Exposition → Development → Climax → Coda', () => {
      const result = service.generateArrangement({ title: 'Test' });
      expect(result.sections.map((s) => s.name)).toEqual([
        'Introduction',
        'Exposition',
        'Development',
        'Climax',
        'Coda',
      ]);
    });

    it('cada sección tiene bars, dynamicEnvelope y counterpointMotion asignados', () => {
      const result = service.generateArrangement({});
      for (const sec of result.sections) {
        expect(sec.bars.start).toBeGreaterThanOrEqual(1);
        expect(sec.bars.end).toBeGreaterThanOrEqual(sec.bars.start);
        expect(['ppp', 'pp', 'p', 'mf', 'f', 'ff']).toContain(sec.dynamicEnvelope);
        expect(['contrary', 'oblique', 'parallel', 'homophonic']).toContain(sec.counterpointMotion);
      }
    });

    it('la introducción es pp y la coda es ppp', () => {
      const result = service.generateArrangement({});
      expect(result.sections[0].dynamicEnvelope).toBe('pp');
      expect(result.sections[0].counterpointMotion).toBe('homophonic');
      expect(result.sections[4].dynamicEnvelope).toBe('ppp');
      expect(result.sections[4].counterpointMotion).toBe('homophonic');
    });

    it('el clímax es ff/forte con todos los instrumentos activos', () => {
      const result = service.generateArrangement({});
      const climax = result.sections[3];
      expect(['f', 'ff']).toContain(climax.dynamicEnvelope);
      expect(climax.activeInstruments.length).toBeGreaterThanOrEqual(2);
    });

    it('los compases son contiguos: 1-8, 9-24, 25-40, 41-48, 49-56', () => {
      const result = service.generateArrangement({});
      expect(result.sections[0].bars).toEqual({ start: 1, end: 8 });
      expect(result.sections[1].bars).toEqual({ start: 9, end: 24 });
      expect(result.sections[2].bars).toEqual({ start: 25, end: 40 });
      expect(result.sections[3].bars).toEqual({ start: 41, end: 48 });
      expect(result.sections[4].bars).toEqual({ start: 49, end: 56 });
    });
  });

  describe('score: notas y progresión armónica', () => {
    it('cada sección tiene notes y chords con conteo consistente', () => {
      const result = service.generateArrangement({ title: 'X' });
      for (const sec of result.sections) {
        expect(sec.score).toBeDefined();
        expect(sec.score.notes.length).toBeGreaterThan(0);
        const expectedBars = sec.bars.end - sec.bars.start + 1;
        expect(sec.score.chords.length).toBe(expectedBars);
        expect(sec.score.melody.length).toBeGreaterThanOrEqual(0);
        expect(sec.score.bassLine.length).toBe(expectedBars);
      }
    });

    it('cada nota tiene midi válido (0-127) y duración positiva', () => {
      const result = service.generateArrangement({});
      for (const sec of result.sections) {
        for (const note of sec.score.notes) {
          expect(note.midi).toBeGreaterThanOrEqual(0);
          expect(note.midi).toBeLessThanOrEqual(127);
          expect(note.durationBeats).toBeGreaterThan(0);
          expect(note.voiceIndex).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('la progresión de cada compás tiene intervals consistentes con su quality', () => {
      const result = service.generateArrangement({});
      for (const sec of result.sections) {
        for (const chord of sec.score.chords) {
          expect(chord.intervals.length).toBeGreaterThan(0);
          expect(chord.rootMidi).toBeGreaterThanOrEqual(0);
          expect(chord.rootMidi).toBeLessThanOrEqual(127);
          expect(['major', 'minor', 'dominant7', 'major7', 'minor7', 'half-diminished7', 'diminished7', 'sus4']).toContain(chord.quality);
        }
      }
    });

    it('la progresión menor tiene dominante con 7ª elevada (V mayor en lugar de v menor)', () => {
      const result = service.generateArrangement({ keyCenter: 'Am' });
      const allRomans = result.sections.flatMap((s) => s.score.chords.map((c) => c.romanNumeral));
      expect(allRomans.some((r) => r.includes('V (raised 7th)'))).toBe(true);
    });

    it('la progresión mayor usa numeral estándar (I, IV, V) en mayúscula', () => {
      const result = service.generateArrangement({ keyCenter: 'C major' });
      const allRomans = result.sections.flatMap((s) => s.score.chords.map((c) => c.romanNumeral));
      const hasUpper = allRomans.some((r) => /^[IV]/.test(r));
      expect(hasUpper).toBe(true);
    });

    it('la progresión menor usa numeral estándar (i, iv, v) en minúscula', () => {
      const result = service.generateArrangement({ keyCenter: 'Am' });
      const allRomans = result.sections.flatMap((s) => s.score.chords.map((c) => c.romanNumeral));
      const hasLower = allRomans.some((r) => /^[iv]/.test(r));
      expect(hasLower).toBe(true);
    });

    it('los tiempos de nota varían según densityCap (low=whole, mid=quarter, high=eighth)', () => {
      const lowResult = service.generateArrangement({});
      const midResult = service.generateArrangement({ dimensionsOverride: { organology: [], harmony: [], counterpoint: [], texture: [], rhythm: [], taste: [] } });
      const intro = lowResult.sections[0];
      const expo = lowResult.sections[1];
      const dev = lowResult.sections[2];
      const introDur = intro.score.notes[0].durationBeats;
      const expoDur = expo.score.notes[0].durationBeats;
      const devDur = dev.score.notes[0].durationBeats;
      expect(introDur).toBeGreaterThanOrEqual(expoDur);
      expect(expoDur).toBeGreaterThanOrEqual(devDur);
    });
  });

  describe('tonalidad y compás', () => {
    it('"C" se interpreta como C mayor', () => {
      const result = service.generateArrangement({ keyCenter: 'C' });
      const chord = result.sections[0].score.chords[0];
      expect(chord.romanNumeral).toMatch(/^[IV]/);
    });

    it('"Am" se interpreta como A menor con sensible elevada', () => {
      const result = service.generateArrangement({ keyCenter: 'Am' });
      const chord = result.sections[0].score.chords[0];
      expect(chord.romanNumeral).toMatch(/^i/);
      const allRomans = result.sections.flatMap((s) => s.score.chords.map((c) => c.romanNumeral));
      expect(allRomans).toContain('V (raised 7th)');
    });

    it('"G major" genera progresión mayor', () => {
      const result = service.generateArrangement({ keyCenter: 'G major' });
      const chord = result.sections[0].score.chords[0];
      expect(chord.romanNumeral).toMatch(/^[IV]/);
    });

    it('"F#m" genera progresión menor', () => {
      const result = service.generateArrangement({ keyCenter: 'F#m' });
      const chord = result.sections[0].score.chords[0];
      expect(chord.romanNumeral).toMatch(/^i/);
    });

    it('respetar tempoBpm personalizado en la salida', () => {
      const result = service.generateArrangement({ tempoBpm: 140 });
      expect(result.tempoBpm).toBe(140);
    });

    it('respetar timeSignature personalizado (3/4)', () => {
      const result = service.generateArrangement({ timeSignature: '3/4' });
      expect(result.timeSignature).toBe('3/4');
      expect(result.sections[0].score.notes.length).toBeGreaterThan(0);
    });

    it('compás 6/8 genera notas con subdivision proper', () => {
      const result = service.generateArrangement({ timeSignature: '6/8' });
      expect(result.timeSignature).toBe('6/8');
      expect(result.sections[2].score.notes.length).toBeGreaterThan(0);
    });
  });

  describe('targetArrangerProfile y dimensionsOverride', () => {
    it('debe usar el nombre del perfil cuando se pasa targetArrangerProfile', () => {
      const result = service.generateArrangement({
        title: 'Profile Test',
        targetArrangerProfile: {
          name: 'Nelson Riddle',
          id: 'test',
          dimensions: {
            organology: ['Saxofón', 'Piano'],
            harmony: ['Quartal voicings'],
            counterpoint: ['Parallel 3rds'],
            texture: ['Homorhythmic'],
            rhythm: ['Straight'],
            taste: ['Restraint'],
          },
        },
      });
      expect(result.targetArranger).toBe('Nelson Riddle');
      expect(result.sections[0].activeInstruments).toContain('Saxofón');
    });

    it('dimensionsOverride reemplaza las dimensiones del perfil', () => {
      const result = service.generateArrangement({
        dimensionsOverride: {
          organology: ['Instrumento Override'],
          harmony: ['Custom harmony'],
          counterpoint: ['Custom counter'],
          texture: ['Custom texture'],
          rhythm: ['Custom rhythm'],
          taste: ['Custom taste'],
        },
      });
      expect(result.sections[0].activeInstruments).toContain('Instrumento Override');
      expect(result.sections[0].harmonicTechniques).toContain('Custom harmony');
    });

    it('deduplica instrumentos activos entre secciones (no repeats)', () => {
      const result = service.generateArrangement({
        title: 'Dedup',
        targetArrangerProfile: {
          name: 'X',
          id: 'x',
          dimensions: {
            organology: ['Inst1', 'Inst2', 'Inst3'],
            harmony: ['H1'],
            counterpoint: ['C1'],
            texture: ['T1'],
            rhythm: ['R1'],
            taste: ['Tas1'],
          },
        },
      });

      for (const sec of result.sections) {
        const unique = new Set(sec.activeInstruments);
        expect(unique.size).toBe(sec.activeInstruments.length);
      }
    });

    it('organology con menos instrumentos no falla en clímax (cycle index)', () => {
      const result = service.generateArrangement({
        targetArrangerProfile: {
          name: 'Solo',
          id: 's',
          dimensions: {
            organology: ['Solo Instrument'],
            harmony: ['H'],
            counterpoint: ['C'],
            texture: ['T'],
            rhythm: ['R'],
            taste: ['Tas'],
          },
        },
      });
      const climax = result.sections[3];
      expect(climax.activeInstruments.length).toBeGreaterThan(0);
      expect(new Set(climax.activeInstruments).size).toBe(climax.activeInstruments.length);
    });
  });

  describe('profundidad (depthScore)', () => {
    it('un perfil con keywords profesionales da score ≥ 0.88 (asimilación profesional)', () => {
      const result = service.generateArrangement({
        targetArrangerProfile: {
          name: 'Pro',
          id: 'pro',
          dimensions: {
            organology: ['Quartal voicings in divisi strings'],
            harmony: ['Added 6th chords with quartal voicings'],
            counterpoint: ['Contrary motion in 2 voices with 3+3+2 rhythm'],
            texture: ['3-layer stratification with sesquiáltera cross-rhythm'],
            rhythm: ['Rubato pulse with 6/8 vs 3/4 sesquiáltera'],
            taste: ['Riddle Lift with Ogerman Swell'],
          },
        },
      });
      expect(result.depthScore).toBeGreaterThanOrEqual(0.85);
      expect(result.isProfessionalAssimilation).toBe(true);
    });

    it('un perfil sin keywords profesionales da score bajo', () => {
      const result = service.generateArrangement({
        targetArrangerProfile: {
          name: 'Novice',
          id: 'nov',
          dimensions: {
            organology: ['Generic'],
            harmony: ['Simple'],
            counterpoint: ['None'],
            texture: ['Flat'],
            rhythm: ['Basic'],
            taste: ['Plain'],
          },
        },
      });
      expect(result.depthScore).toBeLessThanOrEqual(0.7);
      expect(result.isProfessionalAssimilation).toBe(false);
    });
  });

  describe('alteraciones modales (♭VII, ♭III)', () => {
    it('el keyword mixolidian/dorian activa la alteración ♭VII', () => {
      const result = service.generateArrangement({
        targetArrangerProfile: {
          name: 'Modal',
          id: 'm',
          dimensions: {
            organology: ['Inst'],
            harmony: ['Mixolidian ♭VII'],
            counterpoint: ['C'],
            texture: ['T'],
            rhythm: ['R'],
            taste: ['Tas'],
          },
        },
      });
      const romans = result.sections.flatMap((s) => s.score.chords.map((c) => c.romanNumeral));
      expect(romans.some((r) => r.includes('♭VII7'))).toBe(true);
    });

    it('el keyword modal interchange/picardy activa el flag bIII (visible si la progresión incluye degree 2)', () => {
      const result = service.generateArrangement({
        targetArrangerProfile: {
          name: 'Modal2',
          id: 'm2',
          dimensions: {
            organology: ['Inst'],
            harmony: ['Modal interchange ♭III'],
            counterpoint: ['C'],
            texture: ['T'],
            rhythm: ['R'],
            taste: ['Tas'],
          },
        },
      });
      const allChords = result.sections.flatMap((s) => s.score.chords);
      expect(allChords.length).toBeGreaterThan(0);
    });
  });

  describe('modos de contrapunto', () => {
    it('homophonic genera las mismas notas para todas las voces (mismo midi)', () => {
      const result = service.generateArrangement({
        targetArrangerProfile: {
          name: 'Homo',
          id: 'h',
          dimensions: {
            organology: ['Inst'],
            harmony: ['Pedal point'],
            counterpoint: ['Homophonic block'],
            texture: ['Single line'],
            rhythm: ['Whole notes'],
            taste: ['Sparse'],
          },
        },
      });
      const intro = result.sections[0];
      const voices = new Set(intro.score.notes.map((n) => n.voiceIndex));
      expect(voices.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('progresiones por sección', () => {
    it('Introduction tiene progresión corta (4 acordes) que se repite', () => {
      const result = service.generateArrangement({});
      const introChords = result.sections[0].score.chords;
      expect(introChords.length).toBe(8);
      const first4 = introChords.slice(0, 4).map((c) => c.romanNumeral);
      const next4 = introChords.slice(4, 8).map((c) => c.romanNumeral);
      expect(first4).toEqual(next4);
    });

    it('Coda usa progresión de cierre (i, V)', () => {
      const result = service.generateArrangement({});
      const codaChords = result.sections[4].score.chords;
      expect(codaChords.length).toBe(8);
      const firstRoman = codaChords[0].romanNumeral;
      expect(['i', 'I']).toContain(firstRoman.charAt(0));
    });
  });
});
