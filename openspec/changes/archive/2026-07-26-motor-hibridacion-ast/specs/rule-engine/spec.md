## ADDED Requirements

### Requirement: Motor de reglas declarativas
El sistema SHALL permitir definir reglas de transformación musical de forma declarativa y aplicarlas sobre el AST.

#### Scenario: Aplicación de regla de transposición
- **WHEN** se aplica una regla de transposición sobre un nodo AST
- **THEN** el nodo es transformado correctamente según la regla

### Requirement: Recorrido recursivo del AST
El motor SHALL recorrer el AST de forma recursiva para aplicar reglas en todos los niveles.

#### Scenario: Aplicación de regla en nodos hijos
- **WHEN** se aplica una regla sobre un nodo padre
- **THEN** la regla se propaga y aplica a todos los nodos hijos relevantes
