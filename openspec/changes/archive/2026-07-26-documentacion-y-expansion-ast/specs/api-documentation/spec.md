## ADDED Requirements

### Requirement: Documentación API automática
El sistema SHALL proporcionar documentación de la API accesible vía Swagger UI.

#### Scenario: Acceso a la documentación
- **WHEN** el usuario accede a `/api-docs`
- **THEN** el sistema muestra la interfaz de Swagger con la documentación de los endpoints

### Requirement: Documentación actualizada
La documentación SHALL reflejar los endpoints actuales de la API.

#### Scenario: Endpoint documentado
- **WHEN** se añade un nuevo endpoint
- **THEN** la documentación de Swagger se actualiza automáticamente
