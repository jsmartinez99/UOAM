## Why

El motor de hibridación basado en AST está implementado, pero los tests antiguos fallan porque la lógica de resolución de conflictos no se ha migrado completamente al nuevo motor. Además, el sistema carece de una interfaz de usuario para interactuar con las capacidades de análisis e hibridación.

## What Changes

- **Estabilización del Motor AST**: Migrar las reglas de resolución de conflictos (Flute, Piccolo, Tuba) al nuevo `RuleEngine` basado en AST para que los tests pasen.
- **Prototipo de Frontend**: Crear una interfaz básica en React para:
    - Listar arreglistas.
    - Seleccionar perfiles para hibridación.
    - Visualizar el resultado de la hibridación.

## Capabilities

### New Capabilities
- `frontend-ui`: Interfaz de usuario básica para interactuar con la API.

### Modified Capabilities
- `hybrid-engine`: Migración completa de reglas de resolución de conflictos al motor AST.

## Impact

- **Frontend**: Nuevo directorio `src/frontend/` con componentes React.
- **Backend**: Actualización de `src/engines/hybrid-engine.ts` y reglas en `src/domain/ast/rules/`.
- **Tests**: Actualización de `tests/engines/hybrid-engine.test.ts`.
