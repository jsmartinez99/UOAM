import { ASTVisitor } from './visitor.js';
import { BaseNode } from './base.js';
import { NoteNode, ChordNode, ContainerNode } from './nodes.js';

export interface Rule<T extends BaseNode> {
  apply(node: T): BaseNode;
}

type NodeKind = 'NoteNode' | 'ChordNode' | 'ContainerNode';
type AnyRule = Rule<NoteNode> | Rule<ChordNode> | Rule<ContainerNode>;

export class RuleEngine implements ASTVisitor<BaseNode> {
  private readonly rules: Map<NodeKind, AnyRule[]>;

  constructor(rules: Map<NodeKind, AnyRule> | Map<string, AnyRule>) {
    this.rules = new Map();
    for (const [key, rule] of rules.entries()) {
      const existing = this.rules.get(key as NodeKind) ?? [];
      existing.push(rule);
      this.rules.set(key as NodeKind, existing);
    }
  }

  visitNote(node: NoteNode): BaseNode {
    return this.applyChain('NoteNode', node);
  }

  visitChord(node: ChordNode): BaseNode {
    return this.applyChain('ChordNode', node);
  }

  visitContainer(node: ContainerNode): BaseNode {
    const transformed = this.applyChain('ContainerNode', node);

    if (transformed instanceof ContainerNode) {
      const newChildren = transformed.children.map(child => child.accept(this));
      return new ContainerNode(newChildren);
    }
    return transformed;
  }

  apply(node: BaseNode): BaseNode {
    return node.accept(this);
  }

  private applyChain(kind: NodeKind, node: BaseNode): BaseNode {
    const chain = this.rules.get(kind);
    if (!chain || chain.length === 0) return node;

    let current: BaseNode = node;
    for (const rule of chain) {
      if (current instanceof NoteNode && kind === 'NoteNode') {
        current = (rule as Rule<NoteNode>).apply(current);
      } else if (current instanceof ChordNode && kind === 'ChordNode') {
        current = (rule as Rule<ChordNode>).apply(current);
      } else if (current instanceof ContainerNode && kind === 'ContainerNode') {
        current = (rule as Rule<ContainerNode>).apply(current);
      } else {
        break;
      }
    }
    return current;
  }
}
