import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

// ─── Componentes de UI reutilizables ────────────────────────────────

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  maxWidth: 800,
  margin: 'auto',
}));

const ResultBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
}));

// ─── Componente principal ─────────────────────────────────────────

export default function HybridizationTool() {
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await apiService.getArrangers();
        setAvailableProfiles(data);
      } catch (err) {
        setError('Error al cargar perfiles disponibles');
      }
    };

    fetchProfiles();
  }, []);

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
        arranger: 'Híbrido',
        confidence: 0.9,
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
    <Box sx={{ p: 3 }}> 
      <Typography variant="h2" gutterBottom component="h1">
        Herramienta de Hibridación
      </Typography>

      <StyledPaper elevation={3}> 
        <Typography variant="h5" gutterBottom>
          Selecciona perfiles para hibridar
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}> 
          <InputLabel id="profile-select-label">Perfiles</InputLabel>
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
                  />
                ))}
              </Box>
            )}
          >
            {availableProfiles.map((profile) => (
              <MenuItem key={profile.id} value={profile.id}> 
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
        >
          {loading ? <CircularProgress size={24} /> : 'Hibridar Perfiles'}
        </Button>

        {error && (
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError(null)}
          >
            <Alert severity="error">{error}</Alert>
          </Snackbar>
        )}
      </StyledPaper>

      {result && (
        <ResultBox> 
          <Typography variant="h5" gutterBottom>
            Resultado de Hibridación
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Perfiles hibridados:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}> 
            {selectedProfiles.map((id) => (
              <Chip
                key={id}
                label={availableProfiles.find((p) => p.id === id)?.name || id}
                color="primary"
              />
            ))}
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Características resueltas:
          </Typography>
          <Box sx={{ mb: 3 }}> 
            {Object.entries(result.mergedProfile).map(([dimension, values]: [string, any]) => (
              <Box key={dimension} sx={{ mb: 2 }}> 
                <Typography variant="subtitle2" gutterBottom>
                  {dimension}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}> 
                  {values.map((value: string, index: number) => (
                    <Chip key={index} label={value} size="small" />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>

          {result.resolutionLog.length > 0 && (
            <Box sx={{ mb: 3 }}> 
              <Typography variant="subtitle1" gutterBottom>
                Log de resolución:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}> 
                {result.resolutionLog.map((log: string, index: number) => (
                  <Typography key={index} variant="body2">
                    • {log}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {result.analysis && (
            <Box sx={{ mt: 3 }}> 
              <Typography variant="subtitle1" gutterBottom>
                Análisis generado por LLM:
              </Typography>
              <Paper elevation={1} sx={{ p: 2 }}> 
                <Typography variant="body1" whiteSpace="pre-wrap"> 
                  {result.analysis.content}
                </Typography>
              </Paper>
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}> 
            <Button
              variant="outlined"
              onClick={() => setResult(null)}
            >
              Reiniciar
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAnalyze}
              disabled={loading || !!result.analysis}
            >
              {loading ? <CircularProgress size={24} /> : 'Generar Análisis'}
            </Button>
          </Box>
        </ResultBox>
      )}
    </Box>
  );
}
