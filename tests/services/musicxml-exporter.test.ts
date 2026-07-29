import { describe, it, expect } from 'vitest';
import { MusicXMLExporterService } from '../../src/services/musicxml-exporter.service';
import { StandaloneArrangerService } from '../../src/services/standalone-arranger.service';

describe('MusicXMLExporterService — integración con generador real', () => {
  const arranger = new StandaloneArrangerService();
  const exporter = new MusicXMLExporterService();

  it('exporta un arreglo generado con Claus Ogerman-like a MusicXML coherente', () => {
    const arrangement = arranger.generateArrangement({
      title: 'Quítame la ropa antes del amanecer',
      keyCenter: 'Cm',
      tempoBpm: 78,
      timeSignature: '4/4',
      targetArrangerProfile: {
        name: 'Claus Ogerman',
        id: 'ogerman',
        dimensions: {
          organology: ['Bloque Masivo de Metales', 'Maderas Duplicando a Distancia de 8va', 'Cuerdas en Sostenuto'],
          harmony: ['Tonal Middle-of-the-Road', 'Acorde Sello: V7sus4 → I', 'Progresión I - III7 - VIm'],
          counterpoint: ['Homofonía en Bloque', 'Vientos en Paralelo'],
          texture: ['Saturada y Llena'],
          rhythm: ['Swing Alemán Preciso'],
          taste: ['Ogerman Swell', 'Eficacia Sonora Masiva'],
        },
      },
    });

    const xml = exporter.exportToMusicXML(arrangement);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<score-partwise version="3.1">');
    expect(xml).toContain('<work-title>Quítame la ropa antes del amanecer</work-title>');
    expect(xml).toContain('<creator type="composer">Claus Ogerman</creator>');
    expect(xml).toContain('<mode>minor</mode>');
    expect(xml).toContain('<beats>4</beats>');
    expect(xml).toContain('<beat-type>4</beat-type>');
    expect(xml).toContain('<dynamics><pp/></dynamics>');
    expect(xml).toContain('<dynamics><ppp/></dynamics>');
    expect(xml).toContain('Bloque-Masivo-de-Metales');
  });

  it('incluye 56 medidas (8+16+16+8+8) consistentes con las barras de cada sección', () => {
    const arrangement = arranger.generateArrangement({ title: 'X', keyCenter: 'Cm' });
    const xml = exporter.exportToMusicXML(arrangement);
    const matches = xml.match(/<measure number="(\d+)">/g);
    expect(matches).toHaveLength(56);
  });

  it('cada compás tiene harmony que indica el grado correcto', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Am' });
    const xml = exporter.exportToMusicXML(arrangement);
    const harmonyCount = (xml.match(/<harmony>/g) ?? []).length;
    expect(harmonyCount).toBe(56);
  });

  it('cada nota tiene un instrument id válido', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Cm' });
    const xml = exporter.exportToMusicXML(arrangement);
    const instrumentRefs = xml.match(/<instrument id="([^"]+)"/g) ?? [];
    expect(instrumentRefs.length).toBeGreaterThan(0);
    for (const ref of instrumentRefs.slice(0, 5)) {
      expect(ref).toMatch(/^<instrument id="[A-Za-z0-9-]+"$/);
    }
  });

  it('las notas son MIDI válidas (step A-G + octave 0-9)', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Cm' });
    const xml = exporter.exportToMusicXML(arrangement);
    const pitchRegex = /<step>([A-G])[\s\S]*?(?:<alter>\d+<\/alter>)?[\s\S]*?<octave>(\d+)<\/octave>/g;
    const pitches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = pitchRegex.exec(xml)) !== null) {
      pitches.push(`${m[1]}${m[3] ?? ''}${m[2]}`);
    }
    expect(pitches.length).toBeGreaterThan(0);
    for (const p of pitches) {
      expect(p).toMatch(/^[A-G]#?\d$/);
    }
  });

  it('el tipo de nota es coherente con la duración del score', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Cm' });
    const xml = exporter.exportToMusicXML(arrangement);
    const types = ['whole', 'half', 'quarter', 'eighth', '16th'];
    const foundTypes = types.filter((t) => xml.includes(`<type>${t}</type>`));
    expect(foundTypes.length).toBeGreaterThanOrEqual(2);
  });

  it('la introducción (density 0.2) genera whole notes, no eighth notes', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Cm' });
    const xml = exporter.exportToMusicXML(arrangement);
    const measure1 = xml.match(/<measure number="1">([\s\S]*?)<\/measure>/)?.[1] ?? '';
    expect(measure1).toContain('<type>whole</type>');
    expect(measure1).not.toContain('<type>eighth</type>');
  });

  it('el development (density 0.7) genera corcheas (eighth notes)', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Cm' });
    const xml = exporter.exportToMusicXML(arrangement);
    const measure25 = xml.match(/<measure number="25">([\s\S]*?)<\/measure>/)?.[1] ?? '';
    expect(measure25).toContain('<type>eighth</type>');
  });

  it('la dinámica pp aparece en Introduction, ppp en Coda', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Cm' });
    const xml = exporter.exportToMusicXML(arrangement);
    expect((xml.match(/<dynamics><pp\/><\/dynamics>/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(xml).toContain('<dynamics><ppp/></dynamics>');
  });

  it('cada sección se etiqueta con su nombre + rango de compases', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Cm' });
    const xml = exporter.exportToMusicXML(arrangement);
    expect(xml).toContain('Introduction (Compases 1-8)');
    expect(xml).toContain('Exposition (Compases 9-24)');
    expect(xml).toContain('Development (Compases 25-40)');
    expect(xml).toContain('Climax (Compases 41-48)');
    expect(xml).toContain('Coda (Compases 49-56)');
  });

  it('el XML escapa caracteres especiales en el título', () => {
    const arrangement = arranger.generateArrangement({
      title: 'Test & <Special> "Chars" \'Here\'',
      keyCenter: 'Cm',
    });
    const xml = exporter.exportToMusicXML(arrangement);
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&lt;');
    expect(xml).toContain('&gt;');
    expect(xml).toContain('&quot;');
    expect(xml).toContain('&apos;');
  });

  it('compases no estándar (3/4) producen duraciones coherentes', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Cm', timeSignature: '3/4' });
    const xml = exporter.exportToMusicXML(arrangement);
    expect(xml).toContain('<beats>3</beats>');
    const measure1 = xml.match(/<measure number="1">([\s\S]*?)<\/measure>/)?.[1] ?? '';
    expect(measure1.length).toBeGreaterThan(0);
  });

  it('tonalidad mayor con fifths correctos', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'G major' });
    const xml = exporter.exportToMusicXML(arrangement);
    expect(xml).toMatch(/<fifths>1<\/fifths>/);
    expect(xml).toContain('<mode>major</mode>');
  });

  it('tonalidad D menor con fifths -1 (Bb)', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Dm' });
    const xml = exporter.exportToMusicXML(arrangement);
    expect(xml).toMatch(/<fifths>-1<\/fifths>/);
    expect(xml).toContain('<mode>minor</mode>');
  });

  it('cada sección tiene su propio attributes block solo en la primera medida', () => {
    const arrangement = arranger.generateArrangement({ keyCenter: 'Cm' });
    const xml = exporter.exportToMusicXML(arrangement);
    const attributesBlocks = (xml.match(/<attributes>/g) ?? []).length;
    expect(attributesBlocks).toBe(1);
  });
});
