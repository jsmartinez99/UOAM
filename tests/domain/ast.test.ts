import { describe, it, expect } from 'vitest';
import { ContainerNode, NoteNode, ChordNode } from '../../src/domain/ast/nodes';
import { ASTParser } from '../../src/domain/ast/parser';

describe('AST Engine', () => {
  it('debe parsear una estructura simple a AST', () => {
    const parser = new ASTParser();
    const data = {
      type: 'ContainerNode',
      children: [
        { type: 'NoteNode', pitch: 'C4', duration: 1 },
        { type: 'ChordNode', notes: [{ type: 'NoteNode', pitch: 'E4', duration: 1 }] }
      ]
    };
    const ast = parser.parse(data);
    expect(ast).toBeInstanceOf(ContainerNode);
    expect((ast as ContainerNode).children).toHaveLength(2);
  });

  it('debe parsear un NoteNode standalone', () => {
    const parser = new ASTParser();
    const ast = parser.parse({ type: 'NoteNode', pitch: 'G4', duration: 0.5 });
    expect(ast).toBeInstanceOf(NoteNode);
    expect((ast as NoteNode).pitch).toBe('G4');
    expect((ast as NoteNode).duration).toBe(0.5);
  });

  it('debe parsear un ChordNode con múltiples notas', () => {
    const parser = new ASTParser();
    const ast = parser.parse({
      type: 'ChordNode',
      notes: [
        { type: 'NoteNode', pitch: 'C4', duration: 1 },
        { type: 'NoteNode', pitch: 'E4', duration: 1 },
        { type: 'NoteNode', pitch: 'G4', duration: 1 },
      ],
    });
    expect(ast).toBeInstanceOf(ChordNode);
    expect((ast as ChordNode).notes).toHaveLength(3);
  });

  it('debe lanzar error si ChordNode contiene children no-NoteNode', () => {
    const parser = new ASTParser();
    expect(() =>
      parser.parse({
        type: 'ChordNode',
        notes: [{ type: 'ContainerNode', children: [] }],
      }),
    ).toThrow(/ChordNode children must be NoteNode/);
  });

  it('debe lanzar error con tipo de nodo desconocido', () => {
    const parser = new ASTParser();
    expect(() => parser.parse({ type: 'UnknownNode' })).toThrow(/Unknown node type/);
  });
});
