# audio-lab-environment Specification

## Purpose
TBD - created by archiving change audio-analysis-laboratory. Update Purpose after archive.
## Requirements
### Requirement: Environment provisions on Ubuntu 24.04
The system SHALL provide a provisioning script that installs all required audio analysis tools on a fresh Ubuntu 24.04 system.

#### Scenario: Native provisioning succeeds
- **WHEN** user runs `scripts/provision-audio-lab.sh` on Ubuntu 24.04
- **THEN** script completes without errors and all tools are available in PATH

#### Scenario: Docker image builds successfully
- **WHEN** user runs `docker build -f Dockerfile.audio-lab -t audio-lab .`
- **THEN** image builds without errors and container runs Sonic Visualiser headless

### Requirement: Sonic Visualiser installed with Vamp plugin support
The system SHALL install Sonic Visualiser 4.x with Vamp plugin SDK and Chordino plugin available.

#### Scenario: Sonic Visualiser launches and loads Vamp plugins
- **WHEN** user runs `sonic-visualiser --help` and `vamp-simple-host -l`
- **THEN** Sonic Visualiser shows version 4.x and Vamp lists Chordino plugin

### Requirement: Audacity installed with command-line batch processing
The system SHALL install Audacity 3.5+ with `audacity` CLI for automated RMS/LUFS measurement.

#### Scenario: Audacity CLI measures RMS of audio file
- **WHEN** user runs `audacity --batch --script=measure_rms.py input.wav`
- **THEN** script outputs RMS value in dBFS

### Requirement: Python analysis stack installed
The system SHALL install Python 3.12+ with librosa, essentia, madmom, pyloudnorm, numpy, scipy, matplotlib, pandas, typer, jinja2, weasyprint.

#### Scenario: Python imports succeed
- **WHEN** user runs `python3 -c "import librosa, essentia, madmom, pyloudnorm, typer, jinja2, weasyprint"`
- **THEN** no ImportError raised

### Requirement: Essentia streaming and standard modes available
The system SHALL provide both Essentia standard and streaming Python modules.

#### Scenario: Essentia streaming API works
- **WHEN** user runs `python3 -c "import essentia.streaming as es; print(es.AlgorithmFactory.create('MonoLoader'))"`
- **THEN** algorithm factory creates MonoLoader without error

