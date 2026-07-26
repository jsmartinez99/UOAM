## Why

El sistema actual carece de la capacidad de procesar archivos musicales reales (MusicXML, MIDI, WAV/MP3), lo que limita su utilidad a datos simulados. Para que el ecosistema sea funcional y pueda realizar análisis estilísticos reales, necesitamos un servicio de ingesta que convierta estos formatos en firmas 6D procesables.

## What Changes

- **Implementación de `MusicIngestionService`**: Servicio central para la ingesta y normalización de formatos musicales.
- **Adaptadores de Ingesta**:
    - `SymbolicIngestor`: Para MusicXML y MIDI.
    - `AudioIngestor`: Para WAV/MP3 con extracción de características espectrales.
- **Extracción de Características**: Implementación de lógica para extraer parámetros musicales (rítmica, armonía, etc.) de los archivos.
- **Generación de Embeddings**: Integración con el motor de búsqueda para convertir las características extraídas en vectores de búsqueda.

## Capabilities

### New Capabilities
- `music-ingestion`: Servicio para la ingesta y normalización de formatos musicales (MusicXML, MIDI, Audio).
- `feature-extraction`: Lógica para extraer dimensiones 6D de archivos musicales.

### Modified Capabilities
*(Ninguna)*

## Impact

- **Nuevo servicio**: `src/services/music-ingestion.service.ts`
- **Nuevos adaptadores**: `src/infrastructure/ingestors/`
- **Dependencias**: Librerías para parsing de MusicXML/MIDI y procesamiento de audio (ej. `tonal`, `musicxml-interfaces`, `essentia.js` o similar).
