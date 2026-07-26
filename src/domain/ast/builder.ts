import { ContainerNode } from './nodes.js';
import { NoteNode } from './nodes.js';

export class MusicASTBuilder {
  buildFromMergeInput(input: { organology: string[], texture: string[] }): ContainerNode {
    return new ContainerNode([
      new NoteNode(input.organology.join(','), 1),
      new NoteNode(input.texture.join(','), 1)
    ]);
  }
}
