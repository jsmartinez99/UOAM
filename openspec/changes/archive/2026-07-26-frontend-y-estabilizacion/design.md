## Context

Este diseño detalla la estabilización del motor de hibridación AST y la creación de un prototipo de frontend.

## Goals / Non-Goals

**Goals:**
- Migrar todas las reglas de resolución de conflictos al `RuleEngine` AST.
- Crear un prototipo funcional en React.

**Non-Goals:**
- Diseño visual avanzado.
- Autenticación completa en el frontend (se usará un usuario mock).

## Decisions

### Migración de Reglas
- **Decisión**: Implementar reglas como clases que implementan `Rule<T>` y registrarlas en `RuleEngine`.
- **Razón**: Mantiene la lógica de resolución desacoplada y testeable.

### Frontend
- **Decisión**: React con Vite.
- **Razón**: Stack moderno, rápido y compatible con el backend TypeScript.

## Risks / Trade-offs

- [Riesgo] Desalineación entre reglas antiguas y nuevas → Mitigación: Asegurar que los tests de integración cubran todos los casos de conflicto.
