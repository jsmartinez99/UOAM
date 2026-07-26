import { NoteNode, ChordNode, ContainerNode } from './nodes';

export interface ASTVisitor<T> {
  visitNote(node: NoteNode): T;
  visitChord(node: ChordNode): T;
  visitContainer(node: ContainerNode): T;
}
