/**
 * Módulo B: Selección Granular y Matriz Híbrida (Hybrid Engine)
 *
 * Fusiona firmas 6D de múltiples arreglistas y resuelve conflictos
 * de tesitura, instrumentación y textura usando un AST + Rule Engine.
 *
 * Regla de Negocio principal:
 *   Cuando se mezclan dimensiones incompatibles (ej. voicings graves
 *   con instrumentos agudos), el motor aplica transposición de octava
 *   o sustitución de instrumentos basándose en formantes armónicos.
 */

import { Dimensions6D } from '../domain/arranger-profile.js';
import { RuleEngine } from '../domain/ast/rule-engine.js';
import { MusicASTBuilder } from '../domain/ast/builder.js';
import { ContainerNode, NoteNode } from '../domain/ast/nodes.js';
import { CompositeConflictRule } from '../domain/ast/rules/composite-conflict.js';
import { FluteLowVoicingRule } from '../domain/ast/rules/flute-low-voicing.js';
import { PiccoloLowRegisterRule } from '../domain/ast/rules/piccolo-low-register.js';
import { TubaHighVoicingRule } from '../domain/ast/rules/tuba-high-voicing.js';
import { TransposeRule } from '../domain/ast/rules/transpose.js';

export interface MergeInput {
  organology: string[];
  texture: string[];
}

export interface MergedProfile {
  resolvedFeatures: Record<string, string[]>;
  resolutionLog: string[];
}

export class HybridEngine {
  private readonly ruleEngine: RuleEngine;
  private readonly astBuilder: MusicASTBuilder;

  constructor() {
    const rules = new Map<string, unknown>([
      ['ContainerNode', new CompositeConflictRule()],
      ['ContainerNode_flute', new FluteLowVoicingRule()],
      ['ContainerNode_piccolo', new PiccoloLowRegisterRule()],
      ['ContainerNode_tuba', new TubaHighVoicingRule()],
      ['NoteNode', new TransposeRule(0)],
    ]);
    this.ruleEngine = new RuleEngine(rules as never);
    this.astBuilder = new MusicASTBuilder();
  }

  merge(features: MergeInput): MergedProfile {
    const ast = this.astBuilder.buildFromMergeInput(features);
    const resolvedAst = this.ruleEngine.apply(ast);

    const log: string[] = [];
    let resolvedOrganology: string[] = features.organology;
    let resolvedTexture: string[] = features.texture;

    if (resolvedAst instanceof ContainerNode && resolvedAst.children.length === 2) {
        resolvedOrganology = resolvedAst.children[0] instanceof NoteNode ? resolvedAst.children[0].pitch.split(',') : features.organology;
        resolvedTexture = resolvedAst.children[1] instanceof NoteNode ? resolvedAst.children[1].pitch.split(',') : features.texture;
    }

    if (JSON.stringify(features.texture) !== JSON.stringify(resolvedTexture)) {
        log.push('Conflict resolved: AST-based transformation applied');
    }

    return {
      resolvedFeatures: {
        organology: resolvedOrganology,
        texture: resolvedTexture,
      },
      resolutionLog: log,
    };
  }

  mergeFullSignatures(
    signatureA: Dimensions6D,
    signatureB: Dimensions6D,
  ): { merged: Dimensions6D; resolutionLog: string[] } {
    const mergeResult = this.merge({
      organology: [...new Set([...signatureA.organology, ...signatureB.organology])],
      texture: [...new Set([...signatureA.texture, ...signatureB.texture])],
    });

    const merged: Dimensions6D = {
      organology: mergeResult.resolvedFeatures.organology,
      harmony: [...new Set([...signatureA.harmony, ...signatureB.harmony])],
      counterpoint: [...new Set([...signatureA.counterpoint, ...signatureB.counterpoint])],
      texture: mergeResult.resolvedFeatures.texture,
      rhythm: [...new Set([...signatureA.rhythm, ...signatureB.rhythm])],
      taste: [...new Set([...signatureA.taste, ...signatureB.taste])],
    };

    return { merged, resolutionLog: mergeResult.resolutionLog };
  }
}
