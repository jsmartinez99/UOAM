# section-boundary-verification Specification

## Purpose
TBD - created by archiving change audio-analysis-laboratory. Update Purpose after archive.
## Requirements
### Requirement: Detect section boundaries from audio features
The system SHALL identify section boundaries by detecting significant changes in spectral, timbral, and rhythmic features.

#### Scenario: Boundary detected at known section change
- **WHEN** analyzing arrangement with clear section change at measure 17 (0:34)
- **THEN** algorithm detects boundary within ±2 measures of 0:34

#### Scenario: No false boundaries in homogeneous sections
- **WHEN** analyzing 32 measures of consistent texture
- **THEN** algorithm detects ≤1 boundary (only at section edges)

### Requirement: Align detected boundaries to arrangement schema measures
The system SHALL map detected boundaries to the nearest measure in the arrangement schema using tempo map.

#### Scenario: Detected boundary maps to correct schema measure
- **WHEN** boundary detected at 34.2s, tempo 120 BPM, 4/4 time
- **THEN** maps to measure 17 (34.0s) not measure 18 (36.0s)

#### Scenario: Tempo changes handled correctly
- **WHEN** arrangement has tempo change at measure 25
- **THEN** measure-to-time mapping uses piecewise tempo map

### Requirement: Score boundary alignment accuracy
The system SHALL compute boundary F1 score comparing detected vs schema boundaries with tolerance window.

#### Scenario: Perfect alignment scores 1.0
- **WHEN** all detected boundaries within ±1 measure of schema
- **THEN** F1 = 1.0

#### Scenario: Missed boundary reduces recall
- **WHEN** schema has 5 boundaries, algorithm detects 4
- **THEN** recall = 0.8, precision = 1.0, F1 = 0.89

### Requirement: Report boundary deviations in audit
The system SHALL list each schema boundary with: expected measure, detected time, deviation (measures), status (match/early/late/missed).

#### Scenario: Deviation report includes all boundaries
- **WHEN** arrangement has 5 sections
- **THEN** report lists 5 entries with deviation values

#### Scenario: Early/late classification correct
- **WHEN** detected 0.5 measures before schema boundary
- **THEN** status = "early", deviation = -0.5

