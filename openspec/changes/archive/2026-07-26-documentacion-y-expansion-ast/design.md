## Context

Este diseño detalla la expansión del motor AST y la documentación de la API para el Ecosistema Híbrido de Arreglos Musicales.

## Goals / Non-Goals

**Goals:**
- Implementar documentación API con Swagger/OpenAPI.
- Implementar nuevas reglas AST (contrapunto, rítmica).
- Actualizar CI/CD para validar documentación y nuevas reglas.

**Non-Goals:**
- Implementar todas las reglas musicales posibles.

## Decisions

### Documentación API
- **Decisión**: Usar `swagger-jsdoc` y `swagger-ui-express`.
- **Razón**: Estándar de la industria, fácil integración con Express, documentación autogenerada a partir de comentarios en el código.

### Expansión AST
- **Decisión**: Implementar reglas de contrapunto y rítmica siguiendo el patrón `Rule<T>` existente.
- **Razón**: Mantiene la consistencia y escalabilidad del motor AST.

## Risks / Trade-offs

- [Riesgo] Documentación desactualizada → Mitigación: Integrar la generación de docs en el pipeline CI/CD.
- [Trade-off] Complejidad de reglas musicales: Las reglas de contrapunto pueden ser muy complejas. Mitigación: Implementar reglas heurísticas iniciales y refinarlas iterativamente.
