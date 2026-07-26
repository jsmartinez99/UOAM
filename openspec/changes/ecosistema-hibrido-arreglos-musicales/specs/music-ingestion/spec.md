## ADDED Requirements

### Requirement: Ingesta de formatos simbólicos (MusicXML, MIDI)
El sistema SHALL aceptar y procesar archivos en formato MusicXML y MIDI, extrayendo características estructurales para su análisis.

#### Scenario: Ingesta exitosa de archivo MusicXML
- **WHEN** se envía un archivo MusicXML válido
- **THEN** el sistema extrae las características musicales y las devuelve estructuradas

#### Scenario: Ingesta de archivo MIDI
- **WHEN** se envía un archivo MIDI válido
- **THEN** el sistema parsea los eventos MIDI y extrae parámetros de tempo, notas, canales y dinámicas

#### Scenario: Rechazo de formato no soportado
- **WHEN** se envía un archivo con formato no soportado
- **THEN** el sistema rechaza con error "Formato no soportado"

### Requirement: Ingesta de audio digital (WAV, MP3) con extracción espectral
El sistema SHALL procesar archivos de audio WAV y MP3, extrayendo características espectrales (MFCC, chroma, spectral centroid) para su posterior análisis.

#### Scenario: Ingesta exitosa de archivo WAV
- **WHEN** se envía un archivo WAV mono de 44.1kHz 16-bit
- **THEN** el sistema extrae MFCC, chroma features y spectral centroid

#### Scenario: Ingesta de archivo MP3
- **WHEN** se envía un archivo MP3 válido
- **THEN** el sistema lo decodifica a PCM y extrae las características espectrales

### Requirement: Extracción de embedding para búsqueda semántica
El sistema SHALL generar un vector de embedding a partir de las características extraídas, que pueda ser utilizado por el Módulo de Búsqueda Semántica.

#### Scenario: Embedding generado tras ingesta
- **WHEN** la ingesta de un archivo (simbólico o audio) se completa exitosamente
- **THEN** el sistema genera un vector de embedding listo para búsqueda en Qdrant
