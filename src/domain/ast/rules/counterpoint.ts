import { Rule } from '../rule-engine.js';
import { ContainerNode, NoteNode } from '../nodes.js';

export class CounterpointRule implements Rule<ContainerNode> {
  apply(node: ContainerNode): ContainerNode {
    // Regla heurística: si hay demasiadas notas simultáneas, simplificar contrapunto
    const newChildren = node.children.map(child => {
      if (child instanceof NoteNode && child.duration < 0.5) {
        return new NoteNode(child.pitch, 0.5);
      }
      return child;
    });
    return new ContainerNode(newChildren);
  }
}
