import { Rule } from '../rule-engine.js';
import { ContainerNode, NoteNode } from '../nodes.js';

export class FluteLowVoicingRule implements Rule<ContainerNode> {
  apply(node: ContainerNode): ContainerNode {
    const newChildren = node.children.map(child => {
      if (child instanceof NoteNode && child.pitch.includes('Low Close-Voicing')) {
        return new NoteNode('Medium Close-Voicing (C4-C5)', child.duration);
      }
      return child;
    });
    return new ContainerNode(newChildren);
  }
}
