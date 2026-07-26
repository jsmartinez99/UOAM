import { BaseNode } from './base.js';
import { ASTVisitor } from './visitor.js';

export class NoteNode extends BaseNode {
  constructor(public readonly pitch: string, public readonly duration: number) {
    super('NoteNode');
  }
  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitNote(this);
  }
}

export class ChordNode extends BaseNode {
  constructor(public readonly notes: NoteNode[]) {
    super('ChordNode');
  }
  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitChord(this);
  }
}

export class ContainerNode extends BaseNode {
  constructor(public readonly children: BaseNode[]) {
    super('ContainerNode');
  }
  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitContainer(this);
  }
}
