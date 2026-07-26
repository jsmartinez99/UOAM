import { BaseNode } from './base';
import { NoteNode, ChordNode, ContainerNode } from './nodes';

export class ASTParser {
  parse(data: any): BaseNode {
    if (data.type === 'NoteNode') {
      return new NoteNode(data.pitch, data.duration);
    }
    if (data.type === 'ChordNode') {
      return new ChordNode(data.notes.map((n: any) => this.parse(n)));
    }
    if (data.type === 'ContainerNode') {
      return new ContainerNode(data.children.map((c: any) => this.parse(c)));
    }
    throw new Error(`Unknown node type: ${data.type}`);
  }
}
