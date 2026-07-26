## Context

Este documento describe la arquitectura del Ecosistema Híbrido de Arreglos Musicales, un sistema full-stack open-source para análisis, hibridación y generación de arreglos musicales. Se adopta una arquitectura hexagonal (Ports & Adapters) con un enfoque API-First, utilizando TypeScript como lenguaje base.

El sistema se compone de 7 capacidades principales: catálogo de arreglistas con firma 6D, motor de hibridación, búsqueda semántica vectorial, análisis RAG con LLM, ingesta musical, gestión de usuarios e infraestructura CI/CD.

## Goals / Non-Goals

**Goals:**
- Arquitectura hexagonal limpia con separación clara entre dominio, aplicación e infraestructura
- API REST documentada que exponga todas las capacidades del sistema
- Cobertura de tests unitarios e integración siguiendo TDD (Red → Green → Refactor)
- Integración con Qdrant para búsqueda vectorial y OpenAI/Anthropic para generación de reportes
- Pipeline CI/CD funcional en GitHub Actions

**Non-Goals:**
- Interfaz de usuario (UI/UX) — el alcance inicial es API-first
- Despliegue en producción (el pipeline construye la imagen Docker sin deploy automático)
- Integración con DAWs (Digital Audio Workstations) en esta fase
- Generación de audio sintético (solo análisis y reportes)

## Decisions

### Arquitectura Hexagonal sobre MVC
- **Decisión**: Usar puertos y adaptadores (hexagonal) en lugar de MVC tradicional
- **Razón**: El dominio musical (firma 6D, resolución de conflictos) es complejo y debe permanecer aislado de frameworks HTTP o bases de datos. Hexagonal permite testear el core sin infraestructura.
- **Alternativa**: MVC — se descarta porque acopla lógica de negocio a controladores HTTP

### TypeScript como lenguaje base
- **Decisión**: TypeScript con tipado estricto (`strict: true`)
- **Razón**: El modelo de dominio con interfaces 6D y tipos complejos se beneficia del sistema de tipos. Todo el ecosistema (tests, lint, typecheck) se unifica en un solo lenguaje.
- **Alternativa**: Python — se descarta porque el tipado no es nativo y el ecosistema de música simbólica en TS es maduro (tonal, musicxml-interfaces)

### Qdrant para búsqueda vectorial
- **Decisión**: Qdrant como base de datos vectorial
- **Razón**: Qdrant es open-source, tiene SDK nativo para TypeScript, soporta filtrado por payload y está optimizado para KNN con cosine similarity. Es más ligero que Milvus y más maduro que Chroma.
- **Alternativa**: PostgreSQL + pgvector — se descarta porque la colección vectorial crecerá con cada arreglista y cada obra analizada; un servicio dedicado ofrece mejor rendimiento en búsqueda

### RAG sobre fine-tuning para LLM
- **Decisión**: Usar RAG (Retrieval-Augmented Generation) en lugar de fine-tuning de modelos
- **Razón**: RAG permite que el LLM genere reportes basados en el contexto recuperado sin necesidad de reentrenar. Es más flexible, económico y mantenible. Fine-tuning requeriría un dataset enorme de análisis musicales.
- **Alternativa**: Fine-tuning — se descarta por alto costo de mantenimiento y datos insuficientes

### JWT con RBAC para autenticación
- **Decisión**: Autenticación stateless con JWT y roles codificados en el payload
- **Razón**: Es simple, escalable y no requiere sesiones en servidor. Los roles STANDARD, ARRANGER y ADMIN cubren los casos de uso definidos.
- **Alternativa**: Session-based auth — se descarta porque el sistema será API-first y stateless es más natural para REST

### Testing con Vitest
- **Decisión**: Vitest como framework de pruebas
- **Razón**: Compatibilidad nativa con TypeScript, ESM y configuración zero para proyectos modernos. Más rápido que Jest y misma sintaxis.
- **Alternativa**: Jest — se descarta por configuración más compleja con ESM/TypeScript

## Risks / Trade-offs

- [Riesgo] Qdrant como dependencia externa → Mitigación: el adaptador de base de datos vectorial permite cambiar a otra solución si Qdrant no escala. Se abstrae tras un puerto (interfaz) en la arquitectura hexagonal.
- [Riesgo] Costo de API LLM en producción → Mitigación: el prompt RAG es pequeño y controlado. Se puede cachear reportes para consultas repetidas o migrar a modelos open-source vía Ollama.
- [Riesgo] Complejidad del AST musical para resolución de conflictos → Mitivación: la primera versión implementa reglas heurísticas simples (transposición de octava, sustitución por instrumento similar). El AST se introduce en iteraciones posteriores.
- [Trade-off] API-first sin UI: el sistema solo es accesible via REST, lo que acelera el desarrollo inicial pero requiere un frontend para adopción por músicos no técnicos.
- [Trade-off] TypeScript sobre Python: pierde acceso a librerías maduras de audio como librosa. Mitigación: se usa esencial-wasm o se delega extracción espectral a un worker en Python si es necesario.
