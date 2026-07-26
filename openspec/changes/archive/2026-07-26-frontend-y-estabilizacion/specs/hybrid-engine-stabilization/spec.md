## ADDED Requirements

### Requirement: Migración de reglas al motor AST
El motor de hibridación SHALL aplicar todas las reglas de resolución de conflictos (Flute, Piccolo, Tuba) utilizando el nuevo motor AST.

#### Scenario: Resolución de conflictos con reglas AST
- **WHEN** se fusionan perfiles con conflictos conocidos
- **THEN** el motor AST aplica las reglas y resuelve los conflictos correctamente
