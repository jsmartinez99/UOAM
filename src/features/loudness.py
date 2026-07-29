"""
Loudness computation: RMS energy and LUFS (EBU R128).
"""

import numpy as np
import warnings

try:
    import pyloudnorm as pyln
    PYLOUDNORM_AVAILABLE = True
except ImportError:
    PYLOUDNORM_AVAILABLE = False
    warnings.warn("pyloudnorm not available - LUFS computation will use fallback")

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False


def compute_rms(y: np.ndarray, frame_length: int = 2048, 
                hop_length: int = 512) -> np.ndarray:
    """
    Compute RMS energy per frame.
    
    Args:
        y: Audio signal
        frame_length: Frame length in samples
        hop_length: Hop length in samples
        
    Returns:
        rms: RMS energy per frame (linear amplitude)
    """
    if LIBROSA_AVAILABLE:
        rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    else:
        # Manual implementation
        n_frames = 1 + (len(y) - frame_length) // hop_length
        rms = np.zeros(n_frames)
        for i in range(n_frames):
            start = i * hop_length
            end = start + frame_length
            frame = y[start:end]
            rms[i] = np.sqrt(np.mean(frame ** 2))
    return rms


def rms_to_dbfs(rms: np.ndarray, ref: float = 1.0) -> np.ndarray:
    """
    Convert RMS to dBFS.
    
    Args:
        rms: RMS values (linear)
        ref: Reference value (1.0 for full scale)
        
    Returns:
        dBFS values
    """
    with np.errstate(divide='ignore', invalid='ignore'):
        dbfs = 20 * np.log10(np.maximum(rms, 1e-10) / ref)
    return dbfs


def compute_lufs_integrated(y: np.ndarray, sr: int) -> float:
    """
    Compute integrated LUFS (EBU R128) for entire signal.
    
    Args:
        y: Audio signal
        sr: Sample rate
        
    Returns:
        Integrated LUFS value
    """
    if not PYLOUDNORM_AVAILABLE:
        # Fallback: approximate from RMS
        rms = np.sqrt(np.mean(y ** 2))
        return 20 * np.log10(max(rms, 1e-10)) - 0.691  # rough approximation
    
    meter = pyln.Meter(sr)
    meter = pyln.Meter(sr)
    loudness = meter.integrated_loudness(y)
    return loudness


def compute_lufs_short_term(y: np.ndarray, sr: int, 
                             window_duration: float = 3.0) -> np.ndarray:
    """
    Compute short-term LUFS (3s window per EBU R128).
    
    Args:
        y: Audio signal
        sr: Sample rate
        window_duration: Window duration in seconds
        
    Returns:
        Short-term LUFS per window
    """
    if not PYLOUDNORM_AVAILABLE:
        # Fallback: sliding window RMS
        window_samples = int(window_duration * sr)
        hop_samples = window_samples // 2
        n_windows = max(1, (len(y) - window_samples) // hop_samples + 1)
        lufs = np.zeros(n_windows)
        for i in range(n_windows):
            start = i * hop_samples
            end = start + window_samples
            frame = y[start:end]
            rms = np.sqrt(np.mean(frame ** 2))
            lufs[i] = 20 * np.log10(max(rms, 1e-10)) - 0.691
        return lufs
    
    meter = pyln.Meter(sr)
    window_samples = int(window_duration * sr)
    hop_samples = window_samples // 2
    
    n_windows = max(1, (len(y) - window_samples) // hop_samples + 1)
    lufs = np.zeros(n_windows)
    
    for i in range(n_windows):
        start = i * hop_samples
        end = start + window_samples
        frame = y[start:end]
        lufs[i] = meter.integrated_loudness(frame)
    
    return lufs


def compute_lufs_momentary(y: np.ndarray, sr: int,
                            window_duration: float = 0.4) -> np.ndarray:
    """
    Compute momentary LUFS (400ms window per EBU R128).
    
    Args:
        y: Audio signal
        sr: Sample rate
        window_duration: Window duration in seconds
        
    Returns:
        Momentary LUFS per window
    """
    return compute_lufs_short_term(y, sr, window_duration)


def compute_loudness_range(y: np.ndarray, sr: int) -> float:
    """
    Compute Loudness Range (LRA) per EBU R128.
    
    Args:
        y: Audio signal
        sr: Sample rate
        
    Returns:
        LRA in LU
    """
    if not PYLOUDNORM_AVAILABLE:
        return 0.0
    
    meter = pyln.Meter(sr)
    lra = meter.loudness_range(y)
    return lra


def compute_true_peak(y: np.ndarray, sr: int, oversample: int = 4) -> float:
    """
    Compute true peak level (dBTP) with oversampling.
    
    Args:
        y: Audio signal
        sr: Sample rate
        oversample: Oversampling factor
        
    Returns:
        True peak in dBTP
    """
    if not PYLOUDNORM_AVAILABLE:
        # Simple peak
        peak = np.max(np.abs(y))
        return 20 * np.log10(max(peak, 1e-10))
    
    meter = pyln.Meter(sr)
    true_peak = meter.true_peak(y, oversample=oversample)
    return true_peak


def compute_section_loudness(y: np.ndarray, sr: int,
                              section_times: list) -> dict:
    """
    Compute loudness metrics per section.
    
    Args:
        y: Audio signal
        sr: Sample rate
        section_times: List of (start_time, end_time) tuples
        
    Returns:
        Dictionary with per-section loudness metrics
    """
    results = {}
    
    for i, (start, end) in enumerate(section_times):
        start_sample = int(start * sr)
        end_sample = int(end * sr)
        section_audio = y[start_sample:end_sample]
        
        if len(section_audio) == 0:
            continue
        
        # Integrated LUFS for section
        integrated = compute_lufs_integrated(section_audio, sr)
        
        # Short-term LUFS
        short_term = compute_lufs_short_term(section_audio, sr)
        
        # RMS
        rms = np.sqrt(np.mean(section_audio ** 2))
        rms_dbfs = 20 * np.log10(max(rms, 1e-10))
        
        # True peak
        true_peak = compute_true_peak(section_audio, sr)
        
        # Crest factor
        peak = np.max(np.abs(section_audio))
        crest_factor = 20 * np.log10(max(peak / max(rms, 1e-10), 1e-10))
        
        results[f'section_{i}'] = {
            'integrated_lufs': float(integrated),
            'short_term_lufs': short_term.tolist(),
            'short_term_lufs_mean': float(np.mean(short_term)),
            'short_term_lufs_std': float(np.std(short_term)),
            'rms_dbfs': float(rms_dbfs),
            'true_peak_dbtp': float(true_peak),
            'crest_factor_db': float(crest_factor),
            'duration': float(len(section_audio) / sr)
        }
    
    return results


def map_dynamics_to_lufs(dynamics: str, dynamics_percent: int = None) -> tuple:
    """
    Map musical dynamics notation to target LUFS range.
    
    Args:
        dynamics: Dynamics string (ppp, pp, p, mp, mf, f, ff, fff)
        dynamics_percent: Optional percentage (0-100)
        
    Returns:
        (target_lufs, tolerance_lu): Target LUFS and tolerance in LU
    """
    # Standard orchestral dynamics to LUFS mapping (approximate)
    dynamics_map = {
        'ppp': (-42, 4),
        'pp': (-36, 3),
        'p': (-30, 3),
        'mp': (-24, 3),
        'mf': (-21, 3),
        'f': (-18, 3),
        'ff': (-15, 3),
        'fff': (-12, 4),
    }
    
    if dynamics in dynamics_map:
        return dynamics_map[dynamics]
    
    # If percentage given, map 0-100% to -48 to -6 LUFS
    if dynamics_percent is not None:
        pct = np.clip(dynamics_percent, 0, 100) / 100.0
        target = -48 + pct * 42  # -48 to -6
        return (target, 3)
    
    # Default
    return (-24, 3)


def compute_dynamic_deviation(measured_lufs: float, target_lufs: float, 
                               tolerance: float = 3.0) -> dict:
    """
    Compute dynamic deviation from target.
    
    Args:
        measured_lufs: Measured integrated LUFS
        target_lufs: Target LUFS from schema
        tolerance: Tolerance in LU
        
    Returns:
        Dictionary with deviation info
    """
    deviation = measured_lufs - target_lufs
    abs_deviation = abs(deviation)
    
    if abs_deviation <= tolerance:
        status = "match"
    elif deviation > 0:
        status = "too_loud"
    else:
        status = "too_quiet"
    
    return {
        'measured_lufs': measured_lufs,
        'target_lufs': target_lufs,
        'deviation_lu': deviation,
        'abs_deviation_lu': abs_deviation,
        'tolerance_lu': tolerance,
        'status': status
    }