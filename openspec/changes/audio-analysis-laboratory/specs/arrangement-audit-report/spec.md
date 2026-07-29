## ADDED Requirements

### Requirement: Generate comprehensive audit report
The system SHALL produce a single HTML/PDF report combining all verification results: boundary alignment, harmonic analysis, dynamic profile, density verification, with overall pass/fail.

#### Scenario: Report generated for valid arrangement
- **WHEN** all verifications pass
- **THEN** report shows overall_status = "PASS", all sections green

#### Scenario: Report generated for arrangement with deviations
- **WHEN** some verifications fail
- **THEN** report shows overall_status = "FAIL", failed sections highlighted red

### Requirement: Report includes executive summary
The report SHALL have executive summary with: arrangement title, composer, duration, overall status, number of sections, number of deviations, critical findings.

#### Scenario: Executive summary populated
- **WHEN** report generated
- **THEN** executive summary contains all required fields

### Requirement: Report includes detailed per-section findings
Each section SHALL have: boundary alignment (expected vs actual), harmonic comparison (schema vs estimated), dynamic comparison (target vs measured), density comparison, list of deviations with severity (critical/major/minor).

#### Scenario: Per-section detail complete
- **WHEN** viewing section 3 (Development) in report
- **THEN** all four comparison tables present with deviation list

### Requirement: Report includes visualizations
Report SHALL embed: waveform with section boundaries, spectrogram with section overlays, LUFS curve with schema targets, chromagram with chord estimates, boundary alignment chart.

#### Scenario: Visualizations render in HTML report
- **WHEN** opening report.html in browser
- **THEN** all 5 charts visible and interactive (Plotly.js)

#### Scenario: Visualizations render in PDF report
- **WHEN** opening report.pdf
- **THEN** all 5 charts present as static images

### Requirement: Report exportable as HTML and PDF
The system SHALL generate both report.html (interactive) and report.pdf (printable) from same Jinja2 template using WeasyPrint.

#### Scenario: HTML and PDF both generated
- **WHEN** running `generate-report arrangement.json audio.wav`
- **THEN** both report.html and report.pdf created

#### Scenario: PDF matches HTML content
- **WHEN** comparing HTML and PDF
- **THEN** all text content identical, charts present in both