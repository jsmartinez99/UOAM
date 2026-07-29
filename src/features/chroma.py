"""
Chroma features for harmonic analysis and key estimation.
"""

import numpy as np
import librosa
from typing import Dict, List, Tuple, Optional


def chroma_cqt(y: np.ndarray, sr: int,
                hop_length: int = 512,
                n_chroma: int = 12,
                bins_per_octave: int = 36,
                fmin: float = 32.70) -> np.ndarray:
    """
    Compute chroma using Constant-Q Transform (CQT).
    
    CQT provides better frequency resolution for low frequencies
    compared to STFT-based chroma.
    
    Args:
        y: Audio signal
        sr: Sample rate
        hop_length: Hop length
        n_chroma: Number of chroma bins (12)
        bins_per_octave: CQT bins per octave
        fmin: Minimum frequency
        
    Returns:
        chroma: Shape (12, n_frames)
    """
    chroma = librosa.feature.chroma_cqt(
        y=y, sr=sr, hop_length=hop_length,
        n_chroma=n_chroma, bins_per_octave=bins_per_octave,
        fmin=fmin
    )
    return chroma


def chroma_stft(y: np.ndarray, sr: int,
                 n_fft: int = 2048, hop_length: int = 512,
                 n_chroma: int = 12) -> np.ndarray:
    """
    Compute chroma using Short-Time Fourier Transform (STFT).
    
    Faster than CQT but less accurate for low frequencies.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        n_chroma: Number of chroma bins
        
    Returns:
        chroma: Shape (12, n_frames)
    """
    chroma = librosa.feature.chroma_stft(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length,
        n_chroma=n_chroma
    )
    return chroma


def chroma_cens(y: np.ndarray, sr: int,
                 hop_length: int = 512,
                 n_chroma: int = 12) -> np.ndarray:
    """
    Compute CENS (Chroma Energy Normalized Statistics) features.
    
    More robust to timbre and dynamics variations.
    
    Args:
        y: Audio signal
        sr: Sample rate
        hop_length: Hop length
        n_chroma: Number of chroma bins
        
    Returns:
        cens: Shape (12, n_frames)
    """
    cens = librosa.feature.chroma_cens(
        y=y, sr=sr, hop_length=hop_length,
        n_chroma=n_chroma
    )
    return cens


def extract_chroma_features(y: np.ndarray, sr: int,
                             hop_length: int = 512,
                             method: str = "cqt") -> Dict:
    """
    Extract chroma features using specified method.
    
    Args:
        y: Audio signal
        sr: Sample rate
        hop_length: Hop length
        method: "cqt", "stft", or "cens"
        
    Returns:
        Dictionary with chroma features
    """
    if method == "cqt":
        chroma = chroma_cqt(y, sr, hop_length=hop_length)
    elif method == "stft":
        chroma = chroma_stft(y, sr, hop_length=hop_length)
    elif method == "cens":
        chroma = chroma_cens(y, sr, hop_length=hop_length)
    else:
        raise ValueError(f"Unknown chroma method: {method}")
    
    times = librosa.frames_to_time(np.arange(chroma.shape[1]), sr=sr, hop_length=hop_length)
    
    return {
        'chroma': chroma,
        'times': times,
        'method': method
    }


def estimate_key_from_chroma(chroma: np.ndarray) -> Tuple[str, str, float]:
    """
    Estimate key from chroma using Krumhansl-Schmuckler algorithm.
    
    Args:
        chroma: Chroma features (12, n_frames)
        
    Returns:
        (key, mode, confidence): Key name, mode (major/minor), confidence
    """
    # Average chroma over time
    chroma_mean = np.mean(chroma, axis=1)
    
    # Krumhansl-Kessler key profiles
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 
                               2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                               2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    
    # Normalize profiles
    major_profile = major_profile / np.sum(major_profile)
    minor_profile = minor_profile / np.sum(minor_profile)
    
    # Normalize chroma
    chroma_norm = chroma_mean / (np.sum(chroma_mean) + 1e-10)
    
    # Correlate with all 12 major and 12 minor keys
    keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    best_corr = -1
    best_key = 'C'
    best_mode = 'major'
    
    for i in range(12):
        # Rotate profiles
        major_rot = np.roll(major_profile, i)
        minor_rot = np.roll(minor_profile, i)
        
        # Correlation
        major_corr = np.corrcoef(chroma_norm, major_rot)[0, 1]
        minor_corr = np.corrcoef(chroma_norm, minor_rot)[0, 1]
        
        if major_corr > best_corr:
            best_corr = major_corr
            best_key = keys[i]
            best_mode = 'major'
        
        if minor_corr > best_corr:
            best_corr = minor_corr
            best_key = keys[i]
            best_mode = 'minor'
    
    return best_key, best_mode, float(best_corr)


def detect_key_changes(chroma: np.ndarray, times: np.ndarray,
                        window_duration: float = 10.0,
                        hop_duration: float = 5.0) -> List[Dict]:
    """
    Detect key changes over time using sliding window.
    
    Args:
        chroma: Chroma features (12, n_frames)
        times: Time stamps for each frame
        window_duration: Window duration in seconds
        hop_duration: Hop duration in seconds
        
    Returns:
        List of key estimates with time ranges
    """
    sr = 1 / (times[1] - times[0]) * 512  # approximate
    window_frames = int(window_duration * sr / 512)
    hop_frames = int(hop_duration * sr / 512)
    
    key_changes = []
    
    for start in range(0, chroma.shape[1] - window_frames, hop_frames):
        end = start + window_frames
        window_chroma = chroma[:, start:end]
        
        if window_chroma.shape[1] < 10:
            continue
            
        key, mode, confidence = estimate_key_from_chroma(window_chroma)
        
        key_changes.append({
            'start_time': float(times[start]),
            'end_time': float(times[min(end, len(times)-1)]),
            'key': key,
            'mode': mode,
            'confidence': confidence
        })
    
    # Merge consecutive windows with same key
    merged = []
    for kc in key_changes:
        if merged and merged[-1]['key'] == kc['key'] and merged[-1]['mode'] == kc['mode']:
            merged[-1]['end_time'] = kc['end_time']
            merged[-1]['confidence'] = max(merged[-1]['confidence'], kc['confidence'])
        else:
            merged.append(kc)
    
    return merged


def compute_section_chroma(chroma_data: Dict, section_times: List[Tuple[float, float]]) -> Dict:
    """
    Compute chroma statistics per section.
    
    Args:
        chroma_data: Dictionary from extract_chroma_features
        section_times: List of (start_time, end_time) tuples
        
    Returns:
        Per-section chroma statistics
    """
    chroma = chroma_data['chroma']
    times = chroma_data['times']
    
    results = {}
    
    for i, (start, end) in enumerate(section_times):
        mask = (times >= start) & (times < end)
        if not np.any(mask):
            continue
        
        section_chroma = chroma[:, mask]
        
        # Mean chroma vector
        mean_chroma = np.mean(section_chroma, axis=1)
        
        # Key estimation for this section
        key, mode, confidence = estimate_key_from_chroma(section_chroma)
        
        # Chroma variance (measure of harmonic stability)
        chroma_var = np.var(section_chroma, axis=1)
        
        results[f'section_{i}'] = {
            'mean_chroma': mean_chroma.tolist(),
            'chroma_variance': chroma_var.tolist(),
            'estimated_key': key,
            'estimated_mode': mode,
            'key_confidence': confidence,
            'start_time': start,
            'end_time': end,
            'duration': end - start
        }
    
    return results


def chord_template_matching(chroma: np.ndarray, 
                             templates: Dict[str, np.ndarray] = None) -> List[Dict]:
    """
    Match chroma to chord templates.
    
    Args:
        chroma: Chroma features (12, n_frames)
        templates: Dictionary of chord name -> 12-bin template
        
    Returns:
        List of chord estimates per frame
    """
    if templates is None:
        # Major and minor triad templates
        templates = {}
        for root in range(12):
            # Major: root, major third, perfect fifth
            major = np.zeros(12)
            major[root] = 1.0
            major[(root + 4) % 12] = 0.8
            major[(root + 7) % 12] = 0.6
            templates[f'{["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][root]}'] = major
            
            # Minor: root, minor third, perfect fifth
            minor = np.zeros(12)
            minor[root] = 1.0
            minor[(root + 3) % 12] = 0.8
            minor[(root + 7) % 12] = 0.6
            templates[f'{["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][root]}m'] = minor
    
    # Normalize templates
    for name, tmpl in templates.items():
        templates[name] = tmpl / (np.linalg.norm(tmpl) + 1e-10)
    
    # Match each frame
    chords = []
    for frame_idx in range(chroma.shape[1]):
        frame_chroma = chroma[:, frame_idx]
        frame_norm = frame_chroma / (np.linalg.norm(frame_chroma) + 1e-10)
        
        best_chord = None
        best_score = -1
        
        for name, tmpl in templates.items():
            score = np.dot(frame_norm, tmpl)
            if score > best_score:
                best_score = score
                best_chord = name
        
        chords.append({
            'chord': best_chord,
            'confidence': float(best_score)
        })
    
    return chords