"""
Harmonic content analysis: chord estimation, key detection, cadence classification.
Integrates Chordino (Vamp plugin) and provides fallback using librosa/essentia.
"""

import numpy as np
import warnings
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
import json
import subprocess
import tempfile
import os

# Try imports
try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    warnings.warn("librosa not available")

try:
    import essentia.standard as es
    ESSENTIA_AVAILABLE = True
except ImportError:
    ESSENTIA_AVAILABLE = False
    warnings.warn("essentia not available")

try:
    import vamp
    VAMP_AVAILABLE = True
except ImportError:
    VAMP_AVAILABLE = False
    warnings.warn("vamp not available - Chordino integration will use fallback")


# Chord templates for template matching fallback
CHORD_TEMPLATES = {
    # Major triads
    'C': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
    'C#': [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    'D': [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    'D#': [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    'E': [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    'F': [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    'F#': [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    'G': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    'G#': [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    'A': [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    'A#': [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    'B': [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
    # Minor triads
    'Cm': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    'C#m': [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    'Dm': [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    'D#m': [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
    'Em': [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
    'Fm': [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    'F#m': [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    'Gm': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    'G#m': [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
    'Am': [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    'A#m': [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    'Bm': [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    # Dominant 7th
    'C7': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    'D7': [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    'E7': [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    'F7': [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    'G7': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    'A7': [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    'B7': [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
}


def normalize_chroma(chroma: np.ndarray) -> np.ndarray:
    """Normalize chroma vector to unit length."""
    norm = np.linalg.norm(chroma)
    if norm > 0:
        return chroma / norm
    return chroma


def match_chord_template(chroma: np.ndarray) -> Tuple[str, float]:
    """
    Match chroma vector to closest chord template.
    
    Args:
        chroma: 12-bin chroma vector
        
    Returns:
        (chord_name, confidence)
    """
    chroma_norm = normalize_chroma(chroma)
    
    best_chord = 'N'
    best_score = -1
    
    for chord_name, template in CHORD_TEMPLATES.items():
        template_norm = normalize_chroma(np.array(template, dtype=float))
        score = np.dot(chroma_norm, template_norm)
        if score > best_score:
            best_score = score
            best_chord = chord_name
    
    return best_chord, float(best_score)


def estimate_chords_from_chroma(chroma: np.ndarray, 
                                 times: np.ndarray,
                                 hop_length: int = 512,
                                 sr: int = 22050) -> List[Dict]:
    """
    Estimate chord sequence from chroma using template matching.
    
    Args:
        chroma: Chroma features (12, n_frames)
        times: Time stamps for each frame
        hop_length: Hop length
        sr: Sample rate
        
    Returns:
        List of chord estimates with time, chord, confidence
    """
    n_frames = chroma.shape[1]
    # Use 2-second windows
    window_frames = int(2.0 * sr / hop_length)
    hop_frames = window_frames // 2
    
    chords = []
    
    for start in range(0, n_frames - window_frames, hop_frames):
        end = min(start + window_frames, n_frames)
        window_chroma = chroma[:, start:end]
        mean_chroma = np.mean(window_chroma, axis=1)
        
        chord, confidence = match_chord_template(mean_chroma)
        
        chords.append({
            'time': float(times[start]),
            'frame': start,
            'chord': chord,
            'confidence': confidence
        })
    
    return chords


def run_chordino_vamp(audio_path: str) -> List[Dict]:
    """
    Run Chordino Vamp plugin on audio file.
    
    Args:
        audio_path: Path to audio file
        
    Returns:
        List of chord estimates with time, chord, confidence
    """
    if not VAMP_AVAILABLE:
        raise RuntimeError("Vamp not available")
    
    try:
        # Load audio with vamp
        import soundfile as sf
        audio, sr = sf.read(audio_path)
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)
        
        # Use Chordino plugin
        # Plugin key: "nnls-chroma:chordino"
        chord_data = vamp.collect(audio, sr, "nnls-chroma:chordino")
        
        # Parse results
        chords = []
        if 'list' in chord_data:
            for item in chord_data['list']:
                chords.append({
                    'time': float(item['timestamp']),
                    'chord': item['label'],
                    'confidence': 1.0  # Chordino doesn't provide confidence
                })
        
        return chords
    
    except Exception as e:
        warnings.warn(f"Chordino Vamp failed: {e}")
        return []


def run_chordino_commandline(audio_path: str) -> List[Dict]:
    """
    Run Chordino via command line (sonic-annotator).
    
    Args:
        audio_path: Path to audio file
        
    Returns:
        List of chord estimates
    """
    try:
        # Use sonic-annotator with Chordino
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as tmp:
            tmp_path = tmp.name
        
        cmd = [
            'sonic-annotator',
            '-d', 'nnls-chroma:chordino',
            '-w', 'csv',
            '--csv-basedir', os.path.dirname(tmp_path),
            '--csv-force',
            audio_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        # Parse CSV output
        chords = []
        if os.path.exists(tmp_path):
            with open(tmp_path, 'r') as f:
                for line in f:
                    parts = line.strip().split(',')
                    if len(parts) >= 3:
                        try:
                            time = float(parts[0])
                            chord = parts[2].strip('"')
                            chords.append({
                                'time': time,
                                'chord': chord,
                                'confidence': 1.0
                            })
                        except ValueError:
                            continue
            os.unlink(tmp_path)
        
        return chords
    
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception) as e:
        warnings.warn(f"Chordino command line failed: {e}")
        return []


def estimate_chords(audio: np.ndarray, sr: int,
                     method: str = "auto") -> List[Dict]:
    """
    Estimate chords from audio using available methods.
    
    Args:
        audio: Audio signal
        sr: Sample rate
        method: "vamp", "commandline", "template", or "auto"
        
    Returns:
        List of chord estimates
    """
    if method == "auto":
        if VAMP_AVAILABLE:
            method = "vamp"
        else:
            method = "template"
    
    if method == "vamp":
        # Save audio to temp file for Vamp
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            tmp_path = tmp.name
        try:
            import soundfile as sf
            sf.write(tmp_path, audio, sr)
            chords = run_chordino_vamp(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        return chords
    
    elif method == "commandline":
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            tmp_path = tmp.name
        try:
            import soundfile as sf
            sf.write(tmp_path, audio, sr)
            chords = run_chordino_commandline(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        return chords
    
    elif method == "template":
        # Use librosa chroma + template matching
        if not LIBROSA_AVAILABLE:
            raise RuntimeError("librosa required for template matching")
        
        chroma = librosa.feature.chroma_cqt(y=audio, sr=sr, hop_length=512)
        times = librosa.frames_to_time(np.arange(chroma.shape[1]), sr=sr, hop_length=512)
        return estimate_chords_from_chroma(chroma, times, 512, sr)
    
    else:
        raise ValueError(f"Unknown method: {method}")


def estimate_key_global(chroma: np.ndarray) -> Dict:
    """
    Estimate global key from chroma using Krumhansl-Schmuckler.
    
    Args:
        chroma: Chroma features (12, n_frames)
        
    Returns:
        Dictionary with key, mode, confidence, alternatives
    """
    # Average chroma over time
    chroma_mean = np.mean(chroma, axis=1)
    
    # Krumhansl-Kessler key profiles
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 
                               2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                               2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    
    # Normalize
    major_profile = major_profile / np.sum(major_profile)
    minor_profile = minor_profile / np.sum(minor_profile)
    chroma_norm = chroma_mean / (np.sum(chroma_mean) + 1e-10)
    
    keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    correlations = []
    for i in range(12):
        major_rot = np.roll(major_profile, i)
        minor_rot = np.roll(minor_profile, i)
        
        corr_major = np.corrcoef(chroma_norm, major_rot)[0, 1]
        corr_minor = np.corrcoef(chroma_norm, minor_rot)[0, 1]
        
        correlations.append(('major', keys[i], corr_major))
        correlations.append(('minor', keys[i], corr_minor))
    
    correlations.sort(key=lambda x: x[2], reverse=True)
    
    best_mode, best_key, best_corr = correlations[0]
    
    return {
        'key': best_key,
        'mode': best_mode,
        'confidence': float(best_corr),
        'alternatives': [
            {'key': k, 'mode': m, 'confidence': float(c)}
            for m, k, c in correlations[:5]
        ]
    }


def detect_key_changes(chroma: np.ndarray, times: np.ndarray,
                        window_duration: float = 10.0,
                        hop_duration: float = 5.0) -> List[Dict]:
    """
    Detect local key changes using sliding window.
    
    Args:
        chroma: Chroma features (12, n_frames)
        times: Time stamps
        window_duration: Window duration in seconds
        hop_duration: Hop duration in seconds
        
    Returns:
        List of key change points
    """
    sr = 1 / (times[1] - times[0]) * 512 if len(times) > 1 else 22050
    window_frames = int(window_duration * sr / 512)
    hop_frames = int(hop_duration * sr / 512)
    
    if window_frames >= chroma.shape[1]:
        return []
    
    changes = []
    
    for start in range(0, chroma.shape[1] - window_frames, hop_frames):
        end = start + window_frames
        window_chroma = chroma[:, start:end]
        
        if window_chroma.shape[1] < 10:
            continue
        
        key_info = estimate_key_global(window_chroma)
        
        # Only add if different from previous
        if not changes or changes[-1]['key'] != key_info['key'] or changes[-1]['mode'] != key_info['mode']:
            changes.append({
                'start_time': float(times[start]),
                'end_time': float(times[min(end, len(times)-1)]),
                'key': key_info['key'],
                'mode': key_info['mode'],
                'confidence': key_info['confidence']
            })
    
    return changes


def roman_numeral_analysis(chords: List[Dict], key: str, mode: str) -> List[Dict]:
    """
    Convert absolute chords to Roman numerals relative to key.
    
    Args:
        chords: List of chord estimates
        key: Key tonic
        mode: 'major' or 'minor'
        
    Returns:
        Chords with Roman numeral analysis
    """
    key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    try:
        key_idx = key_names.index(key)
    except ValueError:
        key_idx = 0
    
    # Scale degree mapping
    degree_map = {0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6}
    
    major_rn = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
    minor_rn = ['i', 'ii', 'III', 'iv', 'v', 'VI', 'VII']
    
    for chord in chords:
        # Parse chord root
        chord_root = chord['chord'][0]
        if len(chord['chord']) > 1 and chord['chord'][1] in '#b':
            chord_root = chord['chord'][:2]
            quality = chord['chord'][2:]
        else:
            quality = chord['chord'][1:]
        
        try:
            root_idx = key_names.index(chord_root)
        except ValueError:
            chord['roman'] = '?'
            continue
        
        interval = (root_idx - key_idx) % 12
        
        if interval in degree_map:
            degree = degree_map[interval]
            if mode == 'major':
                rn = major_rn[degree]
            else:
                rn = minor_rn[degree]
            
            # Add quality
            if 'm' in quality and 'maj' not in quality and 'min' not in quality:
                rn = rn.lower()
            elif 'dim' in quality or '°' in quality:
                rn = rn + '°'
            elif 'aug' in quality or '+' in quality:
                rn = rn + '+'
            elif '7' in quality and 'maj7' not in quality:
                rn = rn + '7'
            elif 'maj7' in quality:
                rn = rn + 'maj7'
            
            chord['roman'] = rn
        else:
            chord['roman'] = '?'
    
    return chords


def classify_cadence(chords: List[Dict], key: str, mode: str) -> str:
    """
    Classify cadence type from last few chords.
    
    Args:
        chords: List of chord estimates (last 4-8 chords)
        key: Key tonic
        mode: 'major' or 'minor'
        
    Returns:
        Cadence type: 'authentic', 'plagal', 'half', 'deceptive', 'none'
    """
    if len(chords) < 2:
        return 'none'
    
    # Get last two chords with Roman numerals
    chords_rn = roman_numeral_analysis(chords[-4:], key, mode)
    
    if len(chords_rn) < 2:
        return 'none'
    
    penultimate = chords_rn[-2].get('roman', '')
    final = chords_rn[-1].get('roman', '')
    
    # Normalize
    penultimate = penultimate.replace('7', '').replace('°', '').replace('+', '')
    final = final.replace('7', '').replace('°', '').replace('+', '')
    
    # Check cadence types
    # Authentic: V -> I (or V7 -> I)
    if penultimate.upper() == 'V' and final.upper() == 'I':
        return 'authentic'
    
    # Plagal: IV -> I
    if penultimate.upper() == 'IV' and final.upper() == 'I':
        return 'plagal'
    
    # Half: ends on V
    if final.upper() == 'V':
        return 'half'
    
    # Deceptive: V -> vi
    if penultimate.upper() == 'V' and final.upper() == 'VI':
        return 'deceptive'
    
    return 'none'


def compute_harmonic_similarity(schema_progression: List[str],
                                 estimated_chords: List[Dict],
                                 key: str, mode: str) -> Dict:
    """
    Compute similarity between schema progression and estimated chords.
    
    Args:
        schema_progression: List of Roman numerals from schema
        estimated_chords: List of estimated chords with Roman numerals
        key: Key tonic
        mode: 'major' or 'minor'
        
    Returns:
        Dictionary with similarity score and details
    """
    # Convert estimated to Roman numerals
    estimated_rn = [c.get('roman', '?') for c in estimated_chords]
    
    # Simple sequence alignment
    if not schema_progression or not estimated_rn:
        return {'score': 0.0, 'matches': 0, 'total': 0, 'details': []}
    
    matches = 0
    details = []
    
    for i, expected in enumerate(schema_progression):
        if i < len(estimated_rn):
            estimated = estimated_rn[i]
            # Normalize for comparison
            expected_norm = expected.replace('7', '').replace('°', '').replace('+', '').replace('maj7', '')
            estimated_norm = estimated.replace('7', '').replace('°', '').replace('+', '').replace('maj7', '')
            is_match = expected_norm.upper() == estimated_norm.upper()
            if is_match:
                matches += 1
            details.append({
                'position': i,
                'expected': expected,
                'estimated': estimated,
                'match': is_match
            })
    
    total = len(schema_progression)
    score = matches / total if total > 0 else 0.0
    
    return {
        'score': score,
        'matches': matches,
        'total': total,
        'details': details
    }


def generate_harmonic_report(audio_path: str,
                              schema: Dict,
                              method: str = "auto") -> Dict:
    """
    Generate complete harmonic analysis report.
    
    Args:
        audio_path: Path to audio file
        schema: Arrangement schema with sections and harmonic plan
        method: Chord estimation method
        
    Returns:
        Complete harmonic report
    """
    import soundfile as sf
    
    audio, sr = sf.read(audio_path)
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)
    
    # Global key estimation
    if LIBROSA_AVAILABLE:
        chroma = librosa.feature.chroma_cqt(y=audio, sr=sr, hop_length=512)
        times = librosa.frames_to_time(np.arange(chroma.shape[1]), sr=sr, hop_length=512)
    else:
        raise RuntimeError("librosa required for harmonic analysis")
    
    global_key = estimate_key_global(chroma)
    
    # Chord estimation
    chords = estimate_chords(audio, sr, method=method)
    
    # Roman numeral analysis
    chords_rn = roman_numeral_analysis(chords, global_key['key'], global_key['mode'])
    
    # Key changes
    key_changes = detect_key_changes(chroma, times)
    
    # Per-section analysis
    section_results = []
    for section in schema.get('sections', []):
        start_time = section.get('start_time', 0)
        end_time = section.get('end_time', 0)
        
        # Filter chords in this section
        section_chords = [c for c in chords_rn 
                         if start_time <= c.get('time', 0) <= end_time]
        
        # Cadence at section end
        cadence = classify_cadence(section_chords, global_key['key'], global_key['mode'])
        
        # Harmonic similarity if schema has progression
        schema_prog = section.get('harmonic_plan', {}).get('progression', [])
        similarity = compute_harmonic_similarity(
            schema_prog, section_chords, global_key['key'], global_key['mode']
        ) if schema_prog else None
        
        section_results.append({
            'section_id': section.get('id', ''),
            'section_label': section.get('label', ''),
            'start_time': start_time,
            'end_time': end_time,
            'chord_count': len(section_chords),
            'chords': section_chords[:10],
            'cadence': cadence,
            'harmonic_similarity': similarity
        })
    
    return {
        'global_key': global_key,
        'key_changes': key_changes,
        'total_chords': len(chords_rn),
        'sections': section_results
    }