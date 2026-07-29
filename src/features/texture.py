"""
Texture features: spectral contrast, flatness, and related measures.
"""

import numpy as np
import librosa
from typing import Tuple, Dict


def spectral_contrast(y: np.ndarray, sr: int,
                       n_fft: int = 2048, hop_length: int = 512,
                       n_bands: int = 6, fmin: float = 200.0) -> np.ndarray:
    """
    Compute spectral contrast.
    
    Spectral contrast measures the difference between peaks and valleys
    in the spectrum. High contrast = harmonic/tonal, low contrast = noisy.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        n_bands: Number of frequency bands
        fmin: Minimum frequency for first band
        
    Returns:
        contrast: Shape (n_bands, n_frames)
    """
    contrast = librosa.feature.spectral_contrast(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length,
        n_bands=n_bands, fmin=fmin
    )
    return contrast


def spectral_flatness(y: np.ndarray, n_fft: int = 2048, 
                       hop_length: int = 512) -> np.ndarray:
    """
    Compute spectral flatness (Wiener entropy).
    
    Flatness = geometric mean / arithmetic mean of power spectrum.
    0 = pure tone, 1 = white noise.
    
    Args:
        y: Audio signal
        n_fft: FFT window size
        hop_length: Hop length
        
    Returns:
        flatness: Per-frame spectral flatness
    """
    flatness = librosa.feature.spectral_flatness(
        y=y, n_fft=n_fft, hop_length=hop_length
    )[0]
    return flatness


def spectral_crest_factor(y: np.ndarray, sr: int,
                           n_fft: int = 2048, hop_length: int = 512) -> np.ndarray:
    """
    Compute spectral crest factor per frame.
    
    Crest factor = peak magnitude / RMS magnitude in spectrum.
    High = tonal, Low = noise-like.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        
    Returns:
        crest: Per-frame spectral crest factor
    """
    stft = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
    magnitude = np.abs(stft)
    
    peak = np.max(magnitude, axis=0)
    rms = np.sqrt(np.mean(magnitude ** 2, axis=0))
    
    with np.errstate(divide='ignore', invalid='ignore'):
        crest = np.where(rms > 0, peak / rms, 0)
    
    return crest


def spectral_entropy(y: np.ndarray, sr: int,
                      n_fft: int = 2048, hop_length: int = 512,
                      n_bins: int = 128) -> np.ndarray:
    """
    Compute spectral entropy per frame.
    
    Measures the "flatness" of the power spectrum distribution.
    High entropy = noise-like, Low entropy = tonal.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        n_bins: Number of frequency bins to use
        
    Returns:
        entropy: Per-frame spectral entropy (normalized 0-1)
    """
    stft = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
    power = np.abs(stft) ** 2
    
    # Normalize to probability distribution per frame
    power_sum = np.sum(power, axis=0, keepdims=True)
    with np.errstate(divide='ignore', invalid='ignore'):
        prob = np.where(power_sum > 0, power / power_sum, 0)
    
    # Compute entropy
    with np.errstate(divide='ignore', invalid='ignore'):
        entropy = -np.sum(prob * np.log2(prob + 1e-10), axis=0)
    
    # Normalize by max entropy (log2(n_bins))
    max_entropy = np.log2(min(n_bins, power.shape[0]))
    entropy = entropy / max_entropy
    
    return entropy


def spectral_kurtosis(y: np.ndarray, sr: int,
                       n_fft: int = 2048, hop_length: int = 512) -> np.ndarray:
    """
    Compute spectral kurtosis per frame.
    
    Measures "peakedness" of spectrum. High = tonal with distinct peaks.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        
    Returns:
        kurtosis: Per-frame spectral kurtosis
    """
    stft = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
    magnitude = np.abs(stft)
    
    mean = np.mean(magnitude, axis=0)
    std = np.std(magnitude, axis=0)
    
    with np.errstate(divide='ignore', invalid='ignore'):
        kurt = np.where(std > 0, 
                        np.mean(((magnitude - mean) / std) ** 4, axis=0) - 3,
                        0)
    
    return kurt


def spectral_skewness(y: np.ndarray, sr: int,
                       n_fft: int = 2048, hop_length: int = 512) -> np.ndarray:
    """
    Compute spectral skewness per frame.
    
    Measures asymmetry of spectrum around mean.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        
    Returns:
        skewness: Per-frame spectral skewness
    """
    stft = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
    magnitude = np.abs(stft)
    
    mean = np.mean(magnitude, axis=0)
    std = np.std(magnitude, axis=0)
    
    with np.errstate(divide='ignore', invalid='ignore'):
        skew = np.where(std > 0,
                        np.mean(((magnitude - mean) / std) ** 3, axis=0),
                        0)
    
    return skew


def harmonic_percussive_separation(y: np.ndarray, sr: int,
                                    margin: float = 3.0) -> Tuple[np.ndarray, np.ndarray]:
    """
    Separate harmonic and percussive components using HPSS.
    
    Args:
        y: Audio signal
        sr: Sample rate
        margin: Margin for separation
        
    Returns:
        (harmonic, percussive): Separated signals
    """
    harmonic, percussive = librosa.effects.hpss(y, margin=margin)
    return harmonic, percussive


def compute_harmonic_ratio(y: np.ndarray, sr: int) -> float:
    """
    Compute overall harmonic-to-percussive ratio.
    
    Args:
        y: Audio signal
        sr: Sample rate
        
    Returns:
        ratio: Harmonic energy / total energy
    """
    harmonic, percussive = harmonic_percussive_separation(y, sr)
    harmonic_energy = np.sum(harmonic ** 2)
    total_energy = np.sum(y ** 2)
    
    if total_energy > 0:
        return harmonic_energy / total_energy
    return 0.0


def extract_texture_features(y: np.ndarray, sr: int,
                              n_fft: int = 2048, hop_length: int = 512) -> Dict:
    """
    Extract all texture features.
    
    Args:
        y: Audio signal
        sr: Sample rate
        n_fft: FFT window size
        hop_length: Hop length
        
    Returns:
        Dictionary with all texture features
    """
    contrast = spectral_contrast(y, sr, n_fft, hop_length)
    flatness = spectral_flatness(y, n_fft, hop_length)
    crest = spectral_crest_factor(y, sr, n_fft, hop_length)
    entropy = spectral_entropy(y, sr, n_fft, hop_length)
    kurtosis = spectral_kurtosis(y, sr, n_fft, hop_length)
    skewness = spectral_skewness(y, sr, n_fft, hop_length)
    harmonic_ratio = compute_harmonic_ratio(y, sr)
    
    times = librosa.frames_to_time(np.arange(len(flatness)), sr=sr, hop_length=hop_length)
    
    return {
        'contrast': contrast,
        'flatness': flatness,
        'crest_factor': crest,
        'entropy': entropy,
        'kurtosis': kurtosis,
        'skewness': skewness,
        'harmonic_ratio': harmonic_ratio,
        'times': times
    }


def compute_section_texture(features: Dict, section_times: list) -> Dict:
    """
    Compute aggregate texture features per section.
    
    Args:
        features: Dictionary from extract_texture_features
        section_times: List of (start_time, end_time) tuples
        
    Returns:
        Per-section texture statistics
    """
    times = features['times']
    results = {}
    
    for i, (start, end) in enumerate(section_times):
        mask = (times >= start) & (times < end)
        if not np.any(mask):
            continue
        
        section_data = {}
        for key in ['flatness', 'crest_factor', 'entropy', 'kurtosis', 'skewness']:
            if key in features:
                vals = features[key][mask]
                section_data[key] = {
                    'mean': float(np.mean(vals)),
                    'std': float(np.std(vals)),
                    'median': float(np.median(vals))
                }
        
        # Contrast is 2D
        if 'contrast' in features:
            contrast_vals = features['contrast'][:, mask]
            section_data['contrast'] = {
                'mean_per_band': np.mean(contrast_vals, axis=1).tolist(),
                'overall_mean': float(np.mean(contrast_vals))
            }
        
        if 'harmonic_ratio' in features:
            section_data['harmonic_ratio'] = features['harmonic_ratio']
        
        results[f'section_{i}'] = section_data
    
    return results