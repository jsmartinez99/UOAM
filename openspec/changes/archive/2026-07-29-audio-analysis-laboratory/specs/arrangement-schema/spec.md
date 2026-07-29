## ADDED Requirements

### Requirement: Arrangement schema defines formal structure
The system SHALL define a JSON Schema (arrangement-schema.json) for describing musical arrangements with sections, measures, tempo, dynamics, instrumentation, and harmonic content.

#### Scenario: Valid arrangement document passes validation
- **WHEN** user validates arrangement.json against arrangement-schema.json using jsonschema
- **THEN** validation succeeds with no errors

#### Scenario: Invalid arrangement document fails validation
- **WHEN** user validates arrangement with missing required fields (e.g., no sections)
- **THEN** validation fails with descriptive error messages

### Requirement: Section definition includes measure range and metadata
Each section SHALL have: id (string), label (string), start_measure (integer), end_measure (integer), tempo_bpm (number), time_signature (string), dynamics (string), instrumentation (array of strings), density_percent (integer), harmonic_content (object).

#### Scenario: Section with all fields is valid
- **WHEN** section contains all required fields with correct types
- **THEN** schema validation passes

#### Scenario: Section with measure overlap is rejected
- **WHEN** two sections have overlapping measure ranges
- **THEN** custom validator raises overlap error

### Requirement: Dynamics use standardized notation
Dynamics field SHALL use standard music notation: ppp, pp, p, mp, mf, f, ff, fff, or percentage 0-100.

#### Scenario: Valid dynamic notation accepted
- **WHEN** dynamics field contains "f" or "85"
- **THEN** validation passes

#### Scenario: Invalid dynamic notation rejected
- **WHEN** dynamics field contains "loud" or "120"
- **THEN** validation fails with enum error

### Requirement: Instrumentation references controlled vocabulary
Instrumentation array SHALL contain only instruments from controlled vocabulary: violin, viola, cello, double_bass, flute, oboe, clarinet, bassoon, horn, trumpet, trombone, tuba, timpani, percussion, piano, harp, synthesizer, voice_soprano, voice_alto, voice_tenor, voice_bass.

#### Scenario: Known instruments accepted
- **WHEN** instrumentation contains ["violin", "cello", "horn"]
- **THEN** validation passes

#### Scenario: Unknown instrument rejected
- **WHEN** instrumentation contains ["theremin"]
- **THEN** validation fails with enum error

### Requirement: Harmonic content describes chord progression
Harmonic content object SHALL contain: progression (array of chord symbols in Roman numeral or absolute notation), key (string), mode (major/minor), cadence_type (string: authentic, plagal, half, deceptive, none).

#### Scenario: Complete harmonic content valid
- **WHEN** harmonic_content has progression ["I", "vi", "ii", "V7", "I"], key "C", mode "major", cadence_type "authentic"
- **THEN** validation passes

#### Scenario: Invalid chord symbol rejected
- **WHEN** progression contains "X7" (invalid Roman numeral)
- **THEN** validation fails with pattern error