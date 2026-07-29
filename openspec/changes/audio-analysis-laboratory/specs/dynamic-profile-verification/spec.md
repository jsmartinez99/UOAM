## ADDED Requirements

### Requirement: Extract dynamic profile (loudness over time)
The system SHALL compute short-term LUFS (3s window) and RMS (50ms window) across entire audio duration.

#### Scenario: Dynamic profile captures crescendo detected in arrangement
- **WHEN** arrangement specifies pp to ff over 32 measures
- **THEN** LUFS curve shows monotonic increase of ~20 LU

#### Scenario: Fade-out detected in coda
- **WHEN** arrangement specifies fade-out over last 8 measures
- **THEN** LUFS curve shows monotonic decrease to -∞ LUFS

### Requirement: Compare dynamic profile to schema dynamics
The system SHALL map schema dynamics (ppp/pp/p/mp/mf/f/ff/fff or 0-100%) to target LUFS ranges and compute deviation.

#### Scenario: Section dynamics within tolerance
- **WHEN** schema specifies "f" (target -18 LUFS ±3 LU), measured -19 LUFS
- **THEN** deviation = -1 LU, status = "match"

#### Scenario: Section dynamics out of tolerance
- **WHEN** schema specifies "pp" (target -36 LUFS ±3 LU), measured -24 LUFS
- **THEN** deviation = +12 LU, status = "too_loud"

### Requirement: Verify density/instrumentation matches spectral density
The system SHALL compute spectral flux and spectral centroid as proxies for instrumentation density and compare to schema density_percent.

#### Scenario: High density section shows high spectral flux
- **WHEN** schema density = 90% (full orchestra)
- **THEN** spectral flux > 0.7 (normalized), centroid > 3000Hz

#### Scenario: Low density section shows low spectral flux
- **WHEN** schema density = 20% (solo horn)
- **THEN** spectral flux < 0.3, centroid ~ 800Hz

### Requirement: Report dynamic deviations in audit
The system SHALL list each section with: schema dynamics, target LUFS, measured LUFS, deviation (LU), schema density, measured spectral flux, density status.

#### Scenario: Dynamic report includes all sections
- **WHEN** arrangement has 5 sections
- **THEN** report has 5 entries with all dynamic fields

#### Scenario: Fade-out verification in coda
- **WHEN** schema specifies fade_out = true for coda
- **THEN** report includes fade_out_verified = true/false with slope measurement