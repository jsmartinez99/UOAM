import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Grid,
  Container,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router';
import { apiService } from '../services/apiService';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ReplayIcon from '@mui/icons-material/Replay';

// ─── Componentes de UI reutilizables ────────────────────────────────

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: 'rgba(18, 20, 32, 0.55)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: theme.shape.borderRadius * 1.5,
}));

const ResultBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(4),
  backgroundColor: 'rgba(18, 20, 32, 0.4)',
  borderRadius: theme.shape.borderRadius * 1.5,
  border: '1px solid rgba(255, 255, 255, 0.03)',
}));

const DIMENSION_ICONS: Record<string, string> = {
  organology: '🎺',
  harmony: '🎵',
  counterpoint: '🎼',
  texture: '🎨',
  rhythm: '🥁',
  taste: '✨',
};

const DIMENSION_LABELS: Record<string, string> = {
  organology: 'Organología',
  harmony: 'Armonía',
  counterpoint: 'Contrapunto',
  texture: 'Textura',
  rhythm: 'Ritmo',
  taste: 'Gusto',
};

// ─── Componente principal ─────────────────────────────────────────

export default function HybridizationTool() {
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await apiService.getArrangers();
        const data = Array.isArray(res) ? res : res?.data || [];
        setAvailableProfiles(data);

        // Pre-select profile if passed via URL params
        const urlProfile = searchParams.get('profile');
        if (urlProfile && data.some((p) => p.id === urlProfile)) {
          setSelectedProfiles([urlProfile]);
        }
      } catch (err) {
        setError('Error al cargar perfiles disponibles');
      }
    };

    fetchProfiles();
  }, [searchParams]);

  const handleProfileSelect = (event: any) => {
    const {
      target: { value },
    } = event;
    setSelectedProfiles(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleHybridize = async () => {
    if (selectedProfiles.length < 2) {
      setError('Selecciona al menos 2 perfiles para hibridar');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const hybridResult = await apiService.hybridizeProfiles(selectedProfiles);
      setResult(hybridResult);
    } catch (err) {
      setError('Error al hibridar perfiles');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!result) return;

    try {
      setLoading(true);
      const analysis = await apiService.generateAnalysis({
        arranger: selectedProfiles.map(id => availableProfiles.find(p => p.id === id)?.name).join(' + '),
        confidence: 0.95,
        matchedDimension: 'Texture',
      });
      setResult({ ...result, analysis });
    } catch (err) {
      setError('Error al generar análisis');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        </Snackbar>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" gutterBottom>
          Herramienta de Hibridación AST
        </Typography>
        <Typography color="text.secondary">
          Combina la firma estilística de dos maestros musicales para crear un perfil de orquestación híbrido unificado.
        </Typography>
      </Box>

      <StyledPaper elevation={0}>
        <Typography variant="h3" sx={{ mb: 3, fontWeight: 700 }}>
          Selecciona perfiles para hibridar
        </Typography>

        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel id="profile-select-label" sx={{ color: 'text.secondary' }}>Perfiles Arreglistas</InputLabel>
          <Select
            labelId="profile-select-label"
            id="profile-select"
            multiple
            value={selectedProfiles}
            onChange={handleProfileSelect}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((id) => (
                  <Chip
                    key={id}
                    label={availableProfiles.find((p) => p.id === id)?.name || id}
                    sx={{ bgcolor: 'rgba(197, 160, 89, 0.1)', color: 'primary.main', border: '1px solid rgba(197, 160, 89, 0.2)' }}
                  />
                ))}
              </Box>
            )}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.05)',
              },
              '& input[type="text"]': {
                display: 'none !important',
              },
              bgcolor: 'rgba(10, 11, 16, 0.3)',
            }}
          >
            {availableProfiles.map((profile) => (
              <MenuItem 
                key={profile.id} 
                value={profile.id}
                disabled={selectedProfiles.length >= 2 && !selectedProfiles.includes(profile.id)}
              >
                {profile.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleHybridize}
          disabled={loading || selectedProfiles.length < 2}
          fullWidth
          size="large"
          startIcon={<AutoAwesomeIcon />}
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Hibridar Perfiles'}
        </Button>
      </StyledPaper>

      {result && (
        <ResultBox>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 800 }}>
            Resultado del Híbrido Estilístico
          </Typography>
          <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.05)' }} />

          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Perfiles de Origen:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
            {selectedProfiles.map((id) => (
              <Chip
                key={id}
                label={availableProfiles.find((p) => p.id === id)?.name || id}
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>

          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Características Resueltas por Fusión 6D:
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {Object.entries(result.mergedProfile).map(([dimension, values]: [string, any]) => (
              <Grid item xs={12} sm={6} key={dimension}>
                <Paper sx={{ p: 2.5, height: '100%', bgcolor: 'rgba(18, 20, 32, 0.3)', borderColor: 'rgba(255,255,255,0.02)' }}>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, fontWeight: 700 }}>
                    <span>{DIMENSION_ICONS[dimension]}</span>
                    <span>{DIMENSION_LABELS[dimension]}</span>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {values.map((value: string, index: number) => (
                      <Chip 
                        key={index} 
                        label={value} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(0, 196, 159, 0.05)', 
                          color: '#33d0b2', 
                          border: '1px solid rgba(0, 196, 159, 0.1)',
                          fontSize: '0.7rem'
                        }} 
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {result.resolutionLog.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Log de Resolución de Conflictos AST:
              </Typography>
              <Paper sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {result.resolutionLog.map((log: string, index: number) => (
                    <Typography key={index} variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      ⚡ {log}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Box>
          )}

          {result.analysis && (
            <Box sx={{ mt: 4, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Análisis Teórico RAG (Generado por IA):
              </Typography>
              <Paper sx={{ p: 3, bgcolor: 'rgba(197, 160, 89, 0.03)', borderColor: 'rgba(197, 160, 89, 0.1)', borderRadius: 2 }}>
                <Typography variant="body1" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  {result.analysis.content}
                </Typography>
              </Paper>
            </Box>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                setResult(null);
                setSelectedProfiles([]);
              }}
              startIcon={<ReplayIcon />}
            >
              Reiniciar
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAnalyze}
              disabled={loading || !!result.analysis}
              startIcon={<SmartToyIcon />}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Generar Análisis RAG'}
            </Button>
          </Box>
        </ResultBox>
      )}
    </Container>
  );
}
