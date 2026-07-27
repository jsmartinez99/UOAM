import { Rule } from '../rule-engine.js';
import { ContainerNode, NoteNode } from '../nodes.js';

export class PiccoloLowRegisterRule implements Rule<ContainerNode> {
  apply(node: ContainerNode): ContainerNode {
    const newChildren = node.children.map(child => {
      if (child instanceof NoteNode && child.pitch.includes('Low')) {
        return new NoteNode(child.pitch.replace('Low', 'High'), child.duration);
      }
      return child;
    });
    return new ContainerNode(newChildren);
  }
}
