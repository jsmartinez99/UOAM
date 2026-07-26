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
  Slider,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
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
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00C49F',
  '#FF6384',
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
      .then((data: any) => setArrangers(data))
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
        confidence: 0.85,
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
      // Refresh arranger list
      const data: any = await apiService.getArrangers();
      setArrangers(data);
    } catch {
      setError('Error procesando archivo. Formatos aceptados: MusicXML, MIDI');
    } finally {
      setLoading(false);
    }
  };

  // ── Dimension detail table ──
  const renderDimensionDetail = (arranger: ArrangerData) => (
    <Card key={arranger.id} sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {arranger.name}
        </Typography>
        <Grid container spacing={1}>
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
            const values =
              arranger.dimensions[key as keyof typeof arranger.dimensions] || [];
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={key}>
                <Typography variant="subtitle2" color="text.secondary">
                  {label} ({values.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {values.map((v, i) => (
                    <Chip
                      key={i}
                      label={v}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
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
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          <CompareArrowsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Comparación: {a.name} vs {b.name}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Dimensiones compartidas: {shared.length}/6
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {shared.map((k) => (
            <Chip key={k} label={DIMENSION_LABELS[k]} color="success" />
          ))}
          {keys
            .filter((k) => !shared.includes(k))
            .map((k) => (
              <Chip
                key={k}
                label={DIMENSION_LABELS[k]}
                variant="outlined"
                color="default"
              />
            ))}
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        <AutoGraphIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Herramienta de Análisis 6D
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Visualiza, compara y analiza firmas hexadimensionales de arreglistas.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Left: Controls ── */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Arranger selector */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Seleccionar Arreglistas
            </Typography>
            {loading ? (
              <CircularProgress size={24} />
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
                    size="small"
                  />
                )}
                renderTags={(val, getTagProps) =>
                  val.map((opt, idx) => (
                    <Chip
                      {...getTagProps({ index: idx })}
                      key={opt.id}
                      label={opt.name}
                      sx={{
                        bgcolor:
                          DIMENSION_COLORS[idx % DIMENSION_COLORS.length] +
                          '33',
                      }}
                    />
                  ))
                }
              />
            )}
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              disabled={selectedArrangers.length === 0 || analysisLoading}
              onClick={handleAnalysis}
              startIcon={
                analysisLoading ? (
                  <CircularProgress size={16} />
                ) : (
                  <AutoGraphIcon />
                )
              }
              fullWidth
            >
              {analysisLoading ? 'Analizando...' : 'Generar Análisis LLM'}
            </Button>
          </Paper>

          {/* File upload */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <UploadFileIcon sx={{ mr: 1 }} />
              <Typography>Subir Arreglo (MusicXML / MIDI)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="outlined" component="label" fullWidth>
                  {uploadFile ? uploadFile.name : 'Seleccionar archivo...'}
                  <input
                    type="file"
                    hidden
                    accept=".xml,.musicxml,.mxl,.mid,.midi"
                    onChange={(e) =>
                      setUploadFile(e.target.files?.[0] || null)
                    }
                  />
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={!uploadFile || loading}
                  onClick={handleFileUpload}
                  startIcon={
                    loading ? <CircularProgress size={16} /> : <UploadFileIcon />
                  }
                  fullWidth
                >
                  Analizar Archivo
                </Button>
                {uploadResult && (
                  <Alert severity="success">
                    Perfil "{uploadResult.name}" creado con{' '}
                    {Object.values(uploadResult.dimensions).flat().length}{' '}
                    atributos detectados.
                  </Alert>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Dimension detail */}
          {selectedArrangers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Detalle de Dimensiones
              </Typography>
              {selectedArrangers.map(renderDimensionDetail)}
            </Box>
          )}
        </Grid>

        {/* ── Right: Visualization ── */}
        <Grid size={{ xs: 12, md: 7 }}>
          {selectedArrangers.length > 0 ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Firma 6D — Gráfico Radar
              </Typography>
              <ResponsiveContainer width="100%" height={420}>
                <RadarChart data={buildRadarData()}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="label"
                    tick={{ fontSize: 13, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                  {selectedArrangers.map((a, idx) => (
                    <Radar
                      key={a.id}
                      name={a.name}
                      dataKey={a.name}
                      stroke={DIMENSION_COLORS[idx % DIMENSION_COLORS.length]}
                      fill={DIMENSION_COLORS[idx % DIMENSION_COLORS.length]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
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
                minHeight: 420,
                bgcolor: 'grey.50',
              }}
            >
              <AutoGraphIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Selecciona arreglistas para visualizar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                El gráfico radar mostrará la firma 6D de cada arreglista
                seleccionado.
              </Typography>
            </Paper>
          )}

          {/* LLM Analysis result */}
          {analysisResult && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Análisis Generado (LLM)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}
              >
                {analysisResult}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
