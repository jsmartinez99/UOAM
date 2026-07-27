import { describe, it, expect } from 'vitest';
import { ContainerNode, NoteNode, ChordNode } from '../../src/domain/ast/nodes';
import { CounterpointRule } from '../../src/domain/ast/rules/counterpoint';
import { RhythmRule } from '../../src/domain/ast/rules/rhythm';
import { TransposeRule } from '../../src/domain/ast/rules/transpose';
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
});
