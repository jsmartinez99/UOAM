import React, { useState, useRef } from 'react';
import { Box, Card, CardContent, Typography, Button, LinearProgress, Stack, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { ArrangementSection } from './ArrangementTimeline';

export interface AudioArrangementPlayerProps {
  sections: ArrangementSection[];
  tempoBpm?: number;
}

export default function AudioArrangementPlayer({ sections, tempoBpm = 78 }: AudioArrangementPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<any>(null);

  const startPlayback = () => {
    if (isPlaying) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      setIsPlaying(true);
      setActiveSectionIndex(0);

      const totalDurationSec = 15; // 3 seconds per section sketch
      const sectionDuration = totalDurationSec / sections.length;
      let elapsedTime = 0;

      intervalRef.current = setInterval(() => {
        elapsedTime += 0.2;
        const currentProgress = (elapsedTime / totalDurationSec) * 100;
        const currentSecIdx = Math.min(
          sections.length - 1,
          Math.floor((elapsedTime / totalDurationSec) * sections.length),
        );

        setActiveSectionIndex(currentSecIdx);
        setProgress(Math.min(100, currentProgress));

        // Play synthetic synth note for current section dynamic
        playSectionSound(ctx, sections[currentSecIdx]);

        if (elapsedTime >= totalDurationSec) {
          stopPlayback();
        }
      }, 200);
    } catch (e) {
      console.error('AudioContext start error', e);
    }
  };

  const stopPlayback = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
    setActiveSectionIndex(-1);
    setProgress(0);
  };

  const playSectionSound = (ctx: AudioContext, section: ArrangementSection) => {
    if (!ctx || ctx.state !== 'running') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Dynamic gain mapping
      const gainMap: Record<string, number> = { ppp: 0.05, pp: 0.1, p: 0.2, mf: 0.4, f: 0.7, ff: 0.9 };
      const targetGain = gainMap[section.dynamicEnvelope] || 0.3;

      osc.type = section.name === 'Climax' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4

      gain.gain.setValueAtTime(targetGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  };

  return (
    <Card sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(197, 160, 89, 0.3)', mt: 3, mb: 3 }}>
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <VolumeUpIcon sx={{ color: '#c5a059', fontSize: 28 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Previsualización Sonora en Tiempo Real (Web Audio)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Sintetizador Web Audio API | Envolventes dinámicas de las 5 Secciones
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {activeSectionIndex >= 0 && (
              <Chip
                label={`Reproduciendo: ${sections[activeSectionIndex]?.name} (${sections[activeSectionIndex]?.dynamicEnvelope})`}
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
