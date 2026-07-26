/**
 * Módulo B: Selección Granular y Matriz Híbrida (Hybrid Engine)
 *
 * Fusiona firmas 6D de múltiples arreglistas y resuelve conflictos
 * de tesitura, instrumentación y textura usando un patrón Strategy.
 *
 * Regla de Negocio principal:
 *   Cuando se mezclan dimensiones incompatibles (ej. voicings graves
 *   con instrumentos agudos), el motor aplica transposición de octava
 *   o sustitución de instrumentos basándose en formantes armónicos.
 */
import { RuleEngine } from '../domain/ast/rule-engine.js';
import { MusicASTBuilder } from '../domain/ast/builder.js';
import { ContainerNode, NoteNode } from '../domain/ast/nodes.js';
import { CompositeConflictRule } from '../domain/ast/rules/composite-conflict.js';
import { CounterpointRule } from '../domain/ast/rules/counterpoint.js';
import { RhythmRule } from '../domain/ast/rules/rhythm.js';
export class HybridEngine {
    ruleEngine;
    astBuilder;
    constructor() {
        const rules = new Map([
            ['ContainerNode', new CompositeConflictRule()],
            ['CounterpointNode', new CounterpointRule()],
            ['RhythmNode', new RhythmRule()],
        ]);
        this.ruleEngine = new RuleEngine(rules);
        this.astBuilder = new MusicASTBuilder();
    }
    merge(features) {
        const ast = this.astBuilder.buildFromMergeInput(features);
        const resolvedAst = this.ruleEngine.apply(ast);
        const log = [];
        let resolvedOrganology = features.organology;
        let resolvedTexture = features.texture;
        // Extraer textura resuelta del AST
        if (resolvedAst instanceof ContainerNode && resolvedAst.children.length === 2) {
            resolvedOrganology = resolvedAst.children[0] instanceof NoteNode ? resolvedAst.children[0].pitch.split(',') : features.organology;
            resolvedTexture = resolvedAst.children[1] instanceof NoteNode ? resolvedAst.children[1].pitch.split(',') : features.texture;
        }
        // Si hubo cambios, registramos el log
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
    mergeFullSignatures(signatureA, signatureB) {
        const mergeResult = this.merge({
            organology: [...new Set([...signatureA.organology, ...signatureB.organology])],
            texture: [...new Set([...signatureA.texture, ...signatureB.texture])],
        });
        const merged = {
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
//# sourceMappingURL=hybrid-engine.js.map