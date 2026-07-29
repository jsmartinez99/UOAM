## ADDED Requirements

### Requirement: Estimate chord progression from audio
The system SHALL estimate chord sequence using Chordino (Vamp) or madmom CNN chord recognition.

#### Scenario: Major key progression recognized
- **WHEN** analyzing I-vi-ii-V-I in C major
- **THEN** estimated chords include C, Am, Dm, G7, C

#### Scenario: Chord symbols match schema harmonic content
- **WHEN** arrangement schema specifies progression ["I", "vi", "ii", "V7", "I"]
- **THEN** estimated chords map to same Roman numerals within key

### Requirement: Estimate global key and local key changes
The system SHALL estimate global key (key + mode) and detect key changes at section boundaries.

#### Scenario: Global key matches arrangement key
- **WHEN** arrangement in G major
- **THEN** estimated key = G major with confidence > 0.8

#### Scenario: Key change at development section detected
- **WHEN** arrangement modulates from C major to E♭ major at measure 25
- **THEN** key estimation shows C major before, E♭ major after

### Requirement: Compare estimated harmony to schema harmonic content
The system SHALL compute harmonic similarity between estimated chord progression and schema progression using chord symbol matching.

#### Scenario: Exact progression match scores 1.0
- **WHEN** estimated = schema progression exactly
- **THEN** harmonic similarity = 1.0

#### Scenario: Substitution chords penalized appropriately
- **WHEN** schema has V7, estimated has vii°7 (valid substitution)
- **THEN** similarity > 0.7 (not 1.0, not 0.0)

### Requirement: Detect cadence types at section endings
The system SHALL classify cadence at each section end: authentic (V-I), plagal (IV-I), half (V), deceptive (V-vi), none.

#### Scenario: Authentic cadence detected at exposition end
- **WHEN** section ends with V7-I progression
- **THEN** cadence_type = "authentic"

#### Scenario: Deceptive cadence detected
- **WHEN** section ends with V-vi progression
- **THEN** cadence_type = "deceptive"

### Requirement: Report harmonic deviations in audit
The system SHALL list each section with: schema progression, estimated progression, similarity score, key match (yes/no), cadence match (yes/no).

#### Scenario: Harmonic report includes all sections
- **WHEN** arrangement has 5 sections
- **THEN** report has 5 entries with all fields populated