## ADDED Requirements

### Requirement: Generación de reporte analítico basado en contexto RAG
El sistema SHALL generar reportes analíticos en lenguaje natural sobre las influencias estilísticas detectadas, utilizando un pipeline RAG que inyecta el contexto vectorial recuperado del Módulo de Búsqueda Semántica.

#### Scenario: Reporte generado con alta confianza
- **WHEN** el Confidence Score es ≥ 0.5 y el contexto contiene datos de arreglista y dimensión
- **THEN** el sistema genera un reporte analítico con el contenido del LLM

#### Scenario: Rechazo por confianza insuficiente
- **WHEN** el Confidence Score es < 0.5
- **THEN** el sistema lanza un error "Confianza insuficiente para generar reporte concluyente"

### Requirement: Construcción de prompt con contexto controlado
El prompt enviado al LLM SHALL contener exclusivamente el contexto recuperado (arreglista, dimensión, score) sin permitir información no autorizada.

#### Scenario: Prompt inyecta contexto del dominio
- **WHEN** se invoca la generación del reporte con contexto de arreglista "Lalo Schifrin" y dimensión "Rhythm"
- **THEN** el prompt enviado al LLM contiene estrictamente esos valores

### Requirement: Reporte con metadatos de auditoría
Cada reporte generado SHALL incluir metadatos: arreglista detectado, dimensión principal, Confidence Score y timestamp.

#### Scenario: Metadatos incluidos en la respuesta del reporte
- **WHEN** se genera un reporte exitosamente
- **THEN** la respuesta incluye content (string) y metadatos con arranger, matchedDimension, confidence, timestamp
