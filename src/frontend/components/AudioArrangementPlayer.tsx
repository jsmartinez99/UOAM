import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, LinearProgress, Stack, Chip, IconButton, Tooltip, Collapse, Divider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import BugReportIcon from '@mui/icons-material/BugReport';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Soundfont } from 'smplr';
import { ArrangementSection } from './ArrangementTimeline';

export interface AudioArrangementPlayerProps {
  sections: ArrangementSection[];
  tempoBpm?: number;
  keyCenter?: string;
  timeSignature?: string;
}

type Waveform = OscillatorType;

interface AudioLogEntry {
  ts: number;
  level: 'info' | 'warn' | 'error';
  category: 'context' | 'graph' | 'note' | 'metric' | 'lifecycle';
  message: string;
  data?: Record<string, unknown>;
}

interface AudioMetrics {
  contextState: string;
  contextSampleRate: number;
  contextBaseLatency: number | null;
  masterGain: number;
  notesScheduled: number;
  notesPlayed: number;
  activeOscillators: number;
  scheduledSection: string;
  scheduledBars: number;
  totalDurationSec: number;
  renderedAt: string;
}

interface InstrumentVoice {
  name: string;
  waveform: Waveform;
  detune: number;
  harmonicMix: number;
  filterFreq: number;
  filterQ: number;
  attackGain: number;
}

const INSTRUMENT_PATCHES: Array<{ keywords: string[]; patch: string; label: string }> = [
  { keywords: ['piccolo'], patch: 'piccolo', label: 'Piccolo' },
  { keywords: ['flute', 'flauta'], patch: 'flute', label: 'Flauta' },
  { keywords: ['oboe', 'oboé'], patch: 'oboe', label: 'Oboe' },
  { keywords: ['clarinete', 'clarinet'], patch: 'clarinet', label: 'Clarinete' },
  { keywords: ['fagot', 'bassoon', 'fagotto'], patch: 'bassoon', label: 'Fagot' },
  { keywords: ['tuba'], patch: 'tuba', label: 'Tuba' },
  { keywords: ['trombone', 'trombón'], patch: 'trombone', label: 'Trombón' },
  { keywords: ['trumpet', 'trompeta'], patch: 'trumpet', label: 'Trompeta' },
  { keywords: ['french horn', 'corno francés', 'horn'], patch: 'french_horn', label: 'Corno francés' },
  { keywords: ['cello', 'violonchelo', 'chelo'], patch: 'cello', label: 'Violonchelo' },
  { keywords: ['viola'], patch: 'viola', label: 'Viola' },
  { keywords: ['violin', 'violín'], patch: 'violin', label: 'Violín' },
  { keywords: ['contrabass', 'contrabajo'], patch: 'contrabass', label: 'Contrabajo' },
  { keywords: ['glockenspiel', 'glokenspiel'], patch: 'glockenspiel', label: 'Glockenspiel' },
  { keywords: ['celesta'], patch: 'celesta', label: 'Celesta' },
  { keywords: ['harp', 'arpa'], patch: 'orchestral_harp', label: 'Arpa' },
  { keywords: ['acordeón', 'accordion'], patch: 'accordion', label: 'Acordeón' },
  { keywords: ['piano'], patch: 'acoustic_grand_piano', label: 'Piano' },
  { keywords: ['guitarra', 'guitar'], patch: 'acoustic_guitar_nylon', label: 'Guitarra' },
  { keywords: ['brass', 'metales'], patch: 'brass_section', label: 'Metales' },
  { keywords: ['strings', 'cuerdas'], patch: 'string_ensemble_1', label: 'Cuerdas' },
  { keywords: ['madera', 'maderas', 'woodwind'], patch: 'flute', label: 'Maderas' },
  { keywords: ['conservatorio francés', 'conservatorio', 'orquesta'], patch: 'string_ensemble_1', label: 'Orquesta de cuerdas' },
  { keywords: ['parodia', 'parodias'], patch: 'oboe', label: 'Parodias (Oboe/Clarinete/Fagot)' },
];

const pickInstrumentPatch = (instruments: string[]): { patch: string; label: string } => {
  const all = instruments.map((s) => s.toLowerCase()).join(' ');
  for (const entry of INSTRUMENT_PATCHES) {
    if (entry.keywords.some((kw) => all.includes(kw))) {
      return { patch: entry.patch, label: entry.label };
    }
  }
  return { patch: 'acoustic_grand_piano', label: 'Piano (fallback)' };
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

const pickInstrumentVoice = (instruments: string[]): { name: string } => {
  return { name: pickInstrumentPatch(instruments).label };
};

const DYNAMIC_GAIN: Record<string, number> = {
  ppp: 0.40, pp: 0.50, p: 0.60, mf: 0.72, f: 0.82, ff: 0.95,
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
  patch: string;
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

  const baseVelocity = DYNAMIC_GAIN[section.dynamicEnvelope] ?? 0.4;
  const patch = pickInstrumentPatch(section.activeInstruments);

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
        patch,
      });
    }

    t += dur;
    barIndex++;
  }

  return { events, sectionDurationSec };
};

type SoundfontInstance = {
  start: (event: { note: number; velocity?: number; time?: number }) => (time?: number) => void;
  stop: () => void;
};

interface ScheduledNote {
  stop: (time?: number) => void;
}

export default function AudioArrangementPlayer({
  sections,
  tempoBpm = 78,
  keyCenter,
  timeSignature,
}: AudioArrangementPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);
  const [debugOpen, setDebugOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<AudioLogEntry[]>([]);
  const [metrics, setMetrics] = useState<AudioMetrics | null>(null);
  const [notesPlayedCount, setNotesPlayedCount] = useState<number>(0);
  const [copyStatus, setCopyStatus] = useState<string>('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterBusRef = useRef<GainNode | null>(null);
  const reverbBusRef = useRef<GainNode | null>(null);
  const scheduledNotesRef = useRef<ScheduledNote[]>([]);
  const soundfontCacheRef = useRef<Map<string, SoundfontInstance>>(new Map());
  const soundfontLoadingRef = useRef<Map<string, Promise<SoundfontInstance>>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const sectionBoundariesRef = useRef<{ start: number; end: number; name: string }[]>([]);
  const totalDurationRef = useRef<number>(0);
  const notesPlayedRef = useRef<number>(0);
  const lastReportRef = useRef<number>(0);
  const logsRef = useRef<AudioLogEntry[]>([]);

  const pushLog = useCallback((entry: Omit<AudioLogEntry, 'ts'>) => {
    const fullEntry: AudioLogEntry = { ...entry, ts: performance.now() };
    logsRef.current = [...logsRef.current.slice(-199), fullEntry];
    setLogs(logsRef.current);
    const consoleFn = entry.level === 'error' ? console.error
      : entry.level === 'warn' ? console.warn
        : console.info;
    consoleFn(`[Audio:${entry.category}] ${entry.message}`, entry.data ?? '');
  }, []);

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

  const refreshMetrics = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) {
      setMetrics(null);
      return;
    }
    setMetrics({
      contextState: ctx.state,
      contextSampleRate: ctx.sampleRate,
      contextBaseLatency: (ctx as any).baseLatency ?? null,
      masterGain: masterBusRef.current?.gain.value ?? 0,
      notesScheduled: scheduledNotesRef.current.length,
      notesPlayed: notesPlayedRef.current,
      activeOscillators: scheduledNotesRef.current.length,
      scheduledSection: sections[activeSectionIndex]?.name ?? '(ninguna)',
      scheduledBars: sections.reduce((acc, s) => acc + Math.max(1, s.bars.end - s.bars.start + 1), 0),
      totalDurationSec: totalDurationRef.current,
      renderedAt: new Date().toISOString(),
    });
  }, [sections, activeSectionIndex]);

  const startPlayback = async () => {
    if (isPlaying) return;
    logsRef.current = [];
    setLogs([]);
    notesPlayedRef.current = 0;
    setNotesPlayedCount(0);
    try {
      pushLog({ level: 'info', category: 'lifecycle', message: 'startPlayback invoked' });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        pushLog({ level: 'error', category: 'context', message: 'AudioContext no soportado en este navegador' });
        return;
      }
      const ctx = new AudioCtx({ latencyHint: 'interactive' });
      audioCtxRef.current = ctx;
      pushLog({
        level: 'info',
        category: 'context',
        message: `AudioContext creado`,
        data: { sampleRate: ctx.sampleRate, state: ctx.state, baseLatency: (ctx as any).baseLatency ?? null },
      });

      if (ctx.state === 'suspended') {
        pushLog({ level: 'warn', category: 'context', message: 'AudioContext en estado suspended — intentando resume()' });
        ctx.resume().then(() => {
          pushLog({ level: 'info', category: 'context', message: `AudioContext resumed → state = ${ctx.state}` });
        }).catch((err) => {
          pushLog({ level: 'error', category: 'context', message: 'AudioContext resume falló', data: { error: String(err) } });
        });
      } else {
        pushLog({ level: 'info', category: 'context', message: `AudioContext state = ${ctx.state}` });
      }

      const masterBus = ctx.createGain();
      masterBus.gain.setValueAtTime(0.85, ctx.currentTime);
      masterBus.connect(ctx.destination);
      masterBusRef.current = masterBus;
      pushLog({ level: 'info', category: 'graph', message: 'masterBus creado (gain=0.85 → destination)' });

      const reverb = ctx.createConvolver();
      reverb.buffer = buildImpulseResponse(ctx, 1.8, 2.2);
      const reverbGain = ctx.createGain();
      reverbGain.gain.setValueAtTime(0.22, ctx.currentTime);
      reverb.connect(reverbGain);
      reverbGain.connect(masterBus);
      reverbBusRef.current = reverb;
      pushLog({
        level: 'info',
        category: 'graph',
        message: 'reverbBus creado (Convolver 1.8s decay, wet=0.22)',
        data: { impulseLength: reverb.buffer.length, sampleRate: reverb.buffer.sampleRate },
      });

      const timeSig = parseTimeSignature(timeSignature);
      const scaleMidis = buildScaleForKey(keyCenter);
      const { mode } = parseKeyCenter(keyCenter);
      pushLog({
        level: 'info',
        category: 'graph',
        message: 'Partitura construida',
        data: { keyCenter, mode, timeSig, scaleMidis, tempoBpm, sections: sections.length },
      });

      let globalStart = ctx.currentTime + 0.15;
      const boundaries: { start: number; end: number; name: string }[] = [];
      let totalDuration = 0;
      let totalEvents = 0;

      const PREVIEW_BUDGET_SEC = 30;
      const perSectionCap = Math.max(4, Math.floor(PREVIEW_BUDGET_SEC / sections.length));
      let previewBudgetUsed = 0;
      pushLog({
        level: 'info',
        category: 'graph',
        message: `Preview budget: ${PREVIEW_BUDGET_SEC}s, cap por sección: ${perSectionCap}s`,
      });

      const patchesNeeded = new Set<string>();
      sections.forEach((s) => patchesNeeded.add(pickInstrumentPatch(s.activeInstruments).patch));
      pushLog({
        level: 'info',
        category: 'graph',
        message: `Patches a cargar: ${[...patchesNeeded].join(', ')}`,
      });

      const loadPatches = async (): Promise<void> => {
        await Promise.all([...patchesNeeded].map(async (patch) => {
          if (soundfontCacheRef.current.has(patch)) return;
          if (soundfontLoadingRef.current.has(patch)) {
            await soundfontLoadingRef.current.get(patch);
            return;
          }
          const p = new Promise<SoundfontInstance>((resolve, reject) => {
            let resolved = false;
            const finish = (inst: SoundfontInstance | null, err?: string): void => {
              if (resolved) return;
              resolved = true;
              if (err) {
                pushLog({ level: 'error', category: 'graph', message: `Soundfont ${patch} falló`, data: { error: err } });
                reject(new Error(err));
              } else if (inst) {
                pushLog({ level: 'info', category: 'graph', message: `Soundfont ${patch} listo` });
                resolve(inst);
              } else {
                pushLog({ level: 'error', category: 'graph', message: `Soundfont ${patch} terminó sin buffers` });
                reject(new Error('no buffers'));
              }
            };
            try {
              pushLog({ level: 'info', category: 'graph', message: `Cargando soundfont ${patch}...`, data: { url: `https://gleitz.github.io/midi-js-soundfonts/MusyngKite/${patch}-mp3.js` } });
              const inst = Soundfont({
                instrument: patch,
                destination: masterBus,
                volume: -8,
                onLoadProgress: (progress: { loaded: number; total: number }) => {
                  if (progress.loaded === progress.total && progress.total > 0) {
                    finish(inst as unknown as SoundfontInstance);
                  }
                },
              }) as unknown as SoundfontInstance;
              setTimeout(() => {
                const buffers = (inst as any)._buffers;
                if (buffers && buffers.size > 0) {
                  pushLog({ level: 'info', category: 'graph', message: `Soundfont ${patch} cargado (timeout fallback)`, data: { buffers: buffers.size } });
                  finish(inst);
                } else {
                  finish(null, 'timeout 15s sin buffers');
                }
              }, 15000);
            } catch (e) {
              finish(null, String(e));
            }
          });
          soundfontLoadingRef.current.set(patch, p);
          try {
            const inst = await p;
            soundfontCacheRef.current.set(patch, inst);
          } catch {
            // ya loggeado
          }
        }));
      };

      await loadPatches();
      pushLog({
        level: 'info',
        category: 'graph',
        message: `Soundfonts cargados: ${soundfontCacheRef.current.size}/${patchesNeeded.size}`,
      });

      sections.forEach((section, sIdx) => {
        const { events: fullEvents, sectionDurationSec: fullDuration } = buildSectionScore(
          section,
          tempoBpm,
          timeSig,
          scaleMidis,
          mode,
        );
        const sectionStart = globalStart;
        const remainingBudget = PREVIEW_BUDGET_SEC - previewBudgetUsed;
        const sectionCap = Math.max(2, Math.min(perSectionCap, remainingBudget));
        const truncated = fullDuration > sectionCap;
        const sectionDurationSec = truncated ? sectionCap : fullDuration;
        const events = truncated
          ? fullEvents.filter((e) => e.startSec < sectionCap)
          : fullEvents;

        const { patch, label } = pickInstrumentPatch(section.activeInstruments);
        const inst = soundfontCacheRef.current.get(patch);

        pushLog({
          level: 'info',
          category: 'graph',
          message: `Section ${sIdx + 1}/${sections.length}: ${section.name}`,
          data: {
            bars: `${section.bars.start}-${section.bars.end}`,
            fullDurationSec: fullDuration.toFixed(2),
            previewDurationSec: sectionDurationSec.toFixed(2),
            truncated,
            events: events.length,
            densityCap: section.densityCap,
            dynamicEnvelope: section.dynamicEnvelope,
            patch,
            label,
            soundfontReady: !!inst,
            activeInstruments: section.activeInstruments,
          },
        });

        if (!inst) {
          pushLog({ level: 'warn', category: 'graph', message: `Soundfont ${patch} no disponible, uso fallback synth (oscillator)` });
          events.forEach((event, eIdx) => {
            const startTime = sectionStart + event.startSec;
            const stopAt = startTime + event.durationSec;
            const fallback = playFallbackNote(ctx, masterBus, startTime, stopAt, event);
            scheduledNotesRef.current.push({ stop: fallback.stop });
            if (eIdx < 3) {
              pushLog({
                level: 'info',
                category: 'note',
                message: `note ${eIdx + 1} (fallback synth)`,
                data: { midi: event.midi, freq: midiToFreq(event.midi).toFixed(2), velocity: event.velocity.toFixed(3) },
              });
            }
          });
        } else {
          events.forEach((event, eIdx) => {
            const startTime = sectionStart + event.startSec;
            const stopAt = startTime + event.durationSec;
            const stopFn = inst.start({ note: event.midi, velocity: event.velocity, time: startTime });
            const wetStopFn = inst.start({ note: event.midi, velocity: event.velocity * 0.6, time: startTime });
            scheduledNotesRef.current.push({
              stop: (t?: number) => { try { stopFn(t); } catch {} try { wetStopFn(t); } catch {} },
            });
            if (eIdx < 3) {
              pushLog({
                level: 'info',
                category: 'note',
                message: `note ${eIdx + 1} programado (${patch})`,
                data: {
                  midi: event.midi,
                  freq: midiToFreq(event.midi).toFixed(2),
                  startSec: startTime.toFixed(3),
                  durationSec: event.durationSec.toFixed(3),
                  velocity: event.velocity.toFixed(3),
                },
              });
            }
          });
        }
        totalEvents += events.length;
        boundaries.push({
          start: sectionStart,
          end: sectionStart + sectionDurationSec,
          name: section.name,
        });
        totalDuration += sectionDurationSec;
        globalStart += sectionDurationSec;
        previewBudgetUsed += sectionDurationSec;
      });

      totalDurationRef.current = totalDuration;
      sectionBoundariesRef.current = boundaries;
      playStartTimeRef.current = ctx.currentTime;
      pushLog({
        level: 'info',
        category: 'lifecycle',
        message: 'playback iniciado',
        data: { totalEvents, totalDurationSec: totalDuration.toFixed(2), scheduledNotes: scheduledNotesRef.current.length },
      });
      setIsPlaying(true);
      setActiveSectionIndex(0);
      setProgress(0);
      refreshMetrics();

      const tick = () => {
        if (!audioCtxRef.current) return;
        const elapsed = audioCtxRef.current.currentTime - (playStartTimeRef.current + 0.15);
        if (elapsed >= totalDuration) {
          pushLog({ level: 'info', category: 'lifecycle', message: 'playback finalizado (duración total alcanzada)' });
          stopPlayback();
          return;
        }
        const pct = Math.min(100, (elapsed / totalDuration) * 100);
        setProgress(pct);
        const relStart = (b: typeof boundaries[number]) => b.start - playStartTimeRef.current - 0.15;
        const relEnd = (b: typeof boundaries[number]) => b.end - playStartTimeRef.current - 0.15;
        const idx = boundaries.findIndex((b) => elapsed >= relStart(b) && elapsed < relEnd(b));
        if (idx >= 0) setActiveSectionIndex(idx);

        const expectedNotes = Math.floor((elapsed / totalDuration) * totalEvents);
        if (expectedNotes > notesPlayedRef.current) {
          notesPlayedRef.current = expectedNotes;
          setNotesPlayedCount(expectedNotes);
        }

        const now = performance.now();
        if (now - lastReportRef.current > 1000) {
          lastReportRef.current = now;
          refreshMetrics();
        }
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      animationFrameRef.current = requestAnimationFrame(tick);
    } catch (e) {
      pushLog({ level: 'error', category: 'lifecycle', message: 'Excepción en startPlayback', data: { error: String(e), stack: (e as Error)?.stack } });
    }
  };

  const stopPlayback = () => {
    const stoppedAt = audioCtxRef.current?.currentTime ?? 0;
    const elapsed = stoppedAt - (playStartTimeRef.current + 0.15);
    pushLog({
      level: 'info',
      category: 'lifecycle',
      message: 'stopPlayback invoked',
      data: { elapsedSec: Math.max(0, elapsed).toFixed(2), notesPlayed: notesPlayedRef.current, scheduledNotes: scheduledNotesRef.current.length },
    });
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    scheduledNotesRef.current.forEach(({ stop }) => {
      try { stop(); } catch (e) {
        pushLog({ level: 'warn', category: 'lifecycle', message: 'note.stop() falló', data: { error: String(e) } });
      }
    });
    scheduledNotesRef.current = [];
    soundfontCacheRef.current.forEach((inst) => {
      try { inst.stop(); } catch (e) {
        pushLog({ level: 'warn', category: 'lifecycle', message: 'soundfont.stop() falló', data: { error: String(e) } });
      }
    });
    soundfontCacheRef.current.clear();
    if (audioCtxRef.current) {
      audioCtxRef.current.close().then(() => {
        pushLog({ level: 'info', category: 'context', message: 'AudioContext cerrado' });
      }).catch((e) => {
        pushLog({ level: 'warn', category: 'context', message: 'AudioContext close falló', data: { error: String(e) } });
      });
      audioCtxRef.current = null;
    }
    masterBusRef.current = null;
    reverbBusRef.current = null;
    setIsPlaying(false);
    setActiveSectionIndex(-1);
    setProgress(0);
    refreshMetrics();
  };

  const downloadAnalysis = () => {
    const payload = {
      schema: 'uoam.audio.analysis.v1',
      generatedAt: new Date().toISOString(),
      config: { keyCenter, mode: parseKeyCenter(keyCenter).mode, tempoBpm, timeSignature: parseTimeSignature(timeSignature), sections: sections.length },
      metrics,
      events: {
        totalScheduled: scheduledNotesRef.current.length || 0,
        totalPlayed: notesPlayedRef.current,
      },
      log: logsRef.current,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uoam-audio-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushLog({ level: 'info', category: 'lifecycle', message: 'Análisis descargado' });
  };

  const copyLogsToClipboard = () => {
    const text = logsRef.current.map((l) => `[${l.level.toUpperCase()}] [${l.category}] ${l.message}${l.data ? ' ' + JSON.stringify(l.data) : ''}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus('Copiado');
      setTimeout(() => setCopyStatus(''), 1500);
    }).catch((e) => {
      setCopyStatus('Error');
      console.error('Clipboard error', e);
    });
  };

  const levelColor = (lvl: AudioLogEntry['level']) =>
    lvl === 'error' ? '#f87171' : lvl === 'warn' ? '#fbbf24' : '#60a5fa';

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
                Soundfont (samples reales) · {keyCenter ?? 'C major'} · {tempoBpm} BPM · {timeSignature ?? '4/4'}
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
            <Tooltip title="Panel de diagnóstico">
              <IconButton
                size="small"
                onClick={() => { setDebugOpen((v) => !v); if (!debugOpen) refreshMetrics(); }}
                sx={{ color: debugOpen ? '#c5a059' : 'text.secondary' }}
                data-testid="audio-debug-toggle"
              >
                <BugReportIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              {notesPlayedCount} notas reproducidas · {scheduledNotesRef.current.length} voces · {Math.max(0, totalDurationRef.current - (audioCtxRef.current?.currentTime ?? 0) + (playStartTimeRef.current + 0.15)).toFixed(1)}s restantes
            </Typography>
          </Box>
        )}

        <Collapse in={debugOpen}>
          <Divider sx={{ my: 2, borderColor: 'rgba(197, 160, 89, 0.2)' }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#c5a059', mb: 1, fontWeight: 700 }}>
                Métricas en tiempo real
              </Typography>
              {metrics ? (
                <Box component="pre" sx={{
                  m: 0, p: 1.5, fontSize: 11, fontFamily: 'ui-monospace, monospace',
                  bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 1, color: '#e2e8f0',
                  border: '1px solid rgba(197, 160, 89, 0.15)',
                  overflow: 'auto', maxHeight: 260,
                }}>
{JSON.stringify(metrics, null, 2)}
                </Box>
              ) : (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  (Inicia la reproducción para capturar métricas)
                </Typography>
              )}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#c5a059', fontWeight: 700 }}>
                  Log técnico ({logs.length})
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title={copyStatus || 'Copiar log'}>
                    <IconButton size="small" onClick={copyLogsToClipboard} sx={{ color: 'text.secondary' }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refrescar métricas">
                    <IconButton size="small" onClick={refreshMetrics} sx={{ color: 'text.secondary' }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Descargar análisis JSON">
                    <IconButton size="small" onClick={downloadAnalysis} sx={{ color: 'text.secondary' }}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
              <Box sx={{
                p: 1.5, fontSize: 11, fontFamily: 'ui-monospace, monospace',
                bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 1, color: '#e2e8f0',
                border: '1px solid rgba(197, 160, 89, 0.15)',
                overflow: 'auto', maxHeight: 260,
              }}>
                {logs.length === 0 ? (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    (Sin eventos aún)
                  </Typography>
                ) : (
                  logs.map((entry, idx) => (
                    <Box key={idx} sx={{ mb: 0.25, color: levelColor(entry.level) }}>
                      <span style={{ opacity: 0.55 }}>{(entry.ts / 1000).toFixed(2)}s </span>
                      <span style={{ fontWeight: 700 }}>[{entry.category}]</span>{' '}
                      {entry.message}
                      {entry.data !== undefined && (
                        <Box component="span" sx={{ display: 'block', pl: 2, opacity: 0.7, fontSize: 10 }}>
                          {JSON.stringify(entry.data)}
                        </Box>
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
