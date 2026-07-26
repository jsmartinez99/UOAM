import { Rule } from '../rule-engine';
import { ContainerNode, NoteNode } from '../nodes.js';

export class RhythmRule implements Rule<ContainerNode> {
  apply(node: ContainerNode): ContainerNode {
    // Regla heurística: si el ritmo es muy complejo, simplificar
    const newChildren = node.children.map(child => {
      if (child instanceof NoteNode && child.duration < 0.25) {
        return new NoteNode(child.pitch, 0.25);
      }
      return child;
    });
    return new ContainerNode(newChildren);
  }
}
