"""
Dynamic profile verification: LUFS, RMS, crest factor, fade-out detection.
Compares measured dynamics against declared arrangement schema targets.
"""
import numpy as np
import warnings
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
import json

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    warnings.warn("librosa not available")

try:
    import pyloudnorm as pyln
    PYLN_AVAILABLE = True
except ImportError:
    PYLN_AVAILABLE = False
    warnings.warn("pyloudnorm not available - LUFS will use RMS fallback")


DYNAMIC_TARGETS = {
    'ppp': {'lufs': (-36, -30), 'rms_db': (-36, -30), 'density_pct': (0, 10)},
    'pp':  {'lufs': (-30, -24), 'rms_db': (-30, -24), 'density_pct': (10, 25)},
    'p':   {'lufs': (-24, -18), 'rms_db': (-24, -18), 'density_pct': (25, 40)},
    'mp':  {'lufs': (-18, -14), 'rms_db': (-18, -14), 'density_pct': (40, 55)},
    'mf':  {'lufs': (-14, -10), 'rms_db': (-14, -10), 'density_pct': (55, 70)},
    'f':   {'lufs': (-10, -6),  'rms_db': (-10, -6),  'density_pct': (70, 85)},
    'ff':  {'lufs': (-6, -2),   'rms_db': (-6, -2),   'density_pct': (85, 95)},
    'fff': {'lufs': (-2, 0),    'rms_db': (-2, 0),    'density_pct': (95, 100)},
}


def compute_rms(audio: np.ndarray, frame_length: int = 2048, hop_length: int = 512) -> Tuple[np.ndarray, np.ndarray]:
    """Compute RMS energy over time."""
    if LIBROSA_AVAILABLE:
        rms = librosa.feature.rms(y=audio, frame_length=frame_length, hop_length=hop_length)[0]
        times = librosa.frames_to_time(np.arange(len(rms)), hop_length=hop_length)
        return rms, times
    else:
        n_frames = 1 + (len(audio) - frame_length) // hop_length
        rms = np.zeros(n_frames)
        for i in range(n_frames):
            frame = audio[i * hop_length: i * hop_length + frame_length]
            rms[i] = np.sqrt(np.mean(frame ** 2))
        times = np.arange(n_frames) * hop_length / 22050
        return rms, times


def compute_lufs(audio: np.ndarray, sr: int) -> float:
    """Compute integrated LUFS (ITU-R BS.1770-4)."""
    if PYLN_AVAILABLE:
        meter = pyln.Meter(sr)
        loudness = meter.integrated_loudness(audio)
        return float(loudness)
    else:
        rms = np.sqrt(np.mean(audio ** 2))
        if rms > 0:
            return float(20 * np.log10(rms))
        return -70.0


def compute_short_term_lufs(audio: np.ndarray, sr: int, window_s: float = 3.0) -> Tuple[np.ndarray, np.ndarray]:
    """Compute short-term LUFS with sliding window."""
    window_samples = int(window_s * sr)
    hop_samples = window_samples // 2
    n_windows = 1 + (len(audio) - window_samples) // hop_samples

    lufs_values = np.zeros(n_windows)
    times = np.zeros(n_windows)

    for i in range(n_windows):
        start = i * hop_samples
        end = start + window_samples
        segment = audio[start:end]
        lufs_values[i] = compute_lufs(segment, sr)
        times[i] = (start + window_samples / 2) / sr

    return lufs_values, times


def compute_crest_factor(audio: np.ndarray) -> float:
    """Compute crest factor (peak / RMS)."""
    rms = np.sqrt(np.mean(audio ** 2))
    peak = np.max(np.abs(audio))
    if rms > 0:
        return float(20 * np.log10(peak / rms))
    return 0.0


def compute_spectral_flux(audio: np.ndarray, sr: int, hop_length: int = 512) -> Tuple[np.ndarray, np.ndarray]:
    """Compute spectral flux as density proxy."""
    if not LIBROSA_AVAILABLE:
        return np.array([]), np.array([])

    S = np.abs(librosa.stft(audio, hop_length=hop_length))
    flux = np.sum(np.diff(S, axis=1) ** 2, axis=0)
    flux = np.concatenate([[0], flux])
    times = librosa.frames_to_time(np.arange(len(flux)), hop_length=hop_length)
    return flux, times


def detect_fade_out(rms: np.ndarray, times: np.ndarray,
                    threshold_db: float = -3.0,
                    min_duration_s: float = 2.0) -> Optional[Dict]:
    """Detect fade-out at end of audio."""
    if len(rms) < 10:
        return None

    rms_db = 20 * np.log10(np.maximum(rms, 1e-10))
    last_portion = min(int(len(rms) * 0.3), len(rms))
    end_rms = rms_db[-last_portion:]

    if len(end_rms) < 5:
        return None

    start_val = end_rms[0]
    end_val = end_rms[-1]
    drop = end_val - start_val

    if drop < threshold_db:
        return None

    duration = times[-1] - times[-last_portion]
    if duration < min_duration_s:
        return None

    return {
        'detected': True,
        'start_time': float(times[-last_portion]),
        'end_time': float(times[-1]),
        'duration_s': float(duration),
        'level_drop_db': float(drop),
        'start_level_db': float(start_val),
        'end_level_db': float(end_val)
    }


def map_dynamic_to_target(dynamic: str) -> Dict:
    """Map dynamic marking to target LUFS/RMS range."""
    if dynamic in DYNAMIC_TARGETS:
        return DYNAMIC_TARGETS[dynamic]
    if isinstance(dynamic, (int, float)):
        pct = float(dynamic)
        for name, target in DYNAMIC_TARGETS.items():
            lo, hi = target['density_pct']
            if lo <= pct <= hi:
                return target
    return DYNAMIC_TARGETS['mf']


def verify_section_dynamics(audio: np.ndarray, sr: int,
                            start_time: float, end_time: float,
                            declared_dynamic: str) -> Dict:
    """Verify dynamics for a single section."""
    start_sample = int(start_time * sr)
    end_sample = int(end_time * sr)
    start_sample = max(0, start_sample)
    end_sample = min(len(audio), end_sample)

    if end_sample <= start_sample:
        return {'error': 'Invalid section boundaries'}

    section_audio = audio[start_sample:end_sample]

    rms, rms_times = compute_rms(section_audio)
    lufs = compute_lufs(section_audio, sr)
    crest = compute_crest_factor(section_audio)
    flux, flux_times = compute_spectral_flux(section_audio, sr)

    rms_db = 20 * np.log10(np.maximum(np.mean(rms), 1e-10))

    target = map_dynamic_to_target(declared_dynamic)
    lufs_ok = target['lufs'][0] <= lufs <= target['lufs'][1]
    rms_ok = target['rms_db'][0] <= rms_db <= target['rms_db'][1]

    return {
        'section_start': start_time,
        'section_end': end_time,
        'declared_dynamic': declared_dynamic,
        'measured_lufs': round(lufs, 1),
        'measured_rms_db': round(float(rms_db), 1),
        'crest_factor_db': round(crest, 1),
        'target_lufs_range': target['lufs'],
        'target_rms_range': target['rms_db'],
        'lufs_pass': lufs_ok,
        'rms_pass': rms_ok,
        'overall_pass': lufs_ok and rms_ok,
        'spectral_flux_mean': float(np.mean(flux)) if len(flux) > 0 else 0.0
    }


def generate_dynamic_report(audio_path: str, schema: Dict) -> Dict:
    """Generate complete dynamic profile report."""
    import soundfile as sf

    audio, sr = sf.read(audio_path)
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)

    rms, rms_times = compute_rms(audio)
    lufs_global = compute_lufs(audio, sr)
    crest_global = compute_crest_factor(audio)
    fade_out = detect_fade_out(rms, rms_times)

    section_results = []
    for section in schema.get('sections', []):
        start_time = section.get('start_time', 0)
        end_time = section.get('end_time', 0)
        declared_dynamic = section.get('dynamic', section.get('dynamic_envelope', 'mf'))

        result = verify_section_dynamics(audio, sr, start_time, end_time, declared_dynamic)
        result['section_id'] = section.get('id', '')
        result['section_label'] = section.get('label', '')
        section_results.append(result)

    return {
        'global_lufs': round(lufs_global, 1),
        'global_crest_factor_db': round(crest_global, 1),
        'fade_out': fade_out,
        'sections': section_results,
        'overall_pass': all(s.get('overall_pass', False) for s in section_results)
    }
