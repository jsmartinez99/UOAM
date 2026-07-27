import { describe, it, expect } from 'vitest';
import { ContainerNode, NoteNode, ChordNode } from '../../src/domain/ast/nodes';
import { CounterpointRule } from '../../src/domain/ast/rules/counterpoint';
import { RhythmRule } from '../../src/domain/ast/rules/rhythm';
import { TransposeRule } from '../../src/domain/ast/rules/transpose';
import { FluteLowVoicingRule } from '../../src/domain/ast/rules/flute-low-voicing';
import { PiccoloLowRegisterRule } from '../../src/domain/ast/rules/piccolo-low-register';
import { TubaHighVoicingRule } from '../../src/domain/ast/rules/tuba-high-voicing';
import { RuleEngine } from '../../src/domain/ast/rule-engine';

describe('New AST Rules', () => {
  it('CounterpointRule debe simplificar notas cortas', () => {
    const rule = new CounterpointRule();
    const node = new ContainerNode([new NoteNode('C4', 0.2)]);
    const result = rule.apply(node);
    expect((result as ContainerNode).children[0]).toBeInstanceOf(NoteNode);
    expect(((result as ContainerNode).children[0] as NoteNode).duration).toBe(0.5);
  });

  it('RhythmRule debe simplificar ritmos muy complejos', () => {
    const rule = new RhythmRule();
    const node = new ContainerNode([new NoteNode('C4', 0.1)]);
    const result = rule.apply(node);
    expect((result as ContainerNode).children[0]).toBeInstanceOf(NoteNode);
    expect(((result as ContainerNode).children[0] as NoteNode).duration).toBe(0.25);
  });

  // ── RuleEngine: Aplicación recursiva en nodos hijos ──

  it('RuleEngine debe aplicar reglas recursivamente a nodos hijos anidados', () => {
    // Crear reglas: TransposeRule(2) para NoteNode → transpone 2 semitonos
    const rules = new Map<string, unknown>([
      ['NoteNode', new TransposeRule(2)],
    ]);
    const engine = new RuleEngine(rules as never);

    // Árbol anidado: Container > Container > [NoteNode, NoteNode]
    const innerContainer = new ContainerNode([
      new NoteNode('C4', 1.0),
      new NoteNode('E4', 0.5),
    ]);
    const outerContainer = new ContainerNode([innerContainer]);

    const result = engine.apply(outerContainer);

    // El resultado debe ser un ContainerNode
    expect(result).toBeInstanceOf(ContainerNode);
    const outerResult = result as ContainerNode;

    // El hijo debe ser un ContainerNode (estructura preservada)
    expect(outerResult.children[0]).toBeInstanceOf(ContainerNode);
    const innerResult = outerResult.children[0] as ContainerNode;

    // Los NoteNode deben haber sido transpuestos (TransposeRule aplicada recursivamente)
    expect((innerResult.children[0] as NoteNode).pitch).toBe('C4+2');
    expect((innerResult.children[1] as NoteNode).pitch).toBe('E4+2');
  });

  it('RuleEngine debe preservar tipos mixtos al aplicar reglas recursivas', () => {
    const rules = new Map<string, unknown>([
      ['NoteNode', new TransposeRule(1)],
    ]);
    const engine = new RuleEngine(rules as never);

    // Árbol con ChordNode y NoteNode mixtos
    const container = new ContainerNode([
      new ChordNode([new NoteNode('C4', 1.0), new NoteNode('E4', 1.0)]),
      new NoteNode('G4', 1.0),
    ]);

    const result = engine.apply(container);

    expect(result).toBeInstanceOf(ContainerNode);
    const containerResult = result as ContainerNode;

    // ChordNode preservado (visitChord no visita recursivamente sus NoteNode hijos)
    expect(containerResult.children[0]).toBeInstanceOf(ChordNode);

    // NoteNode en el nivel del container sí recibe TransposeRule
    expect(containerResult.children[1]).toBeInstanceOf(NoteNode);
    expect((containerResult.children[1] as NoteNode).pitch).toBe('G4+1');
  });

  // ── Voicing Rules: Resolución de conflictos de tesitura ──

  describe('Voicing Rules', () => {
    it('FluteLowVoicingRule debe transponer Low Close-Voicing a Medium', () => {
      const rule = new FluteLowVoicingRule();
      const node = new ContainerNode([
        new NoteNode('Low Close-Voicing (C2-C3)', 1.0),
        new NoteNode('C4', 0.5),
      ]);
      const result = rule.apply(node);

      expect(result).toBeInstanceOf(ContainerNode);
      const children = (result as ContainerNode).children;
      expect(children[0]).toBeInstanceOf(NoteNode);
      expect((children[0] as NoteNode).pitch).toBe('Medium Close-Voicing (C4-C5)');
      // Notes sin "Low Close-Voicing" se preservan
      expect((children[1] as NoteNode).pitch).toBe('C4');
    });

    it('PiccoloLowRegisterRule debe reemplazar "Low" por "High" en pitches', () => {
      const rule = new PiccoloLowRegisterRule();
      const node = new ContainerNode([
        new NoteNode('Low C6', 0.25),
        new NoteNode('C7', 0.5),
      ]);
      const result = rule.apply(node);

      const children = (result as ContainerNode).children;
      expect((children[0] as NoteNode).pitch).toBe('High C6');
      // Notes sin "Low" se preservan
      expect((children[1] as NoteNode).pitch).toBe('C7');
    });

    it('TubaHighVoicingRule debe transponer High Close-Voicing a Low', () => {
      const rule = new TubaHighVoicingRule();
      const node = new ContainerNode([
        new NoteNode('High Close-Voicing (C5-C6)', 2.0),
        new NoteNode('C3', 1.0),
      ]);
      const result = rule.apply(node);

      const children = (result as ContainerNode).children;
      expect((children[0] as NoteNode).pitch).toBe('Low Close-Voicing (C2-C3)');
      // Notes sin "High Close-Voicing" se preservan
      expect((children[1] as NoteNode).pitch).toBe('C3');
    });

    it('FluteLowVoicingRule preserva ChordNode sin modificar', () => {
      const rule = new FluteLowVoicingRule();
      const chord = new ChordNode([new NoteNode('Low Close-Voicing (C2-C3)', 1.0)]);
      const node = new ContainerNode([chord, new NoteNode('C4', 0.5)]);
      const result = rule.apply(node);

      const children = (result as ContainerNode).children;
      // ChordNode se preserva intacto (la regla solo modifica NoteNode)
      expect(children[0]).toBe(chord);
      expect((children[1] as NoteNode).pitch).toBe('C4');
    });
  });
});
