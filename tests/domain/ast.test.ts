import { describe, it, expect } from 'vitest';
import { ContainerNode } from '../../src/domain/ast/nodes';
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
});
