import { BaseNode } from './base';
import { NoteNode, ChordNode, ContainerNode } from './nodes';

export class ASTParser {
  parse(data: unknown): BaseNode {
    const nodeData = data as { type: string; pitch?: string; duration?: number; notes?: unknown[]; children?: unknown[] };
    if (nodeData.type === 'NoteNode') {
      return new NoteNode(nodeData.pitch as string, nodeData.duration as number);
    }
    if (nodeData.type === 'ChordNode') {
      return new ChordNode((nodeData.notes as unknown[]).map((n: unknown) => this.parse(n)));
    }
    if (nodeData.type === 'ContainerNode') {
      return new ContainerNode((nodeData.children as unknown[]).map((c: unknown) => this.parse(c)));
    }
    throw new Error(`Unknown node type: ${nodeData.type}`);
  }
}
