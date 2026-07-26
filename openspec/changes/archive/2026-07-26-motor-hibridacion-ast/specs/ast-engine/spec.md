## ADDED Requirements

### Requirement: Estructura de datos AST Musical
El sistema SHALL representar la música como un Árbol de Sintaxis Abstracta (AST) jerárquico.

#### Scenario: Creación de nodo AST válido
- **WHEN** se crea un nodo AST (ej. `NoteNode`, `ChordNode`)
- **THEN** el nodo valida su estructura interna

### Requirement: Parser de AST
El sistema SHALL permitir parsear estructuras musicales a un AST.

#### Scenario: Parseo exitoso de estructura simple
- **WHEN** se parsea una estructura musical simple
- **THEN** el sistema retorna el AST correspondiente
