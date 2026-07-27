# hybrid-engine Specification

## Purpose
TBD - created by archiving change ecosistema-hibrido-arreglos-musicales.

## Requirements
### Requirement: Fusión de perfiles por selección granular
El sistema SHALL permitir construir un perfil híbrido seleccionando dimensiones individuales de diferentes arreglistas (ej. organología de arreglista A + armonía de arreglista B).

#### Scenario: Fusión exitosa de dimensiones de múltiples arreglistas
- **WHEN** el usuario selecciona organología de arreglista A y armonía de arreglista B
- **THEN** el sistema genera un perfil híbrido combinando las dimensiones seleccionadas

#### Scenario: Fusión con un solo arreglista (copia idéntica)
- **WHEN** el usuario selecciona las 6 dimensiones del mismo arreglista
- **THEN** el sistema genera un perfil idéntico al del arreglista original

### Requirement: Resolución automática de conflictos de tesitura
El sistema SHALL detectar y resolver conflictos de tesitura cuando dimensiones incompatibles se fusionan, aplicando transposición de octava o sustitución de instrumentos.

#### Scenario: Conflicto de tesitura resuelto por transposición
- **WHEN** la organología seleccionada usa instrumentos con rango agudo y la textura seleccionada usa voicings graves incompatibles
- **THEN** el sistema transpone los voicings una octava arriba y registra la resolución

#### Scenario: Conflicto irresoluble notificado al usuario
- **WHEN** dos dimensiones son incompatibles y no existe una estrategia de resolución automática
- **THEN** el sistema notifica al usuario con una descripción del conflicto y sugiere alternativas

### Requirement: Registro de resoluciones (resolution log)
El sistema SHALL mantener un registro de todas las resoluciones aplicadas durante la fusión, accesible para revisión del usuario.

#### Scenario: Revisión del log de resoluciones
- **WHEN** el usuario solicita ver el log tras una fusión
- **THEN** el sistema muestra cada conflicto detectado y la estrategia de resolución aplicada
