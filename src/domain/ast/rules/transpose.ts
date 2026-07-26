import { Rule } from '../rule-engine';
import { NoteNode } from '../nodes';

export class TransposeRule implements Rule<NoteNode> {
  constructor(private readonly semitones: number) {}

  apply(node: NoteNode): NoteNode {
    // Lógica simplificada de transposición
    const newPitch = this.transposePitch(node.pitch, this.semitones);
    return new NoteNode(newPitch, node.duration);
  }

  private transposePitch(pitch: string, semitones: number): string {
    // Implementación simplificada para el prototipo
    return `${pitch}+${semitones}`;
  }
}
