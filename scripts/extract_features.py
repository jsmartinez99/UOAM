#!/usr/bin/env python3
"""
Feature extraction CLI for arrangement verification.
Extracts audio features with section-aware processing.
"""

import argparse
import json
import sys
import warnings
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import numpy as np

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False

try:
    import essentia.standard as es
    ESSENTIA_AVAILABLE = True
except ImportError:
    ESSENTIA_AVAILABLE = False

# Import local feature modules
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.features.tempo import extract_tempo, extract_downbeats, measure_to_time, time_to_measure
from src.features.spectral import extract_spectral_features, compute_section_features
from src.features.loudness import compute_section_loudness, map_dynamics_to_lufs
from src.features.texture import extract_texture_features, compute_section_texture
from src.features.chroma import extract_chroma_features, compute_section_chroma


def load_audio(filepath: str, sr: int = 44100, mono: bool = True) -> Tuple[np.ndarray, int]:
    """Load audio file using librosa or essentia."""
    if LIBROSA_AVAILABLE:
        y, sr_loaded = librosa.load(filepath, sr=sr, mono=mono)
        return y, sr_loaded
    elif ESSENTIA_AVAILABLE:
        loader = es.MonoLoader(filename=filepath, sampleRate=sr)
        y = loader()
        return y, sr
    else:
        raise RuntimeError("No audio loading backend available (need librosa or essentia)")


def load_arrangement(filepath: str) -> Dict:
    """Load arrangement JSON file."""
    with open(filepath, 'r') as f:
        return json.load(f)


def compute_section_times(arrangement: Dict, audio_duration: float) -> List[Tuple[float, float]]:
    """Compute section time boundaries from arrangement."""
    sections = arrangement.get('sections', [])
    metadata = arrangement.get('metadata', {})
    global_tempo = metadata.get('global_tempo_bpm', 120)
    time_signature = metadata.get('time_signature', '4/4')
    
    section_times = []
    for section in sections:
        start_measure = section.get('start_measure', 1)
        end_measure = section.get('end_measure', start_measure)
        tempo = section.get('tempo_bpm', global_tempo)
        ts = section.get('time_signature', time_signature)
        
        start_time = measure_to_time(start_measure, tempo, ts)
        end_time = measure_to_time(end_measure + 1, tempo, ts)  # +1 to include end measure
        
        # Clamp to audio duration
        start_time = max(0, min(start_time, audio_duration))
        end_time = max(start_time, min(end_time, audio_duration))
        
        section_times.append((start_time, end_time))
    
    return section_times


def extract_all_features(audio: np.ndarray, sr: int, 
                          section_times: List[Tuple[float, float]],
                          arrangement: Dict = None) -> Dict:
    """Extract all features from audio."""
    print("Extracting tempo and beats...")
    bpm, beats = extract_tempo(audio, sr)
    downbeats = extract_downbeats(audio, sr)
    
    print("Extracting spectral features...")
    spectral = extract_spectral_features(audio, sr)
    
    print("Extracting loudness features...")
    loudness = compute_section_loudness(audio, sr, section_times)
    
    print("Extracting texture features...")
    texture = extract_texture_features(audio, sr)
    
    print("Extracting chroma features...")
    chroma = extract_chroma_features(audio, sr)
    
    # Compute per-section features
    print("Computing per-section features...")
    section_spectral = compute_section_features(spectral, section_times, sr)
    section_texture = compute_section_texture(texture, section_times)
    section_chroma = compute_section_chroma(chroma, section_times)
    
    # Map arrangement dynamics to target LUFS
    section_dynamics = {}
    if arrangement:
        sections = arrangement.get('sections', [])
        for i, section in enumerate(sections):
            dynamics = section.get('dynamics', 'mf')
            dynamics_pct = section.get('dynamics_percent')
            target_lufs, tolerance = map_dynamics_to_lufs(dynamics, dynamics_pct)
            section_dynamics[f'section_{i}'] = {
                'target_lufs': target_lufs,
                'tolerance_lu': tolerance,
                'dynamics': dynamics,
                'dynamics_percent': dynamics_pct
            }
    
    return {
        'global': {
            'sample_rate': sr,
            'duration': len(audio) / sr,
            'tempo_bpm': float(bpm),
            'beats': beats.tolist(),
            'downbeats': downbeats.tolist(),
            'num_beats': len(beats),
            'num_downbeats': len(downbeats)
        },
        'spectral': {
            'global': {k: v.tolist() if isinstance(v, np.ndarray) else v 
                      for k, v in spectral.items() if k != 'times'},
            'per_section': section_spectral
        },
        'loudness': {
            'per_section': loudness
        },
        'texture': {
            'global': {k: v.tolist() if isinstance(v, np.ndarray) else v 
                      for k, v in texture.items() if k != 'times'},
            'per_section': section_texture
        },
        'chroma': {
            'global': {k: v.tolist() if isinstance(v, np.ndarray) else v 
                      for k, v in chroma.items() if k != 'times'},
            'per_section': section_chroma
        },
        'section_times': section_times,
        'section_dynamics': section_dynamics
    }


def save_features(features: Dict, output_path: str):
    """Save features to JSON file."""
    # Convert numpy types to Python types
    def convert(obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, dict):
            return {k: convert(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert(v) for v in obj]
        return obj
    
    features = convert(features)
    
    with open(output_path, 'w') as f:
        json.dump(features, f, indent=2)
    
    print(f"Features saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Extract audio features for arrangement verification",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract features with arrangement schema
  python scripts/extract_features.py audio.wav arrangement.json -o features.json
  
  # Extract features without arrangement (auto-detect sections)
  python scripts/extract_features.py audio.wav -o features.json
        """
    )
    
    parser.add_argument('audio', help='Input audio file (WAV, FLAC, MP3, etc.)')
    parser.add_argument('arrangement', nargs='?', help='Arrangement JSON file (optional)')
    parser.add_argument('-o', '--output', default='features.json', help='Output JSON file')
    parser.add_argument('--sr', type=int, default=44100, help='Target sample rate')
    parser.add_argument('--mono', action='store_true', default=True, help='Convert to mono')
    parser.add_argument('--no-mono', dest='mono', action='store_false', help='Keep stereo')
    
    args = parser.parse_args()
    
    # Load audio
    print(f"Loading audio: {args.audio}")
    audio, sr = load_audio(args.audio, sr=args.sr, mono=args.mono)
    print(f"  Duration: {len(audio)/sr:.2f}s, Sample rate: {sr}Hz, Channels: {audio.ndim}")
    
    # Load arrangement if provided
    arrangement = None
    if args.arrangement:
        print(f"Loading arrangement: {args.arrangement}")
        arrangement = load_arrangement(args.arrangement)
    
    # Compute section times
    if arrangement:
        section_times = compute_section_times(arrangement, len(audio)/sr)
        print(f"Found {len(section_times)} sections from arrangement")
        for i, (start, end) in enumerate(section_times):
            print(f"  Section {i+1}: {start:.2f}s - {end:.2f}s ({end-start:.2f}s)")
    else:
        # Auto-detect sections (simple: divide into 5 equal parts)
        duration = len(audio) / sr
        section_times = []
        for i in range(5):
            start = i * duration / 5
            end = (i + 1) * duration / 5
            section_times.append((start, end))
        print(f"No arrangement provided, using {len(section_times)} auto-detected sections")
    
    # Extract features
    print("\nExtracting features...")
    features = extract_all_features(audio, sr, section_times, arrangement)
    
    # Save
    save_features(features, args.output)
    
    print("\nDone!")


if __name__ == '__main__':
    main()