# environment-orchestration Specification

## Purpose
TBD - created by archiving change produccion-y-persistencia.

## Requirements
### Requirement: Orquestación con Docker Compose
El sistema SHALL proporcionar un archivo `docker-compose.yml` que permita levantar todos los servicios necesarios (API, Qdrant, PostgreSQL) con un solo comando.

#### Scenario: Levantamiento exitoso de servicios
- **WHEN** se ejecuta `docker-compose up`
- **THEN** todos los servicios (API, Qdrant, PostgreSQL) se inician y son accesibles

### Requirement: Salud de los servicios
El sistema SHALL verificar que los servicios dependientes (Qdrant, PostgreSQL) estén listos antes de que la API comience a aceptar peticiones.

#### Scenario: API espera a servicios dependientes
- **WHEN** se inicia el sistema
- **THEN** la API espera a que Qdrant y PostgreSQL estén listos antes de iniciar el servidor HTTP
