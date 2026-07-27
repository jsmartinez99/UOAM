import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { apiService } from '../services/apiService';
import { useLocation } from 'react-router';
import ArrangementTimeline, { ArrangementTimelineProps } from '../components/ArrangementTimeline';
import AudioArrangementPlayer from '../components/AudioArrangementPlayer';

export default function StandaloneArrangerPage() {
  const location = useLocation();
  const hybridState = location.state as { hybridDimensions?: Record<string, string[]>; hybridTitle?: string } | null;

  const [arrangers, setArrangers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [title, setTitle] = useState<string>(hybridState?.hybridTitle || 'Quítame la ropa antes del amanecer');
  const [keyCenter, setKeyCenter] = useState<string>('Cm');
  const [tempoBpm, setTempoBpm] = useState<number>(78);
  const [timeSignature, setTimeSignature] = useState<string>('4/4');

  const [loadingArrangers, setLoadingArrangers] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedArrangement, setGeneratedArrangement] = useState<ArrangementTimelineProps | null>(null);

  useEffect(() => {
    async function loadArrangers() {
      try {
        const response = await apiService.getArrangers();
        const list = Array.isArray(response) ? response : response.data || [];
        setArrangers(list);
        if (list.length > 0) {
          setSelectedProfileId(list[0].id);
        }
      } catch (err: any) {
        setError('No se pudo cargar el catálogo de arreglistas: ' + (err.message || ''));
      } finally {
        setLoadingArrangers(false);
      }
    }
    loadArrangers();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      const result = await apiService.generateArrangement({
        title,
        keyCenter,
        tempoBpm,
        timeSignature,
        profileId: selectedProfileId || undefined,
        dimensionsOverride: hybridState?.hybridDimensions,
      });

      setGeneratedArrangement(result);
    } catch (err: any) {
      setError('Error al generar el arreglo en 5 secciones: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Title */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary', mb: 1 }}>
          Generador de Arreglos <span style={{ color: '#c5a059' }}>en 5 Secciones</span>
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', maxWidth: 750, mx: 'auto' }}>
          Construye arreglos orquestales autónomos basados en las firmas 6D de arreglistas maestros (Carlos Centurión 🇵🇾, Claus Ogerman, Nelson Riddle, Astor Piazzolla, etc.) trazando la forma completa en 5 secciones.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Options Form Card */}
      <Card sx={{ bgcolor: 'background.paper', border: '1px solid rgba(255, 255, 255, 0.08)', mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleGenerate}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Arreglista Maestro (Firma 6D)"
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  disabled={loadingArrangers || generating}
                  helperText="Selecciona un perfil técnico del catálogo"
                >
                  {arrangers.map((arr) => (
                    <MenuItem key={arr.id} value={arr.id}>
                      {arr.name === 'Carlos Centurión' ? '🇵🇾 Carlos Centurión' : arr.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Título del Arreglo / Obra"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={generating}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Tonalidad (Key)"
                  value={keyCenter}
                  onChange={(e) => setKeyCenter(e.target.value)}
                  disabled={generating}
                  placeholder="ej. Cm, Do menor, Fmaj"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tempo (BPM)"
                  value={tempoBpm}
                  onChange={(e) => setTempoBpm(Number(e.target.value))}
                  disabled={generating}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Compás (Time Signature)"
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  disabled={generating}
                  placeholder="ej. 4/4, 6/8, 3/4"
                />
              </Grid>

              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={generating || loadingArrangers}
                  startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                  sx={{
                    bgcolor: '#c5a059',
                    color: '#0a0b10',
                    fontWeight: 800,
                    px: 4,
                    py: 1.5,
                    '&:hover': { bgcolor: '#d4af66' },
                  }}
                >
                  {generating ? 'Generando 5 Secciones...' : 'Generar Arreglo Autónomo'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Output Section */}
      {generatedArrangement && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AutoAwesomeIcon sx={{ color: '#c5a059' }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Resultado de Generación Autónomo
            </Typography>
          </Box>
          <AudioArrangementPlayer sections={generatedArrangement.sections} tempoBpm={generatedArrangement.tempoBpm} />
          <ArrangementTimeline {...generatedArrangement} />
        </Box>
      )}
    </Container>
  );
}
