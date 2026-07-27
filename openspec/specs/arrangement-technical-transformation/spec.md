# arrangement-technical-transformation Specification

## Purpose
Formalizar la desconstrucción del arreglo musical a una Matriz Técnica 6D (en teoría musical pura y jerga cualitativa de arreglistas), la asimilación profunda de conceptos a nivel profesional (Nivel 1 a Nivel 3) y habilitar la doble capacidad de aplicar dicha matriz a obras existentes (Re-arreglo / Hibridación de audio MP3) o crear arreglos autónomos por separado.

## Requirements

### Requirement: Desconstrucción a Matriz Técnica 6D y Ontología de Jerga Musical
El sistema SHALL descomponer cualquier arreglo u obra musical en parámetros técnicos cuantificables (voicings armónicos, sustituciones tritonales, vectores de movimiento contrapuntístico, matrices de acentuación rítmica y gestos estéticos), traduciendo la jerga cualitativa consensuada entre arreglistas a especificaciones operativas.

#### Scenario: Traducción de rearmonización a parámetros técnicos
- **WHEN** el sistema analiza una sección armónica de Nelson Riddle o Claus Ogerman
- **THEN** traduce la jerga cualitativa a reglas técnicas de sustitución de 6ª añadida (C6), voicings por cuartas y sustituciones tritonales en dominantes secundarios.

#### Scenario: Mapeo de gestos estéticos de autor en la dimensión de Gusto (Taste)
- **WHEN** se identifica la técnica "Riddle Lift" o "Ogerman Swell"
- **THEN** el sistema codifica el micro-desplazamiento de tiempo (anticipación de 1/16 al downbeat) o la curva de velocidad de volumen en la matriz técnica.

### Requirement: Ingesta y Desconstrucción de Audio MP3 de la Obra
El sistema SHALL procesar archivos de audio MP3 (ej. "Quítame la ropa antes del amanecer 1.mp3") extrayendo la estructura armónica mediante cromagrama (Pitch Class Profile), el pulso rítmico, los onsets y la envolvente tímbrica para construir su Matriz 6D base.

#### Scenario: Ingesta exitosa de la obra en MP3
- **WHEN** se procesa la obra "Quítame la ropa antes del amanecer 1.mp3"
- **THEN** el sistema extrae las 6 dimensiones de la pieza original y genera su vector de embedding listo para el motor de búsqueda semántica.

### Requirement: Modo Aplicar Arreglo (Re-Arreglo / Hibridación de la Obra)
El sistema SHALL permitir tomar una obra ingestada en MP3 ("Quítame la ropa antes del amanecer 1.mp3") y re-escribir su acompañamiento, armonía, contrapunto y orquestación impregnándole las reglas técnicas 6D de uno o más arreglistas del catálogo.

#### Scenario: Re-armonización y orquestación estilo Claus Ogerman / Piazzolla
- **WHEN** se solicita aplicar la firma 6D de Claus Ogerman u Astor Piazzolla sobre la obra "Quítame la ropa..."
- **THEN** el motor AST transforma la base armónica añadiendo voicings extendidos y aplica la acentuación rítmica `3+3+2` o el colchón de cuerdas "Ogerman Swell".

### Requirement: Modo Crear Arreglo por Separado (Generación Autónoma)
El sistema SHALL permitir generar un arreglo musical completo e independiente trazando la estructura formal de 5 secciones (Introducción, Exposición, Desarrollo, Clímax y Coda) e instrumentando cada sección según la Matriz 6D seleccionada.

#### Scenario: Generación autónoma de arreglo en 5 secciones desde cero
- **WHEN** se solicita crear un nuevo arreglo indicando una firma 6D objetivo
- **THEN** el sistema genera una estructura formal completa de 5 secciones (Intro $\to$ Exposición $\to$ Desarrollo $\to$ Clímax $\to$ Coda) aplicando la paleta sonora, conducción de voces y gestos estéticos seleccionados.

### Requirement: Evaluación del Grado de Profundidad y Asimilación Profesional (Depth Score)
El sistema SHALL evaluar el nivel de madurez y profundidad del análisis (Nivel 1: Superficial, Nivel 2: Técnico-Estructural, Nivel 3: Asimilación Profesional) otorgando un `Depth Score` de 0.0 a 1.0.

#### Scenario: Certificación de Asimilación Profesional Completa
- **WHEN** la extracción identifica con precisión rasgos de Nivel 3 en al menos 4 de las 6 dimensiones
- **THEN** el sistema certifica una "Asimilación Profesional Completa" con un Confidence Score $\ge 0.85$.
