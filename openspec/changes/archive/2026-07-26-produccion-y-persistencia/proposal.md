## Why

El sistema actual depende de almacenamiento en memoria y de configuraciones externas manuales para servicios como Qdrant. Para avanzar hacia un entorno de producción, necesitamos persistencia real de datos y una orquestación robusta del entorno de desarrollo y ejecución.

## What Changes

- **Persistencia de Datos**: Migrar el almacenamiento de usuarios y perfiles de arreglistas de memoria a una base de datos relacional (PostgreSQL).
- **Orquestación de Entorno**: Crear un `docker-compose.yml` para levantar la API, Qdrant y PostgreSQL de forma unificada.
- **Configuración**: Implementar gestión de variables de entorno (`dotenv`) para separar configuraciones de desarrollo y producción.

## Capabilities

### New Capabilities
- `database-persistence`: Migración a PostgreSQL para persistencia de datos.
- `environment-orchestration`: Orquestación de servicios con Docker Compose.
- `configuration-management`: Gestión de variables de entorno.

### Modified Capabilities
*(Ninguna)*

## Impact

- **Nuevos servicios**: `src/infrastructure/database/`
- **Nuevos archivos**: `docker-compose.yml`, `.env.example`
- **Dependencias**: `pg`, `typeorm` (o similar), `dotenv`
