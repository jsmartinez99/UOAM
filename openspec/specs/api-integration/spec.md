# api-integration Specification

## Purpose
TBD - created by archiving change integracion-frontend-backend.

## Requirements
### Requirement: Manejo de estados de carga y errores
El frontend SHALL mostrar indicadores de carga y mensajes de error claros al interactuar con la API.

#### Scenario: Visualización de estado de carga
- **WHEN** se realiza una petición a la API
- **THEN** el componente muestra un indicador de carga (`CircularProgress`)

#### Scenario: Visualización de error de API
- **WHEN** la API retorna un error
- **THEN** el componente muestra un mensaje de error claro (`Alert`)
