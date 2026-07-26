import { Rule } from '../rule-engine';
import { ContainerNode, NoteNode } from '../nodes.js';

export class CompositeConflictRule implements Rule<ContainerNode> {
  apply(node: ContainerNode): ContainerNode {
    if (node.children.length !== 2) return node;

    const organologyNode = node.children[0];
    const textureNode = node.children[1];

    if (!(organologyNode instanceof NoteNode) || !(textureNode instanceof NoteNode)) {
      return node;
    }

    const organology = organologyNode.pitch;
    let texture = textureNode.pitch;

    if (organology.includes('Flute') && texture.includes('Low Close-Voicing')) {
      texture = texture.replace('Low Close-Voicing (C2-C3)', 'Medium Close-Voicing (C4-C5)');
    }

    if (organology.includes('Piccolo') && texture.includes('Low')) {
      texture = texture.replace('Low', 'High');
    }

    if (organology.includes('Tuba') && texture.includes('High Close-Voicing')) {
      texture = texture.replace('High Close-Voicing (C5-C6)', 'Low Close-Voicing (C2-C3)');
    }

    return new ContainerNode([
      new NoteNode(organology, organologyNode.duration),
      new NoteNode(texture, textureNode.duration)
    ]);
  }
}
