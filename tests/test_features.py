#!/usr/bin/env python3
"""
Unit tests for audio feature extraction modules.
Tests each feature extractor against known test signals.
"""

import unittest
import numpy as np
import warnings
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

# Suppress warnings
warnings.filterwarnings("ignore")


class TestTempoExtraction(unittest.TestCase):
    """Test tempo and beat extraction."""
    
    def setUp(self):
        self.sr = 44100
        # Generate click track at 120 BPM
        duration = 10.0
        t = np.arange(int(duration * self.sr)) / self.sr
        beat_interval = 60.0 / 120.0  # 0.5 seconds
        clicks = np.zeros_like(t)
        click_times = np.arange(0, duration, beat_interval)
        for ct in click_times:
            idx = int(ct * self.sr)
            if idx < len(clicks):
                clicks[idx] = 1.0
        self.click_track = clicks
        
        # Generate sine wave at 440 Hz
        self.sine_wave = np.sin(2 * np.pi * 440 * t)
    
    def test_measure_to_time(self):
        from src.features.tempo import measure_to_time
        # 4/4 at 120 BPM: measure 1 = 0s, measure 2 = 2s, measure 5 = 8s
        self.assertAlmostEqual(measure_to_time(1, 120, "4/4"), 0.0, places=2)
        self.assertAlmostEqual(measure_to_time(2, 120, "4/4"), 2.0, places=2)
        self.assertAlmostEqual(measure_to_time(5, 120, "4/4"), 8.0, places=2)
        
        # 3/4 at 120 BPM: measure 1 = 0s, measure 2 = 1.5s
        self.assertAlmostEqual(measure_to_time(1, 120, "3/4"), 0.0, places=2)
        self.assertAlmostEqual(measure_to_time(2, 120, "3/4"), 1.5, places=2)
    
    def test_time_to_measure(self):
        from src.features.tempo import time_to_measure
        # 4/4 at 120 BPM
        self.assertAlmostEqual(time_to_measure(0.0, 120, "4/4"), 1.0, places=2)
        self.assertAlmostEqual(time_to_measure(2.0, 120, "4/4"), 2.0, places=2)
        self.assertAlmostEqual(time_to_measure(1.0, 120, "4/4"), 1.5, places=2)


class TestSpectralFeatures(unittest.TestCase):
    """Test spectral feature extraction."""
    
    def setUp(self):
        self.sr = 22050
        duration = 2.0
        self.t = np.arange(int(duration * self.sr)) / self.sr
        
        # Sine wave (tonal)
        self.sine = np.sin(2 * np.pi * 440 * self.t)
        
        # White noise
        self.noise = np.random.randn(len(self.t)) * 0.1
        
        # Chirp (frequency sweep)
        self.chirp = np.sin(2 * np.pi * (200 + 4000 * self.t / duration) * self.t)
    
    def test_spectral_centroid(self):
        from src.features.spectral import spectral_centroid_librosa
        
        # Sine wave at 440 Hz should have centroid near 440 Hz
        centroid = spectral_centroid_librosa(self.sine, self.sr)
        self.assertGreater(np.mean(centroid), 400)
        self.assertLess(np.mean(centroid), 500)
        
        # Noise should have higher centroid
        noise_centroid = spectral_centroid_librosa(self.noise, self.sr)
        self.assertGreater(np.mean(noise_centroid), np.mean(centroid))
    
    def test_spectral_bandwidth(self):
        from src.features.spectral import spectral_bandwidth_librosa
        
        # Sine wave should have very narrow bandwidth
        bw = spectral_bandwidth_librosa(self.sine, self.sr)
        self.assertLess(np.mean(bw), 100)
        
        # Noise should have wider bandwidth than a pure sine wave
        noise_bw = spectral_bandwidth_librosa(self.noise, self.sr)
        self.assertGreater(np.mean(noise_bw), np.mean(bw) * 5)
    
    def test_spectral_flatness(self):
        from src.features.spectral import spectral_flatness_librosa
        
        # Sine wave should have low flatness (tonal)
        flatness = spectral_flatness_librosa(self.sine, self.sr)
        self.assertLess(np.mean(flatness), 0.1)
        
        # Noise should have high flatness
        noise_flatness = spectral_flatness_librosa(self.noise, self.sr)
        self.assertGreater(np.mean(noise_flatness), 0.5)
    
    def test_spectral_contrast(self):
        from src.features.spectral import spectral_contrast_librosa
        
        # Rich tonal signal (fundamental + harmonics) should have high contrast
        rich = np.sin(2 * np.pi * 440 * self.t) + 0.5 * np.sin(2 * np.pi * 880 * self.t) + 0.3 * np.sin(2 * np.pi * 1320 * self.t)
        contrast = spectral_contrast_librosa(rich, self.sr)
        self.assertGreater(np.mean(contrast), 20)
        
        # Noise should have lower contrast than a rich tonal signal
        noise_contrast = spectral_contrast_librosa(self.noise, self.sr)
        self.assertLess(np.mean(noise_contrast), np.mean(contrast))


class TestLoudnessFeatures(unittest.TestCase):
    """Test loudness (RMS, LUFS) computation."""
    
    def setUp(self):
        self.sr = 44100
        duration = 5.0
        t = np.arange(int(duration * self.sr)) / self.sr
        
        # Constant amplitude sine wave
        self.sine = 0.5 * np.sin(2 * np.pi * 440 * t)
        
        # Crescendo (amplitude ramp)
        self.crescendo = np.sin(2 * np.pi * 440 * t) * np.linspace(0.1, 1.0, len(t))
        
        # Silence
        self.silence = np.zeros_like(t)
    
    def test_rms_computation(self):
        from src.features.loudness import compute_rms, rms_to_dbfs
        
        # RMS of 0.5 amplitude sine should be ~0.354 (0.5/sqrt(2))
        rms = compute_rms(self.sine)
        expected_rms = 0.5 / np.sqrt(2)
        self.assertAlmostEqual(np.mean(rms), expected_rms, places=2)
        
        # Convert to dBFS
        dbfs = rms_to_dbfs(rms)
        expected_dbfs = 20 * np.log10(expected_rms)
        self.assertAlmostEqual(np.mean(dbfs), expected_dbfs, places=1)
    
    def test_crescendo_detection(self):
        from src.features.loudness import compute_lufs_short_term
        
        # Short-term LUFS should increase over time
        lufs = compute_lufs_short_term(self.crescendo, self.sr, window_duration=1.0)
        self.assertLess(lufs[0], lufs[-1])  # Should increase
    
    def test_dynamics_mapping(self):
        from src.features.loudness import map_dynamics_to_lufs
        
        # Test standard dynamics
        target, tol = map_dynamics_to_lufs('f')
        self.assertEqual(target, -18)
        self.assertEqual(tol, 3)
        
        target, tol = map_dynamics_to_lufs('pp')
        self.assertEqual(target, -36)
        
        # Test percentage
        target, tol = map_dynamics_to_lufs('mf', 50)
        self.assertAlmostEqual(target, -21, delta=5)


class TestTextureFeatures(unittest.TestCase):
    """Test texture feature extraction."""
    
    def setUp(self):
        self.sr = 22050
        duration = 2.0
        t = np.arange(int(duration * self.sr)) / self.sr
        
        self.sine = np.sin(2 * np.pi * 440 * t)
        self.noise = np.random.randn(len(t)) * 0.1
    
    def test_spectral_flatness(self):
        from src.features.texture import spectral_flatness
        
        flatness = spectral_flatness(self.sine)
        self.assertLess(np.mean(flatness), 0.1)
        
        noise_flatness = spectral_flatness(self.noise)
        self.assertGreater(np.mean(noise_flatness), 0.5)
    
    def test_harmonic_ratio(self):
        from src.features.texture import compute_harmonic_ratio
        
        # Sine wave should be mostly harmonic
        ratio = compute_harmonic_ratio(self.sine, self.sr)
        self.assertGreater(ratio, 0.5)
        
        # Noise should be less harmonic
        noise_ratio = compute_harmonic_ratio(self.noise, self.sr)
        self.assertLess(noise_ratio, 0.5)


class TestChromaFeatures(unittest.TestCase):
    """Test chroma feature extraction and key estimation."""
    
    def setUp(self):
        self.sr = 22050
        duration = 5.0
        t = np.arange(int(duration * self.sr)) / self.sr
        
        # C major scale
        c_major_notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]
        self.c_major = np.zeros_like(t)
        for i, freq in enumerate(c_major_notes):
            start = i * len(t) // len(c_major_notes)
            end = (i + 1) * len(t) // len(c_major_notes)
            self.c_major[start:end] = np.sin(2 * np.pi * freq * t[start:end])
    
    def test_chroma_extraction(self):
        from src.features.chroma import chroma_cqt, chroma_stft
        
        # Both methods should produce 12-bin chroma
        chroma_cqt_result = chroma_cqt(self.c_major, self.sr)
        self.assertEqual(chroma_cqt_result.shape[0], 12)
        
        chroma_stft_result = chroma_stft(self.c_major, self.sr)
        self.assertEqual(chroma_stft_result.shape[0], 12)
    
    def test_key_estimation(self):
        from src.features.chroma import chroma_cqt, estimate_key_from_chroma
        
        chroma = chroma_cqt(self.c_major, self.sr)
        key, mode, confidence = estimate_key_from_chroma(chroma)
        
        # Should detect C major
        self.assertEqual(key, 'C')
        self.assertEqual(mode, 'major')
        self.assertGreater(confidence, 0.3)


class TestIntegration(unittest.TestCase):
    """Integration tests for full feature extraction pipeline."""
    
    def test_extract_features_cli(self):
        """Test that the CLI script can be imported without errors."""
        import scripts.extract_features as ef
        self.assertTrue(hasattr(ef, 'main'))
        self.assertTrue(hasattr(ef, 'extract_all_features'))
        self.assertTrue(hasattr(ef, 'load_audio'))
        self.assertTrue(hasattr(ef, 'load_arrangement'))


def generate_test_signals():
    """Generate test signals for manual verification."""
    sr = 44100
    duration = 10.0
    t = np.arange(int(duration * sr)) / sr
    
    signals = {}
    
    # 120 BPM click track
    clicks = np.zeros_like(t)
    for i in range(int(duration * 2)):  # 2 clicks per second = 120 BPM
        idx = int(i * 0.5 * sr)
        if idx < len(clicks):
            clicks[idx] = 1.0
    signals['click_120bpm'] = clicks
    
    # Sine wave 440 Hz
    signals['sine_440'] = np.sin(2 * np.pi * 440 * t)
    
    # White noise
    signals['white_noise'] = np.random.randn(len(t)) * 0.1
    
    # Chirp 200-8000 Hz
    signals['chirp'] = np.sin(2 * np.pi * (200 + 7800 * t / duration) * t)
    
    # C major chord
    c_major = (np.sin(2 * np.pi * 261.63 * t) + 
               np.sin(2 * np.pi * 329.63 * t) + 
               np.sin(2 * np.pi * 392.00 * t)) / 3
    signals['c_major_chord'] = c_major
    
    return signals, sr


if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)