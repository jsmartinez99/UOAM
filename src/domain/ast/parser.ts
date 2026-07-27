import { BaseNode } from './base.js';
import { NoteNode, ChordNode, ContainerNode } from './nodes.js';

export class ASTParser {
  parse(data: unknown): BaseNode {
    const nodeData = data as { type: string; pitch?: string; duration?: number; notes?: unknown[]; children?: unknown[] };
    if (nodeData.type === 'NoteNode') {
      return new NoteNode(nodeData.pitch as string, nodeData.duration as number);
    }
    if (nodeData.type === 'ChordNode') {
      const notes = (nodeData.notes as unknown[]).map((n: unknown) => {
        const parsed = this.parse(n);
        if (!(parsed instanceof NoteNode)) {
          throw new Error('ChordNode children must be NoteNode');
        }
        return parsed;
      });
      return new ChordNode(notes);
    }
    if (nodeData.type === 'ContainerNode') {
      return new ContainerNode((nodeData.children as unknown[]).map((c: unknown) => this.parse(c)));
    }
    throw new Error(`Unknown node type: ${nodeData.type}`);
  }
}
