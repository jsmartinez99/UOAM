import { ASTVisitor } from './visitor';
import { BaseNode } from './base';
import { NoteNode, ChordNode, ContainerNode } from './nodes.js';

export interface Rule<T> {
  apply(node: T): BaseNode;
}

export class RuleEngine implements ASTVisitor<BaseNode> {
  constructor(private readonly rules: Map<string, Rule<any>>) {}

  visitNote(node: NoteNode): BaseNode {
    const rule = this.rules.get('NoteNode');
    return rule ? rule.apply(node) : node;
  }

  visitChord(node: ChordNode): BaseNode {
    const rule = this.rules.get('ChordNode');
    return rule ? rule.apply(node) : node;
  }

  visitContainer(node: ContainerNode): BaseNode {
    const rule = this.rules.get('ContainerNode');
    const transformedNode = rule ? rule.apply(node) : node;
    
    if (transformedNode instanceof ContainerNode) {
        const newChildren = transformedNode.children.map(child => child.accept(this));
        return new ContainerNode(newChildren);
    }
    return transformedNode;
  }

  apply(node: BaseNode): BaseNode {
    return node.accept(this);
  }
}
