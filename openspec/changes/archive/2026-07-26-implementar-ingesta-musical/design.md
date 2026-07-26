## Context

Este diseño detalla la implementación del servicio de ingesta musical (`MusicIngestionService`) para el Ecosistema Híbrido de Arreglos Musicales. El objetivo es permitir la ingesta de archivos MusicXML, MIDI y audio (WAV/MP3) y su conversión a firmas 6D procesables.

## Goals / Non-Goals

**Goals:**
- Implementar `MusicIngestionService` con adaptadores para formatos simbólicos y audio.
- Implementar lógica de extracción de características 6D.
- Integración con el motor de búsqueda para generar embeddings.

**Non-Goals:**
- Procesamiento de audio en tiempo real.
- Soporte para formatos de audio comprimidos complejos (ej. FLAC, OGG) en esta fase.

## Decisions

### Arquitectura de Adaptadores para Ingesta
- **Decisión**: Usar el patrón Adaptador para cada formato de entrada.
- **Razón**: Permite añadir nuevos formatos (ej. MusicXML, MIDI, WAV) sin modificar el servicio de ingesta principal.
- **Alternativa**: Un único servicio con `switch/case` gigante — se descarta por baja mantenibilidad.

### Extracción de Características
- **Decisión**: Delegar la extracción de características a librerías especializadas (ej. `tonal` para simbólico, `essentia.js` para audio).
- **Razón**: Reutilizar código probado y optimizado para análisis musical.
- **Alternativa**: Implementar algoritmos desde cero — se descarta por complejidad y riesgo de errores.

## Risks / Trade-offs

- [Riesgo] Alta carga computacional al procesar audio → Mitigación: Procesamiento asíncrono mediante una cola de tareas (ej. BullMQ) si el volumen de archivos es alto.
- [Trade-off] Precisión en extracción de audio: La extracción espectral puede ser ruidosa. Mitigación: Implementar normalización y pre-procesamiento de audio antes de la extracción.
