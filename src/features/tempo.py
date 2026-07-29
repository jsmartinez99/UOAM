"""
Tempo and beat extraction using madmom and essentia.
"""
import numpy as np
from typing import Tuple, Optional, List
import warnings

# Try imports
try:
    import madmom
    MADMOM_AVAILABLE = True
except ImportError:
    MADMOM_AVAILABLE = False
    warnings.warn("madmom not available")

try:
    import essentia.standard as es
    ESSENTIA_AVAILABLE = True
except ImportError:
    ESSENTIA_AVAILABLE = False
    warnings.warn("essentia not available")


def extract_tempo_madmom(audio: np.ndarray, sr: int) -> Tuple[float, np.ndarray]:
    """
    Extract tempo and beat positions using madmom's DBN beat tracker.
    
    Args:
        audio: Mono audio signal
        sr: Sample rate
        
    Returns:
        beat_times: Array of beat times in seconds
    """
    if not MADMOM_AVAILABLE:
        raise RuntimeError("madmom not available")
    
    # Use madmom's RNN beat processor + DBN beat tracker
    proc = madmom.features.beats.RNNBeatProcessor()
    act = proc(audio)
    tracker = madmom.features.beats.DBNBeatTrackingProcessor(fps=100)
    beats = tracker(act)
    
    return beats


def extract_tempo_essentia(audio: np.ndarray, sr: int) -> Tuple[float, np.ndarray]:
    """
    Extract tempo and beat positions using Essentia.
    
    Args:
        audio: Mono audio signal
        sr: Sample rate
        
    Returns:
        (bpm, beat_times): Tempo in BPM and beat times in seconds
    """
    if not ESSENTIA_AVAILABLE:
        raise RuntimeError("essentia not available")
    
    # Use RhythmExtractor2013 for tempo + beats
    rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
    bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)
    
    return float(bpm), beats


def extract_tempo(audio: np.ndarray, sr: int, method: str = "auto") -> Tuple[float, np.ndarray]:
    """
    Extract tempo and beat grid from audio.
    
    Args:
        audio: Mono audio signal
        sr: Sample rate
        method: "madmom", "essentia", or "auto"
        
    Returns:
        (bpm, beat_times): Tempo in BPM and beat times in seconds
    """
    if method == "auto":
        if MADMOM_AVAILABLE:
            method = "madmom"
        elif ESSENTIA_AVAILABLE:
            method = "essentia"
        else:
            raise RuntimeError("No tempo extraction backend available")
    
    if method == "madmom":
        beats = extract_tempo_madmom(audio, sr)
        # Estimate BPM from beat intervals
        if len(beats) > 1:
            intervals = np.diff(beats)
            median_interval = np.median(intervals)
            bpm = 60.0 / median_interval
        else:
            bpm = 120.0
        return bpm, beats
    
    elif method == "essentia":
        return extract_tempo_essentia(audio, sr)
    
    else:
        raise ValueError(f"Unknown method: {method}")


def extract_downbeats(audio: np.ndarray, sr: int) -> np.ndarray:
    """
    Extract downbeat positions (measure starts) using madmom.
    
    Args:
        audio: Mono audio signal
        sr: Sample rate
        
    Returns:
        downbeat_times: Array of downbeat times in seconds
    """
    if not MADMOM_AVAILABLE:
        raise RuntimeError("madmom not available for downbeat tracking")
    
    proc = madmom.features.downbeats.RNNDownBeatProcessor()
    act = proc(audio)
    tracker = madmom.features.downbeats.DBNDownBeatTrackingProcessor(
        beats_per_bar=[3, 4], fps=100
    )
    downbeats = tracker(act)
    
    # downbeats is (time, beat_number) where beat_number=1 is downbeat
    downbeat_times = downbeats[downbeats[:, 1] == 1, 0]
    
    return downbeat_times


def beats_to_measures(beat_times: np.ndarray, downbeat_times: np.ndarray, 
                      time_signature: str = "4/4") -> np.ndarray:
    """
    Map beat times to measure numbers.
    
    Args:
        beat_times: Array of beat times
        downbeat_times: Array of downbeat times
        time_signature: Time signature string (e.g., "4/4", "3/4")
        
    Returns:
        measure_numbers: Array of measure number for each beat
    """
    beats_per_measure = int(time_signature.split("/")[0])
    measure_numbers = np.zeros(len(beat_times), dtype=int)
    
    for i, beat in enumerate(beat_times):
        # Find the last downbeat before this beat
        prev_downbeats = downbeat_times[downbeat_times <= beat]
        if len(prev_downbeats) > 0:
            measure_numbers[i] = len(prev_downbeats)
        else:
            measure_numbers[i] = 1
    
    return measure_numbers


def measure_to_time(measure: int, tempo_bpm: float, time_signature: str = "4/4",
                    pickup_measures: float = 0) -> float:
    """
    Convert measure number to time in seconds.
    
    Args:
        measure: Measure number (1-indexed)
        tempo_bpm: Tempo in beats per minute
        time_signature: Time signature string
        pickup_measures: Number of pickup measures before measure 1
        
    Returns:
        Time in seconds
    """
    beats_per_measure = int(time_signature.split("/")[0])
    beat_duration = 60.0 / tempo_bpm
    measure_duration = beats_per_measure * beat_duration
    
    return (measure - 1 + pickup_measures) * measure_duration


def time_to_measure(time: float, tempo_bpm: float, time_signature: str = "4/4",
                    pickup_measures: float = 0) -> float:
    """
    Convert time in seconds to measure number (float).
    
    Args:
        time: Time in seconds
        tempo_bpm: Tempo in beats per minute
        time_signature: Time signature string
        pickup_measures: Number of pickup measures before measure 1
        
    Returns:
        Measure number (float, can be fractional)
    """
    beats_per_measure = int(time_signature.split("/")[0])
    beat_duration = 60.0 / tempo_bpm
    measure_duration = beats_per_measure * beat_duration
    
    return time / measure_duration + 1 - pickup_measures