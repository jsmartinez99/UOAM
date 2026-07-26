## Why

El motor de hibridación actual utiliza reglas heurísticas simples basadas en `if/else`, lo que dificulta la escalabilidad y la resolución de conflictos complejos en arreglos musicales. Necesitamos una estructura formal (AST) que permita representar jerárquicamente la música y aplicar transformaciones recursivas de forma robusta.

## What Changes

- **Implementación de AST Musical**: Definir una estructura de datos jerárquica (AST) para representar elementos musicales (notas, acordes, texturas, instrumentos).
- **Motor de Reglas (Rule Engine)**: Implementar un motor capaz de recorrer el AST y aplicar transformaciones basadas en reglas declarativas.
- **Refactorización de `HybridEngine`**: Migrar la lógica actual de resolución de conflictos al nuevo motor de reglas basado en AST.

## Capabilities

### New Capabilities
- `ast-engine`: Estructura de datos y parser para representar la música como un AST.
- `rule-engine`: Motor de reglas declarativas para transformar el AST musical.

### Modified Capabilities
- `hybrid-engine`: Requerimientos modificados para utilizar el nuevo motor de reglas basado en AST en lugar de heurísticas simples.

## Impact

- **Nuevo dominio**: `src/domain/ast/`
- **Refactorización**: `src/engines/hybrid-engine.ts`
- **Dependencias**: Ninguna nueva dependencia mayor, pero mayor complejidad en el dominio.
