## ADDED Requirements

### Requirement: Registro de usuarios con validación de email
El sistema SHALL permitir el registro de nuevos usuarios validando el formato del email y la fortaleza de la contraseña.

#### Scenario: Registro exitoso con email y contraseña válidos
- **WHEN** se registra un usuario con email válido y contraseña de al menos 8 caracteres
- **THEN** el sistema retorna un objeto usuario con id, email y rol STANDARD

#### Scenario: Rechazo por email inválido
- **WHEN** se registra un usuario con email que no cumple el formato regex
- **THEN** el sistema lanza error "Email inválido"

#### Scenario: Rechazo por contraseña débil
- **WHEN** se registra un usuario con contraseña de menos de 8 caracteres
- **THEN** el sistema lanza error "Seguridad inválida: La contraseña es muy corta"

### Requirement: Autenticación mediante JWT
El sistema SHALL autenticar usuarios mediante JSON Web Tokens (JWT) con expiración configurable.

#### Scenario: Login exitoso genera token
- **WHEN** un usuario registrado inicia sesión con credenciales correctas
- **THEN** el sistema retorna un JWT válido

#### Scenario: Login con credenciales incorrectas
- **WHEN** un usuario ingresa email o contraseña incorrectos
- **THEN** el sistema retorna error 401 Unauthorized

### Requirement: Control de acceso basado en roles (RBAC)
El sistema SHALL implementar tres roles con permisos crecientes: STANDARD, ARRANGER, ADMIN.

#### Scenario: Usuario STANDARD accede a recurso de ADMIN
- **WHEN** un usuario con rol STANDARD intenta acceder a un endpoint de administración
- **THEN** el sistema retorna error 403 Forbidden

#### Scenario: Usuario ADMIN accede a recurso de administración
- **WHEN** un usuario con rol ADMIN intenta acceder a un endpoint de administración
- **THEN** el sistema permite el acceso
