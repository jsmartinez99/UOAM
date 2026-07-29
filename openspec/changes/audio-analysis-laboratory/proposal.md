## Why

Musical arrangements often claim a specific structure (e.g., 5-section form, specific harmonic progressions, dynamic arcs) but the actual rendered audio may deviate from the written score. There is currently no systematic, reproducible laboratory environment on Ubuntu 24.04 to audit audio against its declared arrangement structure—verifying section boundaries, harmonic content, spectral density, and dynamic profiles match the claimed musical architecture.

## What Changes

- **New Capability**: A complete audio analysis laboratory environment on Ubuntu 24.04 with installed and configured tools (Sonic Visualiser, Audacity, Vamp plugins, Python analysis stack)
- **New Capability**: Automated arrangement verification pipeline that compares audio features (onsets, chroma, spectral centroid, RMS energy) against a declared arrangement schema (section count, section boundaries, harmonic plan, dynamic curve)
- **New Capability**: Spectral and harmonic analysis tooling to extract chord sequences, key regions, and tonal tension profiles from rendered audio
- **New Capability**: Section boundary detection and validation against declared arrangement structure
- **New Capability**: Dynamic range and loudness profiling per arrangement section (LUFS, RMS, crest factor)
- **New Capability**: Report generation showing pass/fail against arrangement claims with visual evidence (spectrograms, chromagrams, waveform overlays)

## Capabilities

### New Capabilities
- `audio-lab-environment`: Ubuntu 24.04 provisioning script and Dockerfile for reproducible audio analysis environment with Sonic Visualiser, Audacity, Vamp plugins, Essentia, librosa, madmom, and Jupyter
- `arrangement-schema`: Formal specification for declaring musical arrangement structure (sections, boundaries, harmonic plan, dynamic targets, tempo map)
- `audio-feature-extraction`: Pipeline to compute onsets, beats, chroma, spectral centroid, MFCCs, RMS, spectral flux, and harmonic change detection from audio files
- `section-boundary-verification`: Algorithm to detect actual section boundaries in audio and compare against declared arrangement schema
- `harmonic-content-analysis`: Chord recognition, key estimation, and tonal tension profiling per section
- `dynamic-profile-verification`: LUFS/RMS/crest factor measurement per section vs. declared dynamic targets
- `arrangement-audit-report`: Automated report generator producing HTML/PDF with pass/fail matrix, annotated spectrograms, and deviation metrics

### Modified Capabilities
- None (all new capabilities)

## Impact

- New provisioning scripts in `scripts/provision-audio-lab.sh` and `Dockerfile.audio-lab`
- New Python package `arrangement_audit` with CLI `audit-arrangement`
- New specification files in `openspec/specs/` for each capability
- Integration with existing `music-ingestion` and `feature-extraction` specs if they exist
- No breaking changes to existing codebase