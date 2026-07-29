"""
Section boundary detection and verification.
"""

import numpy as np
from typing import List, Tuple, Dict, Optional
from scipy.signal import find_peaks
from scipy.ndimage import gaussian_filter1d


def compute_novelty_curve(features: Dict, sr: int = 22050, 
                           hop_length: int = 512) -> Tuple[np.ndarray, np.ndarray]:
    """
    Compute novelty curve from multiple features for boundary detection.
    
    Combines:
    - Spectral flux (onset detection)
    - Chroma change (harmonic change)
    - RMS change (dynamic change)
    - Spectral centroid change (timbral change)
    
    Args:
        features: Dictionary with feature arrays
        sr: Sample rate
        hop_length: Hop length used for feature extraction
        
    Returns:
        (novelty_curve, times): Novelty curve and time stamps
    """
    novelty_components = []
    times = None
    
    # Spectral flux (from spectral features)
    if 'spectral' in features and 'flux' in features['spectral']:
        flux = np.array(features['spectral']['flux'])
        if len(flux) > 0:
            # Normalize
            flux_norm = flux / (np.max(flux) + 1e-10)
            novelty_components.append(flux_norm)
            if times is None:
                times = np.array(features['spectral'].get('times', 
                    np.arange(len(flux)) * hop_length / sr))
    
    # Chroma change (from chroma features)
    if 'chroma' in features and 'chroma' in features['chroma']:
        chroma = np.array(features['chroma']['chroma'])
        if chroma.shape[1] > 1:
            # Compute cosine distance between consecutive frames
            chroma_norm = chroma / (np.linalg.norm(chroma, axis=0, keepdims=True) + 1e-10)
            chroma_diff = 1 - np.sum(chroma_norm[:, :-1] * chroma_norm[:, 1:], axis=0)
            chroma_diff = np.pad(chroma_diff, (1, 0), mode='constant')
            chroma_diff_norm = chroma_diff / (np.max(chroma_diff) + 1e-10)
            novelty_components.append(chroma_diff_norm)
            if times is None:
                times = np.array(features['chroma'].get('times',
                    np.arange(len(chroma_diff)) * hop_length / sr))
    
    # RMS change (from loudness features)
    if 'loudness' in features and 'sections' in features['loudness']:
        # We'll compute RMS from spectral centroid as proxy
        pass
    
    # Spectral centroid change
    if 'spectral' in features and 'centroid' in features['spectral']:
        centroid = np.array(features['spectral']['centroid'])
        if len(centroid) > 1:
            centroid_diff = np.abs(np.diff(centroid))
            centroid_diff = np.pad(centroid_diff, (1, 0), mode='constant')
            centroid_diff_norm = centroid_diff / (np.max(centroid_diff) + 1e-10)
            novelty_components.append(centroid_diff_norm)
            if times is None:
                times = np.array(features['spectral'].get('times',
                    np.arange(len(centroid)) * hop_length / sr))
    
    # Combine novelty components
    if not novelty_components:
        # Fallback: create dummy novelty curve
        n_frames = 100
        times = np.linspace(0, 10, n_frames)
        novelty = np.zeros(n_frames)
    else:
        # Ensure all components have same length
        min_len = min(len(c) for c in novelty_components)
        novelty_components = [c[:min_len] for c in novelty_components]
        times = times[:min_len] if times is not None else np.arange(min_len) * hop_length / sr
        
        # Weighted combination
        weights = [0.4, 0.3, 0.3]  # flux, chroma, centroid
        novelty = np.zeros(min_len)
        for i, comp in enumerate(novelty_components):
            w = weights[i] if i < len(weights) else 1.0 / len(novelty_components)
            novelty += w * comp
    
    # Smooth novelty curve
    novelty = gaussian_filter1d(novelty, sigma=2)
    
    return novelty, times


def detect_boundaries(features: Dict, sr: int = 22050,
                       min_distance: float = 4.0,
                       prominence: float = 0.1,
                       hop_length: int = 512) -> np.ndarray:
    """
    Detect section boundaries using novelty curve peak picking.
    
    Args:
        features: Feature dictionary from extract_all_features
        sr: Sample rate
        min_distance: Minimum distance between boundaries in seconds
        prominence: Minimum peak prominence
        hop_length: Hop length for feature extraction
        
    Returns:
        Array of boundary times in seconds
    """
    # Compute novelty curve
    novelty, times = compute_novelty_curve(features, sr, hop_length)
    
    if len(novelty) == 0:
        return np.array([])
    
    # Find peaks in novelty curve
    min_distance_frames = int(min_distance * sr / hop_length)
    
    peaks, properties = find_peaks(
        novelty,
        distance=min_distance_frames,
        prominence=prominence
    )
    
    # Convert peak indices to times
    boundary_times = times[peaks]
    
    # Add start (0) and end (duration) as boundaries
    duration = times[-1] if len(times) > 0 else 0
    all_boundaries = np.concatenate([[0], boundary_times, [duration]])
    
    return np.unique(all_boundaries)


def align_boundaries_to_measures(detected: np.ndarray, 
                                  expected: np.ndarray,
                                  arrangement: Dict,
                                  sr: int) -> List[Dict]:
    """
    Align detected boundaries to nearest measures in arrangement.
    
    Args:
        detected: Detected boundary times
        expected: Expected boundary times from arrangement
        arrangement: Arrangement schema
        sr: Sample rate
        
    Returns:
        List of alignment results
    """
    from src.features.tempo import time_to_measure
    
    sections = arrangement.get('sections', [])
    metadata = arrangement.get('metadata', {})
    global_tempo = metadata.get('global_tempo_bpm', 120)
    time_signature = metadata.get('time_signature', '4/4')
    
    results = []
    
    for det_time in detected:
        # Find closest expected boundary
        if len(expected) > 0:
            idx = np.argmin(np.abs(expected - det_time))
            exp_time = expected[idx]
            deviation_sec = det_time - exp_time
            
            # Convert to measures
            # Use tempo at that section
            section_idx = min(idx, len(sections) - 1)
            section = sections[section_idx]
            tempo = section.get('tempo_bpm', global_tempo)
            ts = section.get('time_signature', time_signature)
            
            det_measure = time_to_measure(det_time, tempo, ts)
            exp_measure = time_to_measure(exp_time, tempo, ts)
            deviation_measures = det_measure - exp_measure
            
            # Classify
            if abs(deviation_measures) <= 0.5:
                status = "match"
            elif deviation_measures < 0:
                status = "early"
            else:
                status = "late"
        else:
            exp_time = None
            deviation_sec = None
            deviation_measures = None
            status = "no_reference"
        
        results.append({
            'detected_time': float(det_time),
            'expected_time': float(exp_time) if exp_time is not None else None,
            'deviation_seconds': float(deviation_sec) if deviation_sec is not None else None,
            'deviation_measures': float(deviation_measures) if deviation_measures is not None else None,
            'status': status
        })
    
    return results


def compute_boundary_f1(detected: np.ndarray, expected: np.ndarray,
                         tolerance_measures: float = 1.0,
                         arrangement: Dict = None,
                         sr: int = 22050) -> Tuple[float, float, float]:
    """
    Compute F1 score for boundary detection.
    
    Args:
        detected: Detected boundary times
        expected: Expected boundary times
        tolerance_measures: Tolerance in measures
        arrangement: Arrangement schema for measure conversion
        sr: Sample rate
        
    Returns:
        (f1, precision, recall)
    """
    from src.features.tempo import time_to_measure
    
    if len(expected) == 0:
        return 0.0, 0.0, 0.0
    
    if len(detected) == 0:
        return 0.0, 0.0, 0.0
    
    # Convert tolerance to seconds using average tempo
    if arrangement:
        metadata = arrangement.get('metadata', {})
        tempo = metadata.get('global_tempo_bpm', 120)
        ts = metadata.get('time_signature', '4/4')
        beats_per_measure = int(ts.split('/')[0])
        measure_duration = beats_per_measure * 60.0 / tempo
        tolerance_sec = tolerance_measures * measure_duration
    else:
        tolerance_sec = 2.0  # Default 2 seconds
    
    # Match detected to expected
    matched_expected = set()
    matched_detected = set()
    
    for i, det in enumerate(detected):
        for j, exp in enumerate(expected):
            if j in matched_expected:
                continue
            if abs(det - exp) <= tolerance_sec:
                matched_expected.add(j)
                matched_detected.add(i)
                break
    
    tp = len(matched_detected)
    fp = len(detected) - tp
    fn = len(expected) - len(matched_expected)
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    
    return f1, precision, recall


def generate_boundary_report(detected: np.ndarray, expected: np.ndarray,
                              arrangement: Dict, sr: int,
                              tolerance_measures: float = 1.0) -> Dict:
    """
    Generate detailed boundary verification report.
    
    Args:
        detected: Detected boundary times
        expected: Expected boundary times
        arrangement: Arrangement schema
        sr: Sample rate
        tolerance_measures: Tolerance in measures
        
    Returns:
        Report dictionary
    """
    # Align boundaries
    alignments = align_boundaries_to_measures(detected, expected, arrangement, sr)
    
    # Compute F1
    f1, precision, recall = compute_boundary_f1(
        detected, expected, tolerance_measures, arrangement, sr
    )
    
    # Per-section analysis
    sections = arrangement.get('sections', [])
    section_results = []
    
    for i, section in enumerate(sections):
        start_measure = section.get('start_measure', 1)
        end_measure = section.get('end_measure', start_measure)
        label = section.get('label', f'Section {i+1}')
        
        # Expected boundary at section start
        exp_time = expected[i] if i < len(expected) else None
        
        # Find detected boundary for this section
        det_match = None
        for align in alignments:
            if align['expected_time'] is not None and abs(align['expected_time'] - exp_time) < 0.1:
                det_match = align
                break
        
        section_results.append({
            'section_id': section.get('id', f'section_{i}'),
            'label': label,
            'start_measure': start_measure,
            'end_measure': end_measure,
            'expected_time': exp_time,
            'detected_time': det_match['detected_time'] if det_match else None,
            'deviation_measures': det_match['deviation_measures'] if det_match else None,
            'status': det_match['status'] if det_match else 'missed'
        })
    
    return {
        'summary': {
            'num_expected': len(expected),
            'num_detected': len(detected),
            'f1_score': f1,
            'precision': precision,
            'recall': recall,
            'tolerance_measures': tolerance_measures
        },
        'alignments': alignments,
        'sections': section_results
    }