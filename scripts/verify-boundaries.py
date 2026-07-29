#!/usr/bin/env python3
"""
Boundary verification CLI for arrangement audit.
Detects section boundaries in audio and compares to arrangement schema.
"""

import json
import argparse
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import warnings

import numpy as np

# Import feature extraction
from src.features.tempo import extract_tempo, extract_downbeats, measure_to_time, time_to_measure
from src.verification.boundaries import (
    detect_boundaries,
    align_boundaries_to_measures,
    compute_boundary_f1,
    generate_boundary_report
)

# Try to import audio loading
try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    warnings.warn("librosa not available")

try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
except ImportError:
    SOUNDFILE_AVAILABLE = False


def load_audio(filepath: str, sr: int = 44100, mono: bool = True) -> Tuple[np.ndarray, int]:
    """Load audio file."""
    if LIBROSA_AVAILABLE:
        y, sr_loaded = librosa.load(filepath, sr=sr, mono=mono)
        return y, sr_loaded
    elif SOUNDFILE_AVAILABLE:
        y, sr_loaded = sf.read(filepath)
        if y.ndim > 1 and mono:
            y = np.mean(y, axis=1)
        if sr_loaded != sr:
            import scipy.signal
            y = scipy.signal.resample(y, int(len(y) * sr / sr_loaded))
            sr_loaded = sr
        return y, sr_loaded
    else:
        raise RuntimeError("No audio loading library available (need librosa or soundfile)")


def load_arrangement(filepath: str) -> Dict:
    """Load arrangement schema from JSON."""
    with open(filepath, 'r') as f:
        return json.load(f)


def get_expected_boundaries(arrangement: Dict, sr: int) -> List[float]:
    """Get expected boundary times from arrangement schema."""
    sections = arrangement.get('sections', [])
    metadata = arrangement.get('metadata', {})
    global_tempo = metadata.get('global_tempo_bpm', 120)
    time_signature = metadata.get('time_signature', '4/4')
    
    boundaries = []
    for section in sections:
        start_measure = section.get('start_measure', 1)
        tempo = section.get('tempo_bpm', global_tempo)
        ts = section.get('time_signature', time_signature)
        
        # Convert measure to time
        time = measure_to_time(start_measure, tempo, ts)
        boundaries.append(time)
    
    return boundaries


def main():
    parser = argparse.ArgumentParser(
        description="Verify section boundaries in audio against arrangement schema",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Verify boundaries with arrangement schema
  python scripts/verify-boundaries.py audio.wav arrangement.json -o boundary_report.json
  
  # Just detect boundaries without arrangement
  python scripts/verify-boundaries.py audio.wav -o boundaries.json
        """
    )
    
    parser.add_argument('audio', help='Input audio file')
    parser.add_argument('arrangement', nargs='?', help='Arrangement schema JSON (optional)')
    parser.add_argument('-o', '--output', required=True, help='Output JSON report file')
    parser.add_argument('--sr', type=int, default=44100, help='Target sample rate')
    parser.add_argument('--tolerance', type=float, default=1.0, 
                       help='Boundary tolerance in measures (default: 1.0)')
    parser.add_argument('--min-distance', type=float, default=4.0,
                       help='Minimum distance between boundaries in seconds (default: 4.0)')
    
    args = parser.parse_args()
    
    # Load audio
    print(f"Loading audio: {args.audio}")
    try:
        audio, sr = load_audio(args.audio, sr=args.sr)
        print(f"  Loaded: {len(audio)/sr:.2f}s at {sr}Hz")
    except Exception as e:
        print(f"Error loading audio: {e}")
        sys.exit(1)
    
    # Load arrangement if provided
    arrangement = None
    expected_boundaries = None
    if args.arrangement:
        print(f"Loading arrangement: {args.arrangement}")
        try:
            arrangement = load_arrangement(args.arrangement)
            expected_boundaries = get_expected_boundaries(arrangement, sr)
            print(f"  Expected boundaries: {len(expected_boundaries)}")
            for i, b in enumerate(expected_boundaries):
                print(f"    {i+1}. {b:.2f}s")
        except Exception as e:
            print(f"Error loading arrangement: {e}")
            sys.exit(1)
    
    # Extract features for boundary detection
    print("Extracting features for boundary detection...")
    
    # Tempo and beats
    print("  [1/3] Tempo and beat tracking...")
    try:
        bpm, beat_times = extract_tempo(audio, sr)
        downbeat_times = extract_downbeats(audio, sr)
        print(f"      Tempo: {bpm:.1f} BPM, {len(beat_times)} beats, {len(downbeat_times)} downbeats")
    except Exception as e:
        print(f"      Warning: Tempo extraction failed: {e}")
        bpm, beat_times, downbeat_times = 120.0, np.array([]), np.array([])
    
    # Spectral features
    print("  [2/3] Spectral features...")
    try:
        from src.features.spectral import extract_spectral_features
        spectral = extract_spectral_features(audio, sr)
        print(f"      Extracted {len(spectral['flux'])} frames")
    except Exception as e:
        print(f"      Warning: Spectral extraction failed: {e}")
        spectral = {'flux': np.array([]), 'times': np.array([])}
    
    # Chroma features
    print("  [3/3] Chroma features...")
    try:
        from src.features.chroma import extract_chroma_features
        chroma = extract_chroma_features(audio, sr)
        print(f"      Extracted {chroma['chroma'].shape[1]} frames")
    except Exception as e:
        print(f"      Warning: Chroma extraction failed: {e}")
        chroma = {'chroma': np.zeros((12, 100)), 'times': np.linspace(0, len(audio)/sr, 100)}
    
    # Combine features
    features = {
        'spectral': spectral,
        'chroma': chroma,
        'tempo': {'bpm': bpm, 'beat_times': beat_times, 'downbeat_times': downbeat_times}
    }
    
    # Detect boundaries
    print("Detecting boundaries...")
    detected_boundaries = detect_boundaries(
        features, sr, 
        min_distance=args.min_distance
    )
    print(f"  Detected {len(detected_boundaries)} boundaries:")
    for i, b in enumerate(detected_boundaries):
        print(f"    {i+1}. {b:.2f}s")
    
    # Generate report
    if expected_boundaries:
        print("Aligning to arrangement measures...")
        # Align detected boundaries to measures
        aligned = align_boundaries_to_measures(
            detected_boundaries, expected_boundaries, 
            arrangement, sr
        )
        
        # Compute F1 score
        f1, precision, recall = compute_boundary_f1(
            detected_boundaries, expected_boundaries,
            tolerance_measures=args.tolerance,
            arrangement=arrangement, sr=sr
        )
        print(f"  F1 Score: {f1:.3f} (Precision: {precision:.3f}, Recall: {recall:.3f})")
        
        # Generate detailed report
        report = generate_boundary_report(
            detected_boundaries, expected_boundaries,
            arrangement, sr, args.tolerance
        )
        report['f1_score'] = f1
        report['precision'] = precision
        report['recall'] = recall
    else:
        # Just report detected boundaries
        report = {
            'detected_boundaries': detected_boundaries.tolist(),
            'num_boundaries': len(detected_boundaries),
            'audio_duration': len(audio) / sr,
            'tempo_bpm': bpm
        }
    
    # Save report
    with open(args.output, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nReport saved to: {args.output}")
    
    # Print summary
    if expected_boundaries:
        print(f"\nBoundary Verification Summary:")
        print(f"  Expected: {len(expected_boundaries)} boundaries")
        print(f"  Detected: {len(detected_boundaries)} boundaries")
        print(f"  F1 Score: {f1:.3f}")
        if f1 >= 0.8:
            print("  Status: PASS")
        else:
            print("  Status: FAIL")


if __name__ == '__main__':
    main()