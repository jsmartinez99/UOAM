## Context

Este diseño detalla la migración hacia un entorno de producción para el Ecosistema Híbrido de Arreglos Musicales. Se busca persistencia real de datos, orquestación unificada y gestión de configuración segura.

## Goals / Non-Goals

**Goals:**
- Migrar persistencia de memoria a PostgreSQL.
- Orquestar servicios con Docker Compose.
- Implementar gestión de configuración con variables de entorno.

**Non-Goals:**
- Despliegue en la nube (AWS/Azure/GCP) en esta fase.
- Alta disponibilidad (HA) de la base de datos.

## Decisions

### PostgreSQL como base de datos
- **Decisión**: Usar PostgreSQL.
- **Razón**: Es robusto, soporta transacciones ACID y tiene excelente soporte en el ecosistema Node.js (TypeORM/Prisma).
- **Alternativa**: MongoDB — se descarta porque el modelo de datos (usuarios, perfiles, dimensiones) es altamente relacional.

### Docker Compose para orquestación
- **Decisión**: Usar Docker Compose.
- **Razón**: Simplifica drásticamente el desarrollo local y asegura que todos los desarrolladores tengan el mismo entorno.
- **Alternativa**: Scripts de bash manuales — se descarta por fragilidad y dificultad de mantenimiento.

### Variables de entorno con `dotenv`
- **Decisión**: Usar `dotenv` para cargar variables de entorno.
- **Razón**: Es el estándar de facto en Node.js, simple y efectivo.
- **Alternativa**: Archivos de configuración JSON — se descarta por riesgo de incluir secretos en el control de versiones.

## Risks / Trade-offs

- [Riesgo] Pérdida de datos durante la migración → Mitigación: La migración es de memoria a BD, no hay datos críticos en memoria actualmente.
- [Trade-off] Docker Compose en producción: No es recomendado para producción a gran escala. Mitigación: El alcance es solo para entorno de desarrollo/ejecución local, no para producción masiva.
