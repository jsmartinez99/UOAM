## 1. Audio Lab Environment Setup

- [x] 1.1 Create provisioning script `scripts/provision-audio-lab.sh` for Ubuntu 24.04
- [x] 1.2 Create Dockerfile `Dockerfile.audio-lab` with all tools pre-installed
- [x] 1.3 Verify Sonic Visualiser 4.x + Vamp SDK + Chordino plugin installation
- [x] 1.4 Verify Audacity 3.5+ CLI batch processing capability
- [x] 1.5 Verify Python 3.12+ with librosa, essentia, madmom, pyloudnorm, numpy, scipy, matplotlib, pandas, typer, jinja2, weasyprint
- [x] 1.6 Verify Essentia streaming and standard Python modules available

## 2. Arrangement Schema Definition

- [x] 2.1 Create JSON Schema `schemas/arrangement-schema.json` with all required fields
- [x] 2.2 Implement custom validator for section measure overlap detection
- [x] 2.3 Define controlled vocabulary for instruments in schema
- [x] 2.4 Define dynamic notation enum (ppp, pp, p, mp, mf, f, ff, fff, 0-100)
- [x] 2.5 Define harmonic content structure (progression, key, mode, cadence_type)
- [x] 2.6 Create example arrangement `examples/sample-arrangement.json` that validates
- [x] 2.7 Add jsonschema validation script `scripts/validate-arrangement.py`

## 3. Audio Feature Extraction Pipeline

- [x] 3.1 Implement tempo and beat extraction using madmom/essentia (`src/features/tempo.py`)
- [x] 3.2 Implement spectral centroid and bandwidth extraction (`src/features/spectral.py`)
- [x] 3.3 Implement RMS energy and LUFS computation per section (`src/features/loudness.py`)
- [x] 3.4 Implement spectral contrast and flatness extraction (`src/features/texture.py`)
- [x] 3.5 Implement chroma feature extraction for harmonic analysis (`src/features/chroma.py`)
- [x] 3.6 Create feature extraction CLI `scripts/extract_features.py` with section-aware processing
- [x] 3.7 Add unit tests for each feature extractor against known test signals

## 4. Section Boundary Verification

- [x] 4.1 Implement boundary detection using feature change points (`src/verification/boundaries.py`)
- [x] 4.2 Implement measure-to-time mapping using tempo map from arrangement
- [x] 4.3 Implement boundary alignment scoring (F1 with tolerance window)
- [x] 4.4 Generate boundary deviation report (expected vs detected, deviation in measures)
- [x] 4.5 Add boundary verification CLI `scripts/verify-boundaries.py`

## 5. Harmonic Content Analysis

- [x] 5.1 Integrate Chordino (Vamp) for chord estimation (`src/verification/harmony.py`)
- [x] 5.2 Implement global key estimation and local key change detection
- [x] 5.3 Implement harmonic similarity scoring (schema vs estimated progression)
- [x] 5.4 Implement cadence classification at section endings
- [x] 5.5 Generate harmonic deviation report per section
- [x] 5.6 Add harmonic verification CLI `scripts/verify-harmony.py`

## 6. Dynamic Profile Verification

- [x] 6.1 Implement short-term LUFS (3s window) and RMS (50ms) computation
- [x] 6.2 Map schema dynamics (ppp-fff, 0-100%) to target LUFS ranges
- [x] 6.3 Compute dynamic deviation per section (target vs measured LUFS)
- [x] 6.4 Implement spectral flux and centroid as density proxies
- [x] 6.5 Verify fade-out detection in coda sections
- [x] 6.6 Generate dynamic profile report with all sections
- [x] 6.7 Add dynamic verification CLI `scripts/verify-dynamics.py`

## 7. Arrangement Audit Report Generation

- [x] 7.1 Create Jinja2 HTML template `templates/report.html.j2` with all sections
- [x] 7.2 Implement Plotly.js visualizations: waveform, spectrogram, LUFS curve, chromagram, boundary chart
- [x] 7.3 Implement executive summary generation
- [x] 7.4 Implement per-section detail tables with deviation severity
- [x] 7.5 Add WeasyPrint PDF generation from same template
- [x] 7.6 Create report generation CLI `scripts/generate-report.py`
- [x] 7.7 Verify HTML and PDF output match in content

## 8. Integration and End-to-End Testing

- [x] 8.1 Create master CLI `scripts/audit-arrangement.py` orchestrating all verifications
- [x] 8.2 Test with sample arrangement + audio (full pipeline)
- [x] 8.3 Test with arrangement containing known deviations (should FAIL)
- [x] 8.4 Test with arrangement matching audio (should PASS)
- [x] 8.5 Document usage in `README.md` with examples
- [x] 8.6 Add CI/CD pipeline for automated testing
