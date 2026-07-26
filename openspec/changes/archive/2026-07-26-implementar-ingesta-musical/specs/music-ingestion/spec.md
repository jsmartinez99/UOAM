## ADDED Requirements

### Requirement: Ingesta de formatos simbólicos (MusicXML, MIDI)
El sistema SHALL aceptar y procesar archivos en formato MusicXML y MIDI, extrayendo características estructurales para su análisis.

#### Scenario: Ingesta exitosa de archivo MusicXML
- **WHEN** se envía un archivo MusicXML válido
- **THEN** el sistema extrae las características musicales y las devuelve estructuradas

#### Scenario: Ingesta de archivo MIDI
- **WHEN** se envía un archivo MIDI válido
- **THEN** el sistema parsea los eventos MIDI y extrae parámetros de tempo, notas, canales y dinámicas

### Requirement: Ingesta de audio digital (WAV, MP3)
El sistema SHALL procesar archivos de audio WAV y MP3, extrayendo características espectrales para su análisis.

#### Scenario: Ingesta exitosa de archivo WAV
- **WHEN** se envía un archivo WAV válido
- **THEN** el sistema extrae características espectrales (MFCC, chroma, spectral centroid)

#### Scenario: Rechazo de formato no soportado
- **WHEN** se envía un archivo con formato no soportado
- **THEN** el sistema rechaza con error "Formato no soportado"
