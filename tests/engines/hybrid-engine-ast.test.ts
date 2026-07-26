import { describe, it, expect } from 'vitest';
import { HybridEngine } from '../../src/engines/hybrid-engine';

describe('HybridEngine Integration', () => {
  it('debe realizar la hibridación usando el motor AST', () => {
    const engine = new HybridEngine();
    const result = engine.merge({
      organology: ['Flute'],
      texture: ['Low Close-Voicing (C2-C3)']
    });
    
    expect(result.resolutionLog).toContain('Conflict resolved: AST-based transformation applied');
  });
});
