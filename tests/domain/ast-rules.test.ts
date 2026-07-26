import { describe, it, expect } from 'vitest';
import { ContainerNode, NoteNode } from '../../src/domain/ast/nodes';
import { CounterpointRule } from '../../src/domain/ast/rules/counterpoint';
import { RhythmRule } from '../../src/domain/ast/rules/rhythm';

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
});
