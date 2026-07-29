## Context

Musical arrangers and producers need to verify that rendered audio matches the declared arrangement structure. Currently this is done manually by ear or with ad-hoc tooling. The laboratory provides a reproducible, automated environment on Ubuntu 24.04 (native or Docker) with professional-grade audio analysis tools and a Python pipeline for arrangement verification.

Key constraints:
- Must run on Ubuntu 24.04 LTS (native packages preferred, Docker as alternative)
- Must use open-source tools (Sonic Visualiser, Audacity, Vamp, Essentia, librosa, madmom)
- Must support common audio formats (WAV, FLAC, MP3, AIFF)
- Must produce human-readable audit reports with visual evidence
- Must be scriptable for CI/CD integration

## Goals / Non-Goals

**Goals:**
- Provision a complete audio analysis environment in < 10 minutes
- Define a machine-readable arrangement schema (YAML/JSON) for declaring musical structure
- Extract audio features relevant to arrangement verification: section boundaries, harmony, dynamics, tempo
- Compare extracted features against declared schema with quantitative metrics
- Generate HTML/PDF audit reports with annotated spectrograms and pass/fail matrix
- Provide CLI tool `audit-arrangement` for single-command verification

**Non-Goals:**
- Real-time audio processing or live performance analysis
- Music transcription (note-level MIDI output)
- Commercial DAW integration (Pro Tools, Logic, Cubase)
- Polyphonic pitch detection beyond chord/key level
- Subjective aesthetic judgment (only objective feature comparison)

## Decisions

### 1. Environment Provisioning: Native apt + pip + Dockerfile
**Rationale**: Ubuntu 24.04 has recent versions of Sonic Visualiser (4.x), Audacity (3.5+), and Vamp plugins in default repos. Dockerfile ensures reproducibility across machines. Native install is faster for development; Docker for CI.
**Alternatives considered**: Conda environment (slower, larger), Nix (steep learning curve), manual compile (not reproducible).

### 2. Arrangement Schema: YAML with JSON Schema validation
**Rationale**: YAML is human-readable for arrangers; JSON Schema enables programmatic validation. Schema includes sections (id, label, start_time, end_time, key, tempo, dynamic_target, harmonic_plan), global metadata (title, composer, time_signature), and tolerance thresholds.
**Alternatives considered**: Pure JSON (less readable), TOML (less tooling), custom DSL (over-engineering).

### 3. Audio Feature Extraction: Essentia + librosa hybrid
**Rationale**: Essentia (C++ with Python bindings) provides industrial-grade algorithms for onset detection, beat tracking, chroma, key estimation, and spectral features. librosa fills gaps (MFCC, spectral centroid, RMS) and integrates with scipy for statistics. madmom adds DBN-based beat/downbeat tracking.
**Alternatives considered**: Pure librosa (slower, less accurate onset/beat), Aubio (limited features), Marsyas (unmaintained), pure Essentia (no MFCC/spectral centroid convenience).

### 4. Section Boundary Detection: Multi-feature fusion
**Rationale**: No single feature reliably detects all section boundaries. Fuse: novelty curve (spectral flux), chroma change (harmonic shift), RMS change (dynamic shift), and beat-phase reset (structural downbeat). Weighted voting with configurable thresholds per genre.
**Alternatives considered**: Single-feature (novelty only - misses harmonic-only boundaries), ML classifier (needs training data, overkill), fixed grid (ignores musical reality).

### 5. Harmonic Analysis: Essentia KeyExtractor + Chordino (Vamp)
**Rationale**: Essentia's KeyExtractor (Krumhansl-Schmuckler + temperley) gives key per segment. Chordino (Vamp plugin via Sonic Visualiser or command line) gives chord sequence. Cross-validate: if both agree on key region, high confidence.
**Alternatives considered**: madmom CNN chords (GPU needed), CREMA (Python-only, slower), manual annotation (not automated).

### 6. Dynamic Profiling: EBU R128 (pyloudnorm) + per-section RMS/crest
**Rationale**: pyloudnorm implements ITU-R BS.1770-4 for LUFS. Per-section RMS and crest factor (peak/RMS) capture dynamic shape. Compare against declared dynamic targets (e.g., "section A: -18 LUFS, crest 12dB").
**Alternatives considered**: Simple RMS (no perceptual weighting), ReplayGain (deprecated), custom loudness (reinventing standard).

### 7. Report Generation: Jinja2 + WeasyPrint (HTML → PDF)
**Rationale**: Jinja2 templates for HTML report with embedded base64 images (spectrograms, chromagrams, waveforms). WeasyPrint converts to PDF for archival. Matplotlib/seaborn for plots. Single-file HTML for sharing.
**Alternatives considered**: ReportLab (complex), fpdf2 (limited layout), Jupyter nbconvert (heavy dependency), Pandoc (extra step).

### 8. CLI Interface: Typer (modern, type-safe)
**Rationale**: Typer (built on Click) gives automatic --help, type validation, shell completion. Subcommands: `audit-arrangement init`, `audit-arrangement analyze`, `audit-arrangement report`.
**Alternatives considered**: argparse (verbose), click (more boilerplate), fire (magic, less explicit).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Vamp plugin compatibility on Ubuntu 24.04 | Test Chordino, QM Vamp plugins in Dockerfile; fallback to Essentia-only harmony |
| Section detection false positives/negatives | Configurable tolerance thresholds; manual override in schema; confidence scores in report |
| Chord recognition accuracy on complex jazz/orchestral | Flag low-confidence segments; allow "harmonic_plan: free" in schema to skip chord check |
| Large audio files (>1hr) memory usage | Stream processing with Essentia's streaming API; chunked analysis |
| Non-44.1kHz sample rates | Resample to 44.1kHz on load (librosa.resample) with anti-aliasing |
| Schema version drift | JSON Schema with `$id` and version field; migration script for v1→v2 |