import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  Autocomplete,
  CircularProgress,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Container,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip as RTooltip,
} from 'recharts';
import { apiService } from '../services/apiService';

// ─── Types ───────────────────────────────────────────────────────

interface ArrangerData {
  id: string;
  name: string;
  dimensions: {
    organology: string[];
    harmony: string[];
    counterpoint: string[];
    texture: string[];
    rhythm: string[];
    taste: string[];
  };
}

interface RadarPoint {
  dimension: string;
  label: string;
  fullMark: number;
  [key: string]: string | number;
}

const DIMENSION_LABELS: Record<string, string> = {
  organology: 'Organología',
  harmony: 'Armonía',
  counterpoint: 'Contrapunto',
  texture: 'Textura',
  rhythm: 'Ritmo',
  taste: 'Gusto',
};

const DIMENSION_COLORS = [
  '#c5a059', // Gold
  '#00C49F', // Waveform Teal
  '#ff7300', // Orange
  '#FF6384', // Rose
  '#36A2EB', // Sky Blue
  '#9966FF'  // Violet
];

// ─── Component ───────────────────────────────────────────────────

export default function AnalysisTool() {
  const [arrangers, setArrangers] = useState<ArrangerData[]>([]);
  const [selectedArrangers, setSelectedArrangers] = useState<ArrangerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<ArrangerData | null>(null);

  // ── Fetch arrangers on mount ──
  useEffect(() => {
    setLoading(true);
    apiService
      .getArrangers()
      .then((res: any) => setArrangers(Array.isArray(res) ? res : res?.data || []))
      .catch(() => setError('Error cargando arreglistas'))
      .finally(() => setLoading(false));
  }, []);

  // ── Build radar data ──
  const buildRadarData = useCallback((): RadarPoint[] => {
    const keys = Object.keys(DIMENSION_LABELS);
    return keys.map((key) => {
      const point: RadarPoint = {
        dimension: key,
        label: DIMENSION_LABELS[key],
        fullMark: 10,
      };
      selectedArrangers.forEach((a) => {
        const dim = a.dimensions[key as keyof typeof a.dimensions];
        point[a.name] = dim ? dim.length : 0;
      });
      return point;
    });
  }, [selectedArrangers]);

  // ── Generate LLM analysis ──
  const handleAnalysis = async () => {
    if (selectedArrangers.length === 0) return;
    setAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const target = selectedArrangers[0];
      const result = await apiService.generateAnalysis({
        arranger: target.name,
        confidence: 0.95,
        matchedDimension: 'harmony',
      });
      setAnalysisResult(result.content);
    } catch {
      setError('Error generando análisis');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // ── File upload ──
  const handleFileUpload = async () => {
    if (!uploadFile) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.uploadArrangement(uploadFile);
      setUploadResult(result);
      setUploadFile(null);
      // Refresh arranger list
      const data: any = await apiService.getArrangers();
      setArrangers(data);
    } catch {
      setError('Error procesando archivo. Formatos aceptados: MusicXML, MIDI');
    } finally {
      setLoading(false);
    }
  };

  // ── Dimension detail cards ──
  const renderDimensionDetail = (arranger: ArrangerData) => (
    <Card key={arranger.id} sx={{ mb: 2.5, bgcolor: 'rgba(18, 20, 32, 0.45)', borderColor: 'rgba(255,255,255,0.03)' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h3" sx={{ fontSize: '1.15rem', fontWeight: 800, mb: 2.5, color: 'primary.main' }}>
          {arranger.name}
        </Typography>
        <Grid container spacing={2.5}>
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
            const values = arranger.dimensions[key as keyof typeof arranger.dimensions] || [];
            return (
              <Grid item xs={12} sm={6} key={key}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.75 }}>
                  {label} ({values.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {values.map((v, i) => (
                    <Chip
                      key={i}
                      label={v}
                      size="small"
                      sx={{ 
                        fontSize: '0.65rem',
                        bgcolor: 'rgba(255,255,255,0.02)',
                        color: 'text.secondary',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}
                    />
                  ))}
                  {values.length === 0 && (
                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                      Sin atributos
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );

  // ── Comparison stats ──
  const renderComparison = () => {
    if (selectedArrangers.length < 2) return null;
    const a = selectedArrangers[0];
    const b = selectedArrangers[1];
    const keys = Object.keys(DIMENSION_LABELS) as Array<
      keyof typeof a.dimensions
    >;
    const shared = keys.filter((k) => {
      const setA = new Set(a.dimensions[k]);
      return b.dimensions[k].some((v) => setA.has(v));
    });
    return (
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'rgba(18, 20, 32, 0.3)', borderColor: 'rgba(255,255,255,0.05)' }}>
        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareArrowsIcon color="primary" />
          Comparación de Estilos: {a.name} vs {b.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Dimensiones con atributos compartidos: <strong>{shared.length} de {keys.length}</strong>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {shared.map((k) => (
            <Chip 
              key={k} 
              label={DIMENSION_LABELS[k]} 
              color="secondary" 
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ))}
          {keys
            .filter((k) => !shared.includes(k))
            .map((k) => (
              <Chip
                key={k}
                label={DIMENSION_LABELS[k]}
                variant="outlined"
                color="default"
                size="small"
                sx={{ color: 'text.disabled', borderColor: 'rgba(255,255,255,0.05)' }}
              />
            ))}
        </Box>
      </Paper>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h1" gutterBottom>
          Herramienta de Análisis 6D y RAG
        </Typography>
        <Typography color="text.secondary">
          Visualiza firmas hexadimensionales en gráficos de radar, compara maestros e indexa partituras a través del pipeline de audio.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* ── Left: Controls ── */}
        <Grid item xs={12} md={5}>
          {/* Arranger selector */}
          <Paper sx={{ p: 4, mb: 3, bgcolor: 'rgba(18, 20, 32, 0.55)', borderColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 2.5 }}>
              Seleccionar Arreglistas
            </Typography>
            {loading && arrangers.length === 0 ? (
              <CircularProgress size={24} color="primary" />
            ) : (
              <Autocomplete
                multiple
                options={arrangers}
                getOptionLabel={(opt) => opt.name}
                value={selectedArrangers}
                onChange={(_, val) => setSelectedArrangers(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar arreglistas..."
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(10, 11, 16, 0.3)',
                      }
                    }}
                  />
                )}
                renderTags={(val, getTagProps) =>
                  val.map((opt, idx) => (
                    <Chip
                      {...getTagProps({ index: idx })}
                      key={opt.id}
                      label={opt.name}
                      sx={{
                        fontWeight: 600,
                        bgcolor: DIMENSION_COLORS[idx % DIMENSION_COLORS.length] + '20',
                        color: DIMENSION_COLORS[idx % DIMENSION_COLORS.length],
                        border: `1px solid ${DIMENSION_COLORS[idx % DIMENSION_COLORS.length]}40`
                      }}
                    />
                  ))
                }
              />
            )}
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3, py: 1.2 }}
              disabled={selectedArrangers.length === 0 || analysisLoading}
              onClick={handleAnalysis}
              startIcon={
                analysisLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <AutoGraphIcon />
                )
              }
              fullWidth
            >
              {analysisLoading ? 'Generando análisis...' : 'Generar Análisis RAG'}
            </Button>
          </Paper>

          {/* File upload */}
          <Paper sx={{ p: 4, mb: 3, bgcolor: 'rgba(18, 20, 32, 0.55)', borderColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontSize: '1.2rem', fontWeight: 700, mb: 2 }}>
              Ingesta de Audio y Partituras
            </Typography>
            <Box 
              sx={{ 
                border: '2px dashed rgba(255, 255, 255, 0.08)',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                mb: 3,
                cursor: 'pointer',
                bgcolor: uploadFile ? 'rgba(197, 160, 89, 0.02)' : 'transparent',
                borderColor: uploadFile ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(197, 160, 89, 0.01)',
                }
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                accept=".xml,.musicxml,.mxl,.mid,.midi"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <CloudUploadIcon sx={{ fontSize: 40, color: uploadFile ? 'primary.main' : 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {uploadFile ? uploadFile.name : 'Haz clic para seleccionar un archivo'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Formatos aceptados: MusicXML, MIDI
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="primary"
              disabled={!uploadFile || loading}
              onClick={handleFileUpload}
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />
              }
              fullWidth
              sx={{ py: 1.2 }}
            >
              Procesar y Extraer Firma 6D
            </Button>
            {uploadResult && (
              <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
                Firma extraída con éxito para el perfil <strong>"{uploadResult.name}"</strong> con {Object.values(uploadResult.dimensions).flat().length} atributos.
              </Alert>
            )}
          </Paper>

          {/* Dimension details list */}
          {selectedArrangers.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 2.5 }}>
                Detalles del Perfil
              </Typography>
              {selectedArrangers.map(renderDimensionDetail)}
            </Box>
          )}
        </Grid>

        {/* ── Right: Visualization ── */}
        <Grid item xs={12} md={7}>
          {selectedArrangers.length > 0 ? (
            <Paper sx={{ p: 4, bgcolor: 'rgba(18, 20, 32, 0.55)', borderColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 3 }}>
                Gráfico de Firma Hexadimensional (6D)
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={buildRadarData()}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                  />
                  <PolarRadiusAxis stroke="rgba(255,255,255,0.1)" angle={30} domain={[0, 'auto']} />
                  {selectedArrangers.map((a, idx) => (
                    <Radar
                      key={a.id}
                      name={a.name}
                      dataKey={a.name}
                      stroke={DIMENSION_COLORS[idx % DIMENSION_COLORS.length]}
                      fill={DIMENSION_COLORS[idx % DIMENSION_COLORS.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <RTooltip />
                </RadarChart>
              </ResponsiveContainer>

              {/* Comparison */}
              {renderComparison()}
            </Paper>
          ) : (
            <Paper
              sx={{
                p: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 450,
                bgcolor: 'rgba(18, 20, 32, 0.25)',
                borderColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 3,
                textAlign: 'center'
              }}
            >
              <AutoGraphIcon sx={{ fontSize: 70, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
              <Typography variant="h3" sx={{ fontSize: '1.2rem', fontWeight: 700, mb: 1 }}>
                Visualización de Firma Estilística
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                Selecciona uno o más arreglistas en el panel de control para renderizar el gráfico radar comparativo.
              </Typography>
            </Paper>
          )}

          {/* LLM Analysis result */}
          {analysisResult && (
            <Paper sx={{ p: 4, mt: 3, bgcolor: 'rgba(197, 160, 89, 0.03)', borderColor: 'rgba(197, 160, 89, 0.1)', borderRadius: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.2rem', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>🤖</span> Análisis Estilístico RAG
              </Typography>
              <Divider sx={{ mb: 2.5, borderColor: 'rgba(197, 160, 89, 0.1)' }} />
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem', color: 'text.primary' }}
              >
                {analysisResult}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
