## Why

Los músicos profesionales carecen de herramientas open-source que les permitan analizar, comparar y combinar metodologías de arreglistas de forma sistemática. Hoy el estudio de estilos orquestales depende de la intuición y la experiencia acumulada, sin un soporte computacional que permita auditar influencias, experimentar con hibridaciones controladas o acelerar la fase de orquestación mediante IA. Este ecosistema resuelve esa brecha.

## What Changes

- **Catálogo Mundial de Arreglistas con Firma Hexadimensional**: Sistema para modelar arreglistas mediante 6 dimensiones técnicas (organología, armonía, contrapunto, textura, rítmica, marcas personales) con validación estricta de dominio.
- **Motor de Hibridación (Hybrid Engine)**: Permite construir perfiles híbridos combinando dimensiones de múltiples arreglistas, con resolución automática de conflictos de tesitura e instrumentación mediante un AST musical.
- **Búsqueda Semántica Vectorial (Qdrant)**: Indexación y búsqueda por similitud de firmas 6D usando Qdrant como base de datos vectorial, con Confidence Score de atribución estilística.
- **Pipeline RAG con LLM**: Generación de reportes analíticos en lenguaje natural sobre influencias detectadas, usando Retrieval-Augmented Generation para evitar alucinaciones.
- **Ingesta de Formatos Musicales**: Soporte para MusicXML, MIDI (simbólico) y WAV/MP3 (audio con extracción espectral).
- **Gestión de Usuarios con RBAC**: Autenticación JWT con roles STANDARD, ARRANGER y ADMIN.
- **Infraestructura CI/CD**: Pipeline GitHub Actions con tests, linting, typecheck y build Docker.

## Capabilities

### New Capabilities
- `arranger-catalog`: Modelado y gestión del catálogo mundial de arreglistas con firma hexadimensional (6D Signature)
- `hybrid-engine`: Motor de selección granular y matriz híbrida con resolución de conflictos mediante AST musical
- `semantic-search`: Búsqueda semántica vectorial con Qdrant y Confidence Score de atribución estilística
- `rag-analysis`: Generación de reportes analíticos vía LLM con pipeline RAG
- `music-ingestion`: Ingesta y procesamiento de formatos MusicXML, MIDI y audio (WAV/MP3)
- `user-identity`: Autenticación, registro y RBAC con JWT
- `ci-cd-pipeline`: Pipeline de integración continua con GitHub Actions

### Modified Capabilities
*(Ninguna — este es el cambio inicial del ecosistema)*

## Impact

- **Nuevo proyecto full-stack** TypeScript (Node.js) con arquitectura hexagonal (Ports & Adapters)
- **Dependencias clave**: Qdrant (vector DB), OpenAI/Anthropic API (LLM), JWT (auth), MusicXML/MIDI parsers
- **Estructura de directorios**: `src/core/` (dominio), `src/infrastructure/` (adapters), `src/api/` (HTTP), `specs/` (especificaciones)
- **CI/CD**: GitHub Actions para tests, lint, typecheck y Docker build
