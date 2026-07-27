## Context

Este diseño detalla la integración del frontend con el backend para el Ecosistema Híbrido de Arreglos Musicales.

## Goals / Non-Goals

**Goals:**
- Implementar autenticación JWT en el frontend.
- Conectar componentes con la API real.
- Mejorar UX con estados de carga y errores.

**Non-Goals:**
- Implementar OAuth2 o proveedores externos (solo JWT local).

## Decisions

### Autenticación
- **Decisión**: Usar React Context para gestionar el estado de autenticación y `localStorage` para el token JWT.
- **Razón**: Solución estándar, simple y efectiva para aplicaciones React.

### Integración API
- **Decisión**: Usar `axios` con interceptores para inyectar el token JWT en cada petición.
- **Razón**: Centraliza la lógica de autenticación y manejo de errores 401.

## Risks / Trade-offs

- [Riesgo] Token JWT en localStorage → Mitigación: Es un riesgo aceptable para un prototipo, pero en producción se debería considerar `HttpOnly` cookies.
