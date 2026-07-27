## Why

El prototipo de frontend actual no está conectado con la API real, carece de autenticación y no maneja estados de carga o errores de forma robusta. Para que el ecosistema sea usable, necesitamos integrar el frontend con el backend, implementar autenticación JWT y mejorar la experiencia de usuario.

## What Changes

- **Autenticación JWT**: Implementar flujo de Login/Registro en el frontend y proteger rutas.
- **Integración API**: Conectar los componentes de React con los endpoints de la API real usando `axios`.
- **UX**: Implementar estados de carga (`loading`) y manejo de errores (`error`) en todos los componentes que consumen la API.

## Capabilities

### New Capabilities
- `auth-integration`: Implementación de autenticación JWT y protección de rutas.
- `api-integration`: Conexión de frontend con API, manejo de errores y estados de carga.

### Modified Capabilities
- `frontend-ui`: Actualización de componentes para consumir la API real.

## Impact

- **Frontend**: Actualización de `src/frontend/` (AuthContext, componentes).
- **Backend**: Ninguno (la API ya existe).
- **Dependencias**: Ninguna nueva.
