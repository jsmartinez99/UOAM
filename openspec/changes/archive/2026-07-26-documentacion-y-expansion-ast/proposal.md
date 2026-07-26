## Why

Para profesionalizar el ecosistema, necesitamos documentar la API para facilitar su consumo y expandir las capacidades del motor de hibridación AST para soportar reglas musicales más complejas (contrapunto y rítmica). Además, el pipeline CI/CD debe actualizarse para validar estas nuevas reglas y la documentación.

## What Changes

- **Documentación API**: Integrar Swagger/OpenAPI para documentar automáticamente los endpoints.
- **Expansión AST**: Implementar nuevas reglas de transformación para contrapunto y rítmica.
- **CI/CD**: Actualizar GitHub Actions para validar la documentación y los nuevos tests de las reglas AST.

## Capabilities

### New Capabilities
- `api-documentation`: Documentación automática de la API con Swagger/OpenAPI.
- `ast-rules-expansion`: Nuevas reglas de transformación para contrapunto y rítmica.

### Modified Capabilities
- `ci-cd-pipeline`: Actualización del pipeline para incluir validación de docs y tests de nuevas reglas.

## Impact

- **Nuevos archivos**: `src/api/swagger.ts` (o similar), nuevos archivos de reglas en `src/domain/ast/rules/`.
- **Dependencias**: `swagger-ui-express`, `swagger-jsdoc`.
- **CI/CD**: Modificación de `.github/workflows/main.yml`.
