# database-persistence Specification

## Purpose
TBD - created by archiving change produccion-y-persistencia.

## Requirements
### Requirement: Persistencia en base de datos relacional
El sistema SHALL utilizar una base de datos relacional (PostgreSQL) para persistir usuarios y perfiles de arreglistas, garantizando la integridad de los datos.

#### Scenario: Persistencia exitosa de usuario
- **WHEN** se registra un usuario
- **THEN** el usuario se guarda en la base de datos PostgreSQL

#### Scenario: Persistencia exitosa de perfil de arreglista
- **WHEN** se crea un perfil de arreglista
- **THEN** el perfil se guarda en la base de datos PostgreSQL

### Requirement: Migraciones de esquema
El sistema SHALL utilizar un sistema de migraciones para gestionar los cambios en el esquema de la base de datos.

#### Scenario: Ejecución de migraciones al iniciar
- **WHEN** el servicio inicia
- **THEN** se ejecutan las migraciones pendientes para asegurar que el esquema esté actualizado
