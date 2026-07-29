import React from 'react';
import { Box, Card, CardContent, Typography, Chip, LinearProgress, Stack, Button } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

export interface ScoreNote {
  midi: number;
  durationBeats: number;
  voiceIndex: number;
}

export interface ChordEvent {
  barIndex: number;
  rootMidi: number;
  intervals: number[];
  quality: string;
  romanNumeral: string;
}

export interface SectionScore {
  notes: ScoreNote[];
  chords: ChordEvent[];
  melody: ScoreNote[];
  bassLine: ScoreNote[];
}

export interface ArrangementSection {
  name: 'Introduction' | 'Exposition' | 'Development' | 'Climax' | 'Coda';
  bars: { start: number; end: number };
  densityCap: number;
  dynamicEnvelope: 'ppp' | 'pp' | 'p' | 'mf' | 'f' | 'ff';
  activeInstruments: string[];
  harmonicTechniques: string[];
  counterpointMotion: 'contrary' | 'oblique' | 'parallel' | 'homophonic';
  aestheticGestures: string[];
  score: SectionScore;
}

export interface ArrangementTimelineProps {
  title: string;
  targetArranger: string;
  keyCenter: string;
  tempoBpm: number;
  timeSignature: string;
  sections: ArrangementSection[];
  depthScore: number;
  isProfessionalAssimilation: boolean;
}

const SECTION_COLORS: Record<string, string> = {
  Introduction: '#4A5568',
  Exposition: '#2B6CB0',
  Development: '#805AD5',
  Climax: '#DD6B20',
  Coda: '#319795',
};

const DYNAMIC_BADGES: Record<string, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success'; label: string }> = {
  ppp: { color: 'info', label: 'ppp (Pianississimo)' },
  pp: { color: 'info', label: 'pp (Pianissimo)' },
  p: { color: 'success', label: 'p (Piano)' },
  mf: { color: 'primary', label: 'mf (Mezzo-forte)' },
  f: { color: 'warning', label: 'f (Forte)' },
  ff: { color: 'error', label: 'ff (Fortissimo)' },
};

export default function ArrangementTimeline({
  title,
  targetArranger,
  keyCenter,
  tempoBpm,
  timeSignature,
  sections,
  depthScore,
  isProfessionalAssimilation,
}: ArrangementTimelineProps) {
  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      {/* Header Summary Card */}
      <Card sx={{ bgcolor: 'background.paper', border: '1px solid rgba(255, 255, 255, 0.1)', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <MusicNoteIcon sx={{ color: '#c5a059' }} /> {title}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#c5a059', fontWeight: 600 }}>
                Arreglista de Referencia: {targetArranger}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Tonalidad: <strong>{keyCenter}</strong> | Tempo: <strong>{tempoBpm} BPM</strong> | Compás: <strong>{timeSignature}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Progresión global: <strong>
                  {sections.length > 0
                    ? sections
                        .map((s) => s.score.chords.slice(0, 4).map((c) => c.romanNumeral).join(' → '))
                        .join(' | ')
                    : '—'}
                </strong>
              </Typography>
            </Box>

            {/* Depth Score Badge */}
            <Box sx={{ textAlign: 'right', minWidth: 200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', mb: 0.5 }}>
                <AutoAwesomeIcon sx={{ color: isProfessionalAssimilation ? '#c5a059' : 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Asimilación Profesional: {Math.round(depthScore * 100)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={depthScore * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: isProfessionalAssimilation ? '#c5a059' : 'primary.main',
                  },
                }}
              />
              {isProfessionalAssimilation && (
                <Chip
                  label="Certificación de Asimilación Completa (Nivel 3)"
                  size="small"
                  sx={{ mt: 1, bgcolor: 'rgba(197, 160, 89, 0.2)', color: '#c5a059', fontWeight: 700, border: '1px solid #c5a059' }}
                />
              )}
              <Box sx={{ mt: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={async () => {
                    try {
                      const { apiService } = await import('../services/apiService');
                      const blob = await apiService.exportMusicXML({
                        title,
                        targetArranger,
                        keyCenter,
                        tempoBpm,
                        timeSignature,
                        sections,
                        depthScore,
                        isProfessionalAssimilation,
                      });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${title || 'arreglo'}.musicxml`;
                      a.click();
                    } catch (e) {
                      console.error('Export failed', e);
                    }
                  }}
                  sx={{ borderColor: '#c5a059', color: '#c5a059', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  Descargar MusicXML
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 5-Section Interactive Timeline */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
        Línea de Tiempo Formal (5 Secciones)
      </Typography>

      <Stack spacing={2}>
        {sections.map((sec, idx) => {
          const color = SECTION_COLORS[sec.name] || '#2B6CB0';
          const dyn = DYNAMIC_BADGES[sec.dynamicEnvelope] || { color: 'default', label: sec.dynamicEnvelope };

          return (
            <Card
              key={idx}
              sx={{
                bgcolor: 'rgba(15, 23, 42, 0.6)',
                borderLeft: `6px solid ${color}`,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateX(4px)',
                },
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color }}>
                      {idx + 1}. {sec.name}
                    </Typography>
                    <Chip
                      label={`Compases ${sec.bars.start} - ${sec.bars.end}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'text.primary', fontWeight: 600 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={dyn.label} color={dyn.color} size="small" sx={{ fontWeight: 700 }} />
                    <Chip label={`Densidad Cap: ${Math.round(sec.densityCap * 100)}%`} variant="outlined" size="small" />
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 1 }}>
                  {/* Instrumentos & Movimiento Contrapuntístico */}
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                      Instrumentos Activos & Contrapunto
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
                      {sec.activeInstruments.map((inst, i) => (
                        <Chip key={i} label={inst} size="small" variant="filled" sx={{ bgcolor: 'rgba(197, 160, 89, 0.15)', color: '#e2e8f0', fontSize: '0.75rem' }} />
                      ))}
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      Movimiento: <strong>{sec.counterpointMotion.toUpperCase()}</strong>
                    </Typography>
                  </Box>

                  {/* Técnicas Armónicas & Gestos Estéticos */}
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                      Técnicas Armónicas & Gestos Estéticos
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                      {sec.harmonicTechniques.map((tech, i) => (
                        <Chip key={i} label={tech} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                      ))}
                      {sec.aestheticGestures.map((gest, i) => (
                        <Chip key={i} label={`Sello: ${gest}`} size="small" color="secondary" sx={{ fontSize: '0.75rem', fontWeight: 700 }} />
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
