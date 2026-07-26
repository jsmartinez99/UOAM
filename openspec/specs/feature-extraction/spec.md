# feature-extraction Specification

## Purpose
TBD - created by archiving change implementar-ingesta-musical. Update Purpose after archive.
## Requirements
### Requirement: Extracción de dimensiones 6D
El sistema SHALL extraer las 6 dimensiones técnicas (organología, armonía, contrapunto, textura, rítmica, taste) a partir de las características extraídas de los archivos musicales.

#### Scenario: Extracción exitosa de dimensiones 6D
- **WHEN** se procesan las características extraídas de un archivo
- **THEN** el sistema genera una firma 6D válida

### Requirement: Generación de embedding para búsqueda
El sistema SHALL generar un vector de embedding a partir de la firma 6D extraída, listo para búsqueda en Qdrant.

#### Scenario: Embedding generado tras extracción
- **WHEN** la extracción de dimensiones 6D se completa exitosamente
- **THEN** el sistema genera un vector de embedding listo para búsqueda

