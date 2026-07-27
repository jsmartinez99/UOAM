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

/**
 * Entrada mínima para una fusión: las dos dimensiones que generan
 * conflictos de tesitura (organología + textura).
 */
export interface MergeInput {
  organology: string[];
  texture: string[];
}

/**
 * Resultado de una fusión: features resueltas + log de resoluciones
 * aplicadas por el AST/Rule Engine.
 */
export interface MergedProfile {
  resolvedFeatures: Record<string, string[]>;
  resolutionLog: string[];
}

/**
 * Motor de hibridación principal del sistema.
 *
 * Construye un AST musical a partir de las features de entrada, aplica
 * las reglas de resolución de conflictos (CompositeConflict, voicing
 * rules, transposición), y devuelve el perfil fusionado.
 *
 * Reglas registradas por defecto:
 * - CompositeConflictRule: detecta conflictos de tesitura
 * - FluteLowVoicingRule: transpone voicing grave de flauta
 * - PiccoloLowRegisterRule: sube registros graves de flautín
 * - TubaHighVoicingRule: baja voicing agudo de tuba
 * - TransposeRule(0): passthrough (configurable por mergeFullSignatures)
 */
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

  /**
   * Fusiona organología + textura de dos arreglistas, resolviendo conflictos
   * de tesitura mediante AST/Rule Engine.
   *
   * @param features - Dimensiones de entrada
   * @returns Perfil fusionado con features resueltas y log de resoluciones
   */
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

  /**
   * Fusiona dos firmas 6D completas. Las dimensiones de armonía, contrapunto,
   * ritmo y taste se unen por unión de conjuntos (sin resolución de conflictos).
   * Solo organología y textura pasan por el AST.
   *
   * @param signatureA - Primera firma 6D
   * @param signatureB - Segunda firma 6D
   * @returns Firma fusionada y log de resoluciones aplicadas
   */
  mergeFullSignatures(
    signatureA: Dimensions6D,
    signatureB: Dimensions6D,
  ): { mergedProfile: Dimensions6D; resolutionLog: string[] } {
    const mergeResult = this.merge({
      organology: [...new Set([...signatureA.organology, ...signatureB.organology])],
      texture: [...new Set([...signatureA.texture, ...signatureB.texture])],
    });

    const mergedProfile: Dimensions6D = {
      organology: mergeResult.resolvedFeatures.organology,
      harmony: [...new Set([...signatureA.harmony, ...signatureB.harmony])],
      counterpoint: [...new Set([...signatureA.counterpoint, ...signatureB.counterpoint])],
      texture: mergeResult.resolvedFeatures.texture,
      rhythm: [...new Set([...signatureA.rhythm, ...signatureB.rhythm])],
      taste: [...new Set([...signatureA.taste, ...signatureB.taste])],
    };

    return { mergedProfile, resolutionLog: mergeResult.resolutionLog };
  }
}
