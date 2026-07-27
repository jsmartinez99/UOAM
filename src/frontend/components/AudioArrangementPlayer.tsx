import React, { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, LinearProgress, Stack, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { ArrangementSection } from './ArrangementTimeline';

export interface AudioArrangementPlayerProps {
  sections: ArrangementSection[];
  tempoBpm?: number;
  keyCenter?: string;
  timeSignature?: string;
}

type Waveform = OscillatorType;

interface InstrumentVoice {
  name: string;
  waveform: Waveform;
  detune: number;
  harmonicMix: number;
  filterFreq: number;
  filterQ: number;
  attackGain: number;
}

const INSTRUMENT_VOICES: Record<string, InstrumentVoice> = {
  'Orquesta de Conservatorio Francés (Divis a 8 Partes Reales)': {
    name: 'orchestra', waveform: 'sawtooth', detune: 0, harmonicMix: 0.35,
    filterFreq: 2200, filterQ: 0.7, attackGain: 0.18,
  },
  'Moderne Parodas (Oboe, Clarinete, Fagot)': {
    name: 'woodwinds', waveform: 'triangle', detune: 0, harmonicMix: 0.5,
    filterFreq: 1800, filterQ: 1.0, attackGain: 0.2,
  },
  'Acordeón (Instrumento Folclórico)': {
    name: 'accordion', waveform: 'sawtooth', detune: -7, harmonicMix: 0.4,
    filterFreq: 2600, filterQ: 0.8, attackGain: 0.22,
  },
  'Celesta, Glokenspiel y Arpa': {
    name: 'harp', waveform: 'sine', detune: 0, harmonicMix: 0.1,
    filterFreq: 4500, filterQ: 0.5, attackGain: 0.12,
  },
  default: {
    name: 'default', waveform: 'sine', detune: 0, harmonicMix: 0.2,
    filterFreq: 3000, filterQ: 0.6, attackGain: 0.18,
  },
};

const DYNAMIC_GAIN: Record<string, number> = {
  ppp: 0.05, pp: 0.10, p: 0.18, mf: 0.32, f: 0.55, ff: 0.80,
};

const DYNAMIC_FILTER_MULT: Record<string, number> = {
  ppp: 0.5, pp: 0.6, p: 0.75, mf: 1.0, f: 1.3, ff: 1.6,
};

const PITCH_CLASSES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

const NOTE_REGEX = /^([A-G][#b]?)(-?\d)$/;

const midiToFreq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

const noteToMidi = (note: string, octave: number): number => {
  const pc = PITCH_CLASSES[note];
  if (pc === undefined) return 60;
  return (octave + 1) * 12 + pc;
};

const parseKeyCenter = (key: string | undefined): { tonic: string; mode: 'major' | 'minor' } => {
  if (!key) return { tonic: 'C', mode: 'major' };
  const m = key.match(/^([A-G][#b]?)\s*(major|minor|m|M)?/i);
  if (!m) return { tonic: 'C', mode: 'major' };
  const modeRaw = (m[2] || 'major').toLowerCase();
  return { tonic: m[1], mode: modeRaw === 'm' || modeRaw === 'minor' ? 'minor' : 'major' };
};

const SCALE_INTERVALS: Record<'major' | 'minor', number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const buildScaleForKey = (key: string | undefined): number[] => {
  const { tonic, mode } = parseKeyCenter(key);
  const tonicMidi = noteToMidi(tonic, 4);
  const intervals = SCALE_INTERVALS[mode];
  return intervals.map((iv) => tonicMidi + iv);
};

const HARMONIC_FIELD: Record<'major' | 'minor', number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
};

const buildChordTones = (scaleMidis: number[], mode: 'major' | 'minor', degree: number): number[] => {
  const root = scaleMidis[degree % scaleMidis.length];
  const field = HARMONIC_FIELD[mode];
  return field.map((iv) => root + iv);
};

const pickInstrumentVoice = (instruments: string[]): InstrumentVoice => {
  for (const inst of instruments) {
    if (INSTRUMENT_VOICES[inst]) return INSTRUMENT_VOICES[inst];
  }
  return INSTRUMENT_VOICES.default;
};

const buildImpulseResponse = (ctx: BaseAudioContext, durationSec: number, decay: number): AudioBuffer => {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSec;
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
};

const parseTimeSignature = (ts: string | undefined): { beats: number; beatValue: number } => {
  if (!ts) return { beats: 4, beatValue: 4 };
  const m = ts.match(/^(\d+)\/(\d+)$/);
  if (!m) return { beats: 4, beatValue: 4 };
  return { beats: parseInt(m[1], 10), beatValue: parseInt(m[2], 10) };
};

const countBars = (start: number, end: number): number => Math.max(1, end - start + 1);

interface NoteEvent {
  midi: number;
  startSec: number;
  durationSec: number;
  velocity: number;
  voice: InstrumentVoice;
  filterCutoff: number;
}

const buildSectionScore = (
  section: ArrangementSection,
  tempoBpm: number,
  timeSig: { beats: number; beatValue: number },
  scaleMidis: number[],
  mode: 'major' | 'minor',
): { events: NoteEvent[]; sectionDurationSec: number } => {
  const beatsPerBar = timeSig.beats;
  const secondsPerBeat = 60 / tempoBpm;
  const secondsPerBar = secondsPerBeat * beatsPerBar;
  const bars = countBars(section.bars.start, section.bars.end);
  const sectionDurationSec = bars * secondsPerBar;

  const voice = pickInstrumentVoice(section.activeInstruments);
  const baseVelocity = DYNAMIC_GAIN[section.dynamicEnvelope] ?? 0.3;
  const filterMult = DYNAMIC_FILTER_MULT[section.dynamicEnvelope] ?? 1.0;
  const filterCutoff = Math.min(8000, voice.filterFreq * filterMult);

  const events: NoteEvent[] = [];
  const isClimax = section.name === 'Climax';
  const harmonicDensity = Math.max(1, Math.floor(section.densityCap / 25));

  let t = 0;
  let barIndex = 0;
  while (t < sectionDurationSec) {
    const beatInBar = barIndex % beatsPerBar;
    const noteDurations: number[] = isClimax
      ? [secondsPerBeat * 0.5, secondsPerBeat * 0.25]
      : [secondsPerBeat, secondsPerBeat * 0.5, secondsPerBeat * 0.5];

    const dur = noteDurations[beatInBar % noteDurations.length];

    const chordTones = buildChordTones(scaleMidis, mode, barIndex % scaleMidis.length);
    const voiceCount = Math.min(harmonicDensity, chordTones.length);
    for (let v = 0; v < voiceCount; v++) {
      let midi = chordTones[v];
      if (v === 0 && barIndex % 4 === 3) {
        midi = chordTones[0] + 12;
      }
      if (v === 1 && section.counterpointMotion === 'contrary') {
        midi = chordTones[0] - 4;
      } else if (v === 1 && section.counterpointMotion === 'parallel') {
        midi = chordTones[1] + 12;
      }
      events.push({
        midi,
        startSec: t,
        durationSec: Math.min(dur, sectionDurationSec - t),
        velocity: baseVelocity * (v === 0 ? 1.0 : 0.7),
        voice,
        filterCutoff,
      });
    }

    t += dur;
    barIndex++;
  }

  return { events, sectionDurationSec };
};

interface ScheduledNode {
  osc: OscillatorNode;
  osc2?: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
}

const scheduleNote = (
  ctx: AudioContext,
  masterBus: AudioNode,
  startTime: number,
  event: NoteEvent,
): ScheduledNode => {
  const { midi, durationSec, velocity, voice, filterCutoff } = event;
  const freq = midiToFreq(midi);

  const osc = ctx.createOscillator();
  osc.type = voice.waveform;
  osc.frequency.setValueAtTime(freq, startTime);
  osc.detune.setValueAtTime(voice.detune, startTime);

  let osc2: OscillatorNode | undefined;
  if (voice.harmonicMix > 0 && voice.waveform !== 'sine') {
    osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    osc2.detune.setValueAtTime(-voice.detune, startTime);
  }

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.max(200, filterCutoff), startTime);
  filter.Q.setValueAtTime(voice.filterQ, startTime);

  const gain = ctx.createGain();
  const attackTime = 0.03;
  const decayTime = 0.1;
  const sustainLevel = velocity * 0.7;
  const releaseTime = Math.min(0.25, durationSec * 0.4);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(velocity, startTime + attackTime);
  gain.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime);
  gain.gain.setValueAtTime(sustainLevel, startTime + durationSec);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + releaseTime);

  osc.connect(filter);
  if (osc2) {
    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(voice.harmonicMix, startTime);
    osc2.connect(harmonicGain);
    harmonicGain.connect(filter);
  }
  filter.connect(gain);
  gain.connect(masterBus);

  osc.start(startTime);
  osc.stop(startTime + durationSec + releaseTime + 0.05);
  if (osc2) {
    osc2.start(startTime);
    osc2.stop(startTime + durationSec + releaseTime + 0.05);
  }

  return { osc, osc2, gain, filter };
};

export default function AudioArrangementPlayer({
  sections,
  tempoBpm = 78,
  keyCenter,
  timeSignature,
}: AudioArrangementPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterBusRef = useRef<GainNode | null>(null);
  const reverbBusRef = useRef<ConvolverNode | null>(null);
  const scheduledNodesRef = useRef<ScheduledNode[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const sectionBoundariesRef = useRef<{ start: number; end: number; name: string }[]>([]);
  const totalDurationRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startPlayback = () => {
    if (isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterBus = ctx.createGain();
      masterBus.gain.setValueAtTime(0.85, ctx.currentTime);
      masterBus.connect(ctx.destination);
      masterBusRef.current = masterBus;

      const reverb = ctx.createConvolver();
      reverb.buffer = buildImpulseResponse(ctx, 1.8, 2.2);
      const reverbGain = ctx.createGain();
      reverbGain.gain.setValueAtTime(0.22, ctx.currentTime);
      reverb.connect(reverbGain);
      reverbGain.connect(masterBus);
      reverbBusRef.current = reverb;

      const timeSig = parseTimeSignature(timeSignature);
      const scaleMidis = buildScaleForKey(keyCenter);
      const { mode } = parseKeyCenter(keyCenter);

      let globalStart = ctx.currentTime + 0.15;
      const boundaries: { start: number; end: number; name: string }[] = [];
      let totalDuration = 0;

      sections.forEach((section) => {
        const { events, sectionDurationSec } = buildSectionScore(
          section,
          tempoBpm,
          timeSig,
          scaleMidis,
          mode,
        );
        const sectionStart = globalStart;
        events.forEach((event) => {
          const note = scheduleNote(ctx, masterBus, sectionStart + event.startSec, event);
          const wetNote = scheduleNote(ctx, reverb, sectionStart + event.startSec, event);
          scheduledNodesRef.current.push(note, wetNote);
        });
        boundaries.push({
          start: sectionStart,
          end: sectionStart + sectionDurationSec,
          name: section.name,
        });
        totalDuration += sectionDurationSec;
        globalStart += sectionDurationSec;
      });

      totalDurationRef.current = totalDuration;
      sectionBoundariesRef.current = boundaries;
      playStartTimeRef.current = ctx.currentTime;
      setIsPlaying(true);
      setActiveSectionIndex(0);
      setProgress(0);

      const tick = () => {
        if (!audioCtxRef.current) return;
        const elapsed = audioCtxRef.current.currentTime - (playStartTimeRef.current + 0.15);
        if (elapsed >= totalDuration) {
          stopPlayback();
          return;
        }
        const pct = Math.min(100, (elapsed / totalDuration) * 100);
        setProgress(pct);
        const idx = boundaries.findIndex((b) => elapsed >= (b.start - playStartTimeRef.current - 0.15) && elapsed < (b.end - playStartTimeRef.current - 0.15));
        if (idx >= 0) setActiveSectionIndex(idx);
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      animationFrameRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.error('AudioContext start error', e);
    }
  };

  const stopPlayback = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    scheduledNodesRef.current.forEach(({ osc, osc2 }) => {
      try { osc.stop(); } catch {}
      try { osc2?.stop(); } catch {}
    });
    scheduledNodesRef.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    masterBusRef.current = null;
    reverbBusRef.current = null;
    setIsPlaying(false);
    setActiveSectionIndex(-1);
    setProgress(0);
  };

  return (
    <Card sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(197, 160, 89, 0.3)', mt: 3, mb: 3 }}>
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <VolumeUpIcon sx={{ color: '#c5a059', fontSize: 28 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Previsualización Sonora en Tiempo Real
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Síntesis aditiva con ADSR · {keyCenter ?? 'C major'} · {tempoBpm} BPM · {timeSignature ?? '4/4'}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {activeSectionIndex >= 0 && (
              <Chip
                label={`${sections[activeSectionIndex]?.name} (${sections[activeSectionIndex]?.dynamicEnvelope})`}
                color="primary"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
            <Button
              variant="contained"
              size="medium"
              onClick={isPlaying ? stopPlayback : startPlayback}
              startIcon={isPlaying ? <StopIcon /> : <PlayArrowIcon />}
              sx={{
                bgcolor: isPlaying ? 'error.main' : '#c5a059',
                color: isPlaying ? '#ffffff' : '#0a0b10',
                fontWeight: 800,
                px: 3,
                '&:hover': {
                  bgcolor: isPlaying ? 'error.dark' : '#d4af66',
                },
              }}
            >
              {isPlaying ? 'Detener Sketch' : 'Reproducir Boceto Sonoro'}
            </Button>
          </Stack>
        </Box>

        {isPlaying && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#c5a059',
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
