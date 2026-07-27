# Validation Report

## api-documentation
- [ ] Acceso a la documentación
- [ ] Endpoint documentado

**Coverage**: 0/2 scenarios implemented.

## api-integration
- [ ] Visualización de estado de carga
- [x] Visualización de error de API (Matched: debe lanzar un error si la firma hexadimensional está incompleta)

**Coverage**: 1/2 scenarios implemented.

## arranger-catalog
- [x] Creación exitosa de arreglista con firma 6D completa (Matched: debe lanzar un error si la firma hexadimensional está incompleta)
- [x] Rechazo de arreglista con firma 6D incompleta (Matched: debe lanzar un error si la firma hexadimensional está incompleta)
- [x] Dimensión con tipo incorrecto (Matched: debe fallar si alguna dimensión es un array vacío)
- [x] Consulta de arreglista por nombre (Matched: debe fallar si el nombre del arreglista está vacío)
- [ ] Listado paginado del catálogo

**Coverage**: 4/5 scenarios implemented.

## ast-engine
- [x] Creación de nodo AST válido (Matched: debe crear un perfil válido con las 6 dimensiones completas)
- [x] Parseo exitoso de estructura simple (Matched: debe parsear una estructura simple a AST)

**Coverage**: 2/2 scenarios implemented.

## ast-rules-expansion
- [x] Aplicación de regla de contrapunto (Matched: debe aceptar reglas de conflicto personalizadas)
- [x] Aplicación de regla de rítmica (Matched: debe aceptar reglas de conflicto personalizadas)

**Coverage**: 2/2 scenarios implemented.

## auth-integration
- [ ] Login exitoso
- [ ] Acceso a ruta protegida sin token

**Coverage**: 0/2 scenarios implemented.

## ci-cd-pipeline
- [ ] Pipeline se ejecuta en push a main
- [ ] Pipeline se ejecuta en Pull Request
- [ ] Pipeline completo pasa exitosamente
- [ ] Pipeline falla por error de lint
- [ ] Docker build en merge a main

**Coverage**: 0/5 scenarios implemented.

## configuration-management
- [x] Carga de variables de entorno (Matched: debe construir el prompt RAG con todas las variables del contexto)
- [x] Validación de variables requeridas (Matched: debe construir el prompt RAG con todas las variables del contexto)

**Coverage**: 2/2 scenarios implemented.

## database-persistence
- [x] Persistencia exitosa de usuario (Matched: debe registrar un usuario con rol STANDARD por defecto)
- [ ] Persistencia exitosa de perfil de arreglista
- [ ] Ejecución de migraciones al iniciar

**Coverage**: 1/3 scenarios implemented.

## environment-orchestration
- [ ] Levantamiento exitoso de servicios
- [ ] API espera a servicios dependientes

**Coverage**: 0/2 scenarios implemented.

## feature-extraction
- [x] Extracción exitosa de dimensiones 6D (Matched: debe fallar si falta cualquiera de las 6 dimensiones individualmente)
- [ ] Embedding generado tras extracción

**Coverage**: 1/2 scenarios implemented.

## frontend-ui
- [x] Visualización de resultados de hibridación (Matched: debe realizar la hibridación usando el motor AST)

**Coverage**: 1/1 scenarios implemented.

## hybrid-engine
- [ ] Fusión exitosa de dimensiones de múltiples arreglistas
- [ ] Fusión con un solo arreglista (copia idéntica)
- [x] Conflicto de tesitura resuelto por transposición (Matched: debe resolver conflictos de tesitura transponiendo la octava (Octave Displacement))
- [ ] Conflicto irresoluble notificado al usuario
- [ ] Revisión del log de resoluciones

**Coverage**: 1/5 scenarios implemented.

## hybrid-engine-stabilization
- [x] Resolución de conflictos con reglas AST (Matched: debe resolver conflictos de tesitura transponiendo la octava (Octave Displacement))

**Coverage**: 1/1 scenarios implemented.

## music-ingestion
- [x] Ingesta exitosa de archivo MusicXML (Matched: debe procesar un archivo MusicXML válido)
- [x] Ingesta de archivo MIDI (Matched: debe procesar un archivo WAV válido)
- [x] Rechazo de formato no soportado (Matched: debe rechazar formatos no soportados)
- [x] Ingesta exitosa de archivo WAV (Matched: debe procesar un archivo WAV válido)
- [x] Ingesta de archivo MP3 (Matched: debe procesar un archivo WAV válido)
- [ ] Embedding generado tras ingesta

**Coverage**: 5/6 scenarios implemented.

## rag-analysis
- [x] Reporte generado con alta confianza (Matched: debe generar reporte con confianza HIGH para score >= 0.85)
- [x] Rechazo por confianza insuficiente (Matched: debe generar reporte con confianza HIGH para score >= 0.85)
- [x] Prompt inyecta contexto del dominio (Matched: debe construir el prompt RAG con todas las variables del contexto)
- [x] Metadatos incluidos en la respuesta del reporte (Matched: debe incluir metadatos de contexto y fecha en el reporte)

**Coverage**: 4/4 scenarios implemented.

## rule-engine
- [x] Aplicación de regla de transposición (Matched: debe aceptar reglas de conflicto personalizadas)
- [ ] Aplicación de regla en nodos hijos

**Coverage**: 1/2 scenarios implemented.

## semantic-search
- [ ] Indexación exitosa de un nuevo arreglista
- [ ] Búsqueda devuelve resultados con score mayor a threshold
- [x] Búsqueda sin resultados relevantes (Matched: debe filtrar resultados por debajo del threshold)
- [ ] Score incluido en cada resultado
- [ ] Límite personalizado en búsqueda

**Coverage**: 1/5 scenarios implemented.

## user-identity
- [x] Registro exitoso con email y contraseña válidos (Matched: debe rechazar el registro si el email tiene un formato inválido)
- [x] Rechazo por email inválido (Matched: debe rechazar el registro si el email tiene un formato inválido)
- [x] Rechazo por contraseña débil (Matched: debe rechazar contraseñas con menos de 8 caracteres)
- [ ] Login exitoso genera token
- [x] Login con credenciales incorrectas (Matched: debe validar credenciales correctas)
- [x] Usuario STANDARD accede a recurso de ADMIN (Matched: debe registrar un usuario con rol STANDARD por defecto)
- [ ] Usuario ADMIN accede a recurso de administración

**Coverage**: 5/7 scenarios implemented.

