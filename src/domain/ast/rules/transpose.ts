import { Rule } from '../rule-engine.js';
import { NoteNode } from '../nodes.js';

export class TransposeRule implements Rule<NoteNode> {
  constructor(private readonly semitones: number) {}

  apply(node: NoteNode): NoteNode {
    // Lógica simplificada de transposición
    const newPitch = this.transposePitch(node.pitch, this.semitones);
    return new NoteNode(newPitch, node.duration);
  }

  private transposePitch(pitch: string, semitones: number): string {
    if (semitones === 0) return pitch;
    return `${pitch}+${semitones}`;
  }
}
