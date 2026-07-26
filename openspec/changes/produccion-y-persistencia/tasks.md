## 1. Configuración de Entorno

- [x] 1.1 Crear `.env.example` con variables necesarias
- [x] 1.2 Crear `docker-compose.yml` para API, Qdrant y PostgreSQL
- [x] 1.3 Configurar carga de variables de entorno en la aplicación

## 2. Persistencia de Datos

- [x] 2.1 Instalar dependencias de base de datos (TypeORM, pg)
- [x] 2.2 Definir entidades de base de datos para `User` y `ArrangerProfile`
- [x] 2.3 Implementar migraciones iniciales para el esquema
- [x] 2.4 Refactorizar `UserService` y `ArrangerRepository` para usar la base de datos

## 3. Verificación

- [x] 3.1 Añadir tests de integración para persistencia
- [x] 3.2 Verificar que el entorno Docker Compose levanta correctamente
