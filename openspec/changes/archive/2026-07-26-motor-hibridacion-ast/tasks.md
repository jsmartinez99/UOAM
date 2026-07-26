## 1. AST Musical

- [x] 1.1 Definir interfaces y clases base para nodos AST (`src/domain/ast/`)
- [x] 1.2 Implementar nodos específicos (`NoteNode`, `ChordNode`, `ContainerNode`)
- [x] 1.3 Implementar parser básico para convertir estructuras a AST

## 2. Motor de Reglas

- [x] 2.1 Implementar `RuleEngine` con patrón Visitor
- [x] 2.2 Implementar reglas de transformación (ej. Transposición)
- [x] 2.3 Refactorizar `HybridEngine` para utilizar `RuleEngine` y AST

## 3. Verificación

- [x] 3.1 Añadir tests unitarios para el recorrido del AST
- [x] 3.2 Añadir tests de integración para la hibridación basada en AST
