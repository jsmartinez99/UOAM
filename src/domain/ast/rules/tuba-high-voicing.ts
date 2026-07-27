import { Rule } from '../rule-engine.js';
import { ContainerNode, NoteNode } from '../nodes.js';

export class TubaHighVoicingRule implements Rule<ContainerNode> {
  apply(node: ContainerNode): ContainerNode {
    const newChildren = node.children.map(child => {
      if (child instanceof NoteNode && child.pitch.includes('High Close-Voicing')) {
        return new NoteNode('Low Close-Voicing (C2-C3)', child.duration);
      }
      return child;
    });
    return new ContainerNode(newChildren);
  }
}
