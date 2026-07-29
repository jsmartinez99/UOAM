## ADDED Requirements

### Requirement: Extract tempo and beat grid from audio
The system SHALL extract tempo (BPM) and beat positions (in seconds) from audio using madmom or essentia.

#### Scenario: Tempo extraction within 2 BPM of ground truth
- **WHEN** analyzing audio with known tempo 120 BPM
- **THEN** extracted tempo is between 118-122 BPM

#### Scenario: Beat positions align with musical beats
- **WHEN** analyzing click track at 120 BPM
- **THEN** beat positions match expected times within 50ms

### Requirement: Extract spectral centroid and bandwidth over time
The system SHALL compute spectral centroid (Hz) and spectral bandwidth (Hz) per frame using librosa.

#### Scenario: Spectral centroid tracks brightness changes
- **WHEN** analyzing audio with filter sweep from 200Hz to 8000Hz
- **THEN** centroid rises monotonically from ~200Hz to ~8000Hz

#### Scenario: Spectral bandwidth reflects spectral spread
- **WHEN** analyzing sine wave vs white noise
- **THEN** sine wave bandwidth < 50Hz, noise bandwidth > 5000Hz

### Requirement: Extract RMS energy and loudness (LUFS) per section
The system SHALL compute RMS (dBFS) and integrated LUFS per arrangement section using pyloudnorm.

#### Scenario: RMS matches Audacity measurement within 0.5 dB
- **WHEN** comparing RMS from librosa vs Audacity on same file
- **THEN** difference < 0.5 dB

#### Scenario: LUFS meets EBU R128 standard
- **WHEN** measuring EBU R128 test signal
- **THEN** integrated LUFS = -23.0 ± 0.5 LUFS

### Requirement: Extract spectral contrast and flatness
The system SHALL compute spectral contrast (sub-band energy ratios) and spectral flatness (noisiness measure) per frame.

#### Scenario: Spectral contrast distinguishes harmonic vs percussive
- **WHEN** analyzing piano (harmonic) vs drum (percussive)
- **THEN** piano contrast > 20dB, drum contrast < 10dB

#### Scenario: Spectral flatness detects noise content
- **WHEN** analyzing sine wave vs white noise
- **THEN** sine flatness < 0.1, noise flatness > 0.8

### Requirement: Extract chroma features for harmonic analysis
The system SHALL compute chroma (12-bin pitch class profile) using CQT or STFT via librosa.

#### Scenario: Chroma matches known key
- **WHEN** analyzing C major scale recording
- **THEN** chroma peaks at C, E, G (indices 0, 4, 7)

#### Scenario: Chroma detects key change
- **WHEN** analyzing modulation from C major to G major
- **THEN** chroma profile shifts from C/E/G to G/B/D dominance