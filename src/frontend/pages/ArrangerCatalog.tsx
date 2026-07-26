import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { DIMENSION_KEYS } from '../../domain/arranger-profile';

// ─── Componentes de UI reutilizables ────────────────────────────────

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
  },
}));

const DimensionChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  fontSize: '0.7rem',
  height: 24,
}));

const DIMENSION_LABELS: Record<string, string> = {
  organology: 'Organología',
  harmony: 'Armonía',
  counterpoint: 'Contrapunto',
  texture: 'Textura',
  rhythm: 'Ritmo',
  taste: 'Gusto',
};

const DIMENSION_ICONS: Record<string, string> = {
  organology: '🎺',
  harmony: '🎵',
  counterpoint: '🎼',
  texture: '🎨',
  rhythm: '🥁',
  taste: '✨',
};

// ─── Componente principal ──────────────────────────────────────────

export default function ArrangerCatalog() {
  const [arrangers, setArrangers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchArrangers = async () => {
      try {
        setLoading(true);
        const data = await apiService.getArrangers();
        setArrangers(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los arreglistas');
      } finally {
        setLoading(false);
      }
    };

    fetchArrangers();
  }, []);

  const filteredArrangers = useMemo(() => {
    return arrangers.filter((arranger) => {
      const matchesSearch = arranger.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDimensions = selectedDimensions.length === 0 || 
        selectedDimensions.every((dim) => 
          arranger.dimensions[dim]?.length > 0
        );
      return matchesSearch && matchesDimensions;
    });
  }, [arrangers, searchTerm, selectedDimensions]);

  const handleHybridize = (id: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/hybridize?profile=${id}`);
  };

  const handleAnalyze = (id: string) => {
    navigate(`/analyze?profile=${id}`);
  };

  const toggleDimension = (dim: string) => {
    setSelectedDimensions((prev) =>
      prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim]
    );
  };

  const totalAttributes = (arranger: any) =>
    Object.values(arranger.dimensions).flat().length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h2" gutterBottom component="h1">
          Catálogo de Arreglistas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Filtros avanzados">
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Search bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Buscar arreglistas por nombre..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      {/* Advanced filters */}
      {showFilters && (
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              <FilterListIcon sx={{ mr: 1 }} /> Filtros por Dimensión
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DIMENSION_KEYS.map((dim) => (
                <Tooltip key={dim} title={DIMENSION_LABELS[dim]}>
                  <Chip
                    label={`${DIMENSION_ICONS[dim]} ${DIMENSION_LABELS[dim]}`}
                    onClick={() => toggleDimension(dim)}
                    clickable
                    variant={selectedDimensions.includes(dim) ? 'filled' : 'outlined'}
                    color={selectedDimensions.includes(dim) ? 'primary' : 'default'}
                    size="small"
                  />
                </Tooltip>
              ))}
            </Box>
            {selectedDimensions.length > 0 && (
              <Button
                size="small"
                color="secondary"
                variant="text"
                onClick={() => setSelectedDimensions([])}
                sx={{ mt: 1 }}
              >
                Limpiar filtros
              </Button>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {filteredArrangers.length} de {arrangers.length} arreglistas
      </Typography>

      {/* Grid */}
      <Grid container spacing={4}>
        {filteredArrangers.map((arranger) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={arranger.id}>
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {arranger.name}
                  </Typography>
                  <Chip
                    label={`${totalAttributes(arranger)} attrs`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </Box>

                {/* All 6 dimensions in expandable sections */}
                {DIMENSION_KEYS.map((dim) => {
                  const values = arranger.dimensions[dim] || [];
                  if (values.length === 0) return null;
                  return (
                    <Box key={dim} sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        {DIMENSION_ICONS[dim]} {DIMENSION_LABELS[dim]} ({values.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {values.slice(0, 4).map((v: string, i: number) => (
                          <DimensionChip key={i} label={v} />
                        ))}
                        {values.length > 4 && (
                          <Chip
                            size="small"
                            label={`+${values.length - 4} más`}
                            variant="outlined"
                            color="default"
                          />
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </CardContent>

              <CardActions sx={{ mt: 'auto', p: 2, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleHybridize(arranger.id)}
                  disabled={!user}
                  startIcon={!user ? <Tooltip title="Inicia sesión para hibridar">🔒</Tooltip> : null}
                >
                  Hibridar
                </Button>
                <Button
                  size="small"
                  onClick={() => handleAnalyze(arranger.id)}
                  startIcon="🔍"
                >
                  Analizar
                </Button>
              </CardActions>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      {filteredArrangers.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No se encontraron arreglistas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'El catálogo está vacío. Sube un arreglo para empezar.'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}