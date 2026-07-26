## Context

Este diseño detalla la evolución del motor de hibridación hacia una arquitectura basada en AST (Abstract Syntax Tree) para representar y transformar música.

## Goals / Non-Goals

**Goals:**
- Definir una estructura AST para representar música.
- Implementar un motor de reglas declarativas.
- Refactorizar `HybridEngine` para usar el nuevo motor.

**Non-Goals:**
- Soporte para todas las estructuras musicales posibles (solo las necesarias para el prototipo).
- Editor visual de reglas.

## Decisions

### AST Musical
- **Decisión**: Definir clases para nodos del AST (ej. `MusicalNode`, `NoteNode`, `ContainerNode`).
- **Razón**: Proporciona una estructura clara, tipada y fácil de recorrer recursivamente.

### Motor de Reglas
- **Decisión**: Implementar un patrón Visitor para recorrer el AST y aplicar reglas.
- **Razón**: Separa la lógica de recorrido del AST de la lógica de transformación (reglas), cumpliendo con el principio de responsabilidad única.

## Risks / Trade-offs

- [Riesgo] Complejidad de implementación del AST → Mitigación: Comenzar con un AST mínimo y expandirlo según sea necesario.
- [Trade-off] Rendimiento: El recorrido recursivo del AST puede ser lento en estructuras muy grandes. Mitigación: Optimizar el recorrido solo cuando sea necesario.
