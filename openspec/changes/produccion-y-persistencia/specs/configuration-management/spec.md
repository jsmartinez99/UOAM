## ADDED Requirements

### Requirement: Gestión de variables de entorno
El sistema SHALL utilizar variables de entorno para configurar parámetros sensibles y específicos del entorno (ej. URLs de BD, secretos).

#### Scenario: Carga de variables de entorno
- **WHEN** el servicio inicia
- **THEN** carga las variables de entorno desde un archivo `.env` o del entorno del sistema

#### Scenario: Validación de variables requeridas
- **WHEN** el servicio inicia sin una variable requerida (ej. `DATABASE_URL`)
- **THEN** el servicio falla al iniciar con un error claro
