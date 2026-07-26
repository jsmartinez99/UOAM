## ADDED Requirements

### Requirement: Autenticación JWT
El sistema SHALL permitir a los usuarios iniciar sesión y registrarse, obteniendo un token JWT que se utilizará para autorizar peticiones posteriores.

#### Scenario: Login exitoso
- **WHEN** el usuario ingresa credenciales válidas
- **THEN** el sistema guarda el token JWT y redirige al catálogo

### Requirement: Protección de rutas
El sistema SHALL proteger las rutas que requieren autenticación.

#### Scenario: Acceso a ruta protegida sin token
- **WHEN** un usuario no autenticado intenta acceder a `/hybridize`
- **THEN** el sistema redirige al usuario a `/login`
