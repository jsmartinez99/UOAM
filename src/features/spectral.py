"""
Spectral feature extraction: centroid, bandwidth, contrast, flatness.
"""

import numpy as np
import librosa
from typing import Tuple, Optional

try:
    import essentia.standard as es
    ESSENTIA_AVAILABLE = True
except ImportError:
    ESSENTIA_AVAILABLE = False


def spectral_centroid_librosa(y: np.ndarray, sr: int, 
                               n_fft: int = 2048, hop_length: int = 512) -> np.ndarray:
    """
    Compute spectral centroid using librosa.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        
    Returns:
        centroid: Spectral centroid per frame (Hz)
    """
    centroid = librosa.feature.spectral_centroid(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length
    )[0]
    return centroid


def spectral_bandwidth_librosa(y: np.ndarray, sr: int,
                                n_fft: int = 2048, hop_length: int = 512,
                                p: float = 2.0) -> np.ndarray:
    """
    Compute spectral bandwidth using librosa.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        p: Power for bandwidth calculation (2 = RMS, 1 = mean)
        
    Returns:
        bandwidth: Spectral bandwidth per frame (Hz)
    """
    bandwidth = librosa.feature.spectral_bandwidth(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, p=p
    )[0]
    return bandwidth


def spectral_contrast_librosa(y: np.ndarray, sr: int,
                               n_fft: int = 2048, hop_length: int = 512,
                               n_bands: int = 6) -> np.ndarray:
    """
    Compute spectral contrast using librosa.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        n_bands: Number of frequency bands
        
    Returns:
        contrast: Spectral contrast per band per frame (n_bands, n_frames)
    """
    contrast = librosa.feature.spectral_contrast(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_bands=n_bands
    )
    return contrast


def spectral_flatness_librosa(y: np.ndarray, sr: int,
                               n_fft: int = 2048, hop_length: int = 512) -> np.ndarray:
    """
    Compute spectral flatness using librosa.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        
    Returns:
        flatness: Spectral flatness per frame
    """
    flatness = librosa.feature.spectral_flatness(
        y=y, n_fft=n_fft, hop_length=hop_length
    )[0]
    return flatness


def spectral_rolloff_librosa(y: np.ndarray, sr: int,
                              n_fft: int = 2048, hop_length: int = 512,
                              roll_percent: float = 0.85) -> np.ndarray:
    """
    Compute spectral rolloff using librosa.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        roll_percent: Rolloff percentile
        
    Returns:
        rolloff: Spectral rolloff frequency per frame
    """
    rolloff = librosa.feature.spectral_rolloff(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, roll_percent=roll_percent
    )[0]
    return rolloff


def spectral_flux_librosa(y: np.ndarray, sr: int,
                           n_fft: int = 2048, hop_length: int = 512) -> np.ndarray:
    """
    Compute spectral flux (novelty curve) using librosa.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        
    Returns:
        flux: Spectral flux per frame
    """
    # Compute STFT
    stft = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
    magnitude = np.abs(stft)
    
    # Spectral flux = L2 norm of difference between consecutive frames
    flux = np.sqrt(np.sum(np.diff(magnitude, axis=1) ** 2, axis=0))
    # Pad to match frame count
    flux = np.pad(flux, (1, 0), mode='constant')
    
    return flux


def spectral_centroid_essentia(audio: np.ndarray, sr: int,
                                frame_size: int = 2048, hop_size: int = 512) -> np.ndarray:
    """Compute spectral centroid using Essentia."""
    if not ESSENTIA_AVAILABLE:
        raise RuntimeError("essentia not available")
    
    centroid = es.Centroid()
    windowing = es.Windowing(type='hann')
    spectrum = es.Spectrum()
    
    centroids = []
    for frame in es.FrameGenerator(audio, frameSize=frame_size, hopSize=hop_size):
        spec = spectrum(windowing(frame))
        centroids.append(centroid(spec))
    
    return np.array(centroids)


def extract_spectral_features(y: np.ndarray, sr: int,
                               n_fft: int = 2048, hop_length: int = 512,
                               backend: str = "librosa") -> dict:
    """
    Extract all spectral features.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        backend: "librosa" or "essentia"
        
    Returns:
        Dictionary with all spectral features
    """
    if backend == "librosa":
        centroid = spectral_centroid_librosa(y, sr, n_fft, hop_length)
        bandwidth = spectral_bandwidth_librosa(y, sr, n_fft, hop_length)
        contrast = spectral_contrast_librosa(y, sr, n_fft, hop_length)
        flatness = spectral_flatness_librosa(y, sr, n_fft, hop_length)
        rolloff = spectral_rolloff_librosa(y, sr, n_fft, hop_length)
        flux = spectral_flux_librosa(y, sr, n_fft, hop_length)
    elif backend == "essentia" and ESSENTIA_AVAILABLE:
        # Use Essentia implementations
        centroid = spectral_centroid_essentia(y, sr, n_fft, hop_length)
        # For others, fall back to librosa
        bandwidth = spectral_bandwidth_librosa(y, sr, n_fft, hop_length)
        contrast = spectral_contrast_librosa(y, sr, n_fft, hop_length)
        flatness = spectral_flatness_librosa(y, sr, n_fft, hop_length)
        rolloff = spectral_rolloff_librosa(y, sr, n_fft, hop_length)
        flux = spectral_flux_librosa(y, sr, n_fft, hop_length)
    else:
        raise ValueError(f"Unknown backend: {backend}")
    
    return {
        'centroid': centroid,
        'bandwidth': bandwidth,
        'contrast': contrast,
        'flatness': flatness,
        'rolloff': rolloff,
        'flux': flux,
        'times': librosa.frames_to_time(np.arange(len(centroid)), sr=sr, hop_length=hop_length)
    }


def compute_section_features(features: dict, section_times: list,
                              sr: int, hop_length: int = 512) -> dict:
    """
    Compute aggregate spectral features per section.
    
    Args:
        features: Dictionary from extract_spectral_features
        section_times: List of (start_time, end_time) tuples
        sr: Sample rate
        hop_length: Hop length
        
    Returns:
        Dictionary with per-section statistics
    """
    times = features['times']
    results = {}
    
    for i, (start, end) in enumerate(section_times):
        mask = (times >= start) & (times < end)
        if not np.any(mask):
            continue
            
        section_data = {}
        for key in ['centroid', 'bandwidth', 'flatness', 'rolloff', 'flux']:
            if key in features:
                vals = features[key][mask]
                section_data[key] = {
                    'mean': float(np.mean(vals)),
                    'std': float(np.std(vals)),
                    'min': float(np.min(vals)),
                    'max': float(np.max(vals)),
                    'median': float(np.median(vals))
                }
        
        # Contrast is 2D (bands x frames)
        if 'contrast' in features:
            contrast_vals = features['contrast'][:, mask]
            section_data['contrast'] = {
                'mean_per_band': np.mean(contrast_vals, axis=1).tolist(),
                'std_per_band': np.std(contrast_vals, axis=1).tolist(),
                'overall_mean': float(np.mean(contrast_vals))
            }
        
        results[f'section_{i}'] = section_data
    
    return results