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
  Container,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InsightsIcon from '@mui/icons-material/Insights';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { apiService } from '../services/apiService';

// ─── Componentes de UI reutilizables ────────────────────────────────

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(18, 20, 32, 0.55)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: theme.shape.borderRadius * 1.5,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #c5a059 0%, #00C49F 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(197, 160, 89, 0.25)',
    '&::before': {
      opacity: 1,
    }
  },
}));

const DimensionChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
  backgroundColor: 'rgba(197, 160, 89, 0.1)',
  color: '#e1c28f',
  border: '1px solid rgba(197, 160, 89, 0.15)',
  fontSize: '0.68rem',
  fontWeight: 500,
  height: 22,
  '&:hover': {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
  }
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

const DIMENSION_KEYS = ['organology', 'harmony', 'counterpoint', 'texture', 'rhythm', 'taste'] as const;

const ARRANGER_FLAGS: Record<string, string> = {
  'Carlos Centurión': '🇵🇾',
  'Astor Piazzolla': '🇦🇷',
  'Claus Ogerman': '🇩🇪',
  'Nelson Riddle': '🇺🇸',
  'Quincy Jones': '🇺🇸',
  'Duke Ellington': '🇺🇸',
  'Billy Strayhorn': '🇺🇸',
  'Gil Evans': '🇨🇦',
  'Henry Mancini': '🇺🇸',
  'Sammy Nestico': '🇺🇸',
  'Thad Jones': '🇺🇸',
  'Clare Fischer': '🇺🇸',
  'Maria Schneider': '🇺🇸',
};

// ─── Componente principal ──────────────────────────────────────────

export default function ArrangerCatalog() {
  const [arrangers, setArrangers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchArrangers = async () => {
      try {
        setLoading(true);
        const response = await apiService.getArrangers(page, limit);
        if (response && response.data) {
          setArrangers(response.data);
          setTotal(response.total);
          setTotalPages(response.totalPages);
        } else {
          setArrangers(response || []);
          setTotal(response?.length || 0);
          setTotalPages(1);
        }
        setError(null);
      } catch (err) {
        setError('Error al cargar los arreglistas');
      } finally {
        setLoading(false);
      }
    };

    fetchArrangers();
  }, [page, limit]);

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={50} color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        </Snackbar>
      )}

      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h1" gutterBottom>
              Catálogo de Arreglistas
            </Typography>
            <Typography color="text.secondary">
              Explora los perfiles y firmas estilísticas en el ecosistema musical.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterListIcon />}
            >
              Filtros
            </Button>
          </Box>
        </Box>

        {/* Search bar */}
        <TextField
          fullWidth
          placeholder="Buscar arreglistas por nombre..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 600,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(18, 20, 32, 0.4)',
            }
          }}
        />
      </Box>

      {/* Advanced filters */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'rgba(18, 20, 32, 0.3)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filtrar por Dimensión Activa:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {DIMENSION_KEYS.map((dim) => (
              <Chip
                key={dim}
                label={`${DIMENSION_ICONS[dim]} ${DIMENSION_LABELS[dim]}`}
                onClick={() => toggleDimension(dim)}
                clickable
                variant={selectedDimensions.includes(dim) ? 'filled' : 'outlined'}
                color={selectedDimensions.includes(dim) ? 'primary' : 'default'}
                sx={{ px: 1 }}
              />
            ))}
          </Box>
          {selectedDimensions.length > 0 && (
            <Button
              size="small"
              color="primary"
              variant="text"
              onClick={() => setSelectedDimensions([])}
              sx={{ mt: 2 }}
            >
              Limpiar filtros
            </Button>
          )}
        </Paper>
      )}

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
        Mostrando {filteredArrangers.length} de {total} perfiles de arreglistas
      </Typography>

      {/* Grid */}
      <Grid container spacing={3}>
        {filteredArrangers.map((arranger) => (
          <Grid item xs={12} sm={6} md={4} key={arranger.id}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{ARRANGER_FLAGS[arranger.name] || '🎼'}</span> {arranger.name}
                  </Typography>
                  <Chip
                    label={`${totalAttributes(arranger)} atributos`}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }}
                  />
                </Box>

                {/* All 6 dimensions */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {DIMENSION_KEYS.map((dim) => {
                    const values = arranger.dimensions[dim] || [];
                    if (values.length === 0) return null;
                    return (
                      <Box key={dim}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontWeight: 600, fontSize: '0.7rem' }}
                        >
                          <span>{DIMENSION_ICONS[dim]}</span>
                          <span>{DIMENSION_LABELS[dim]}</span>
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {values.slice(0, 3).map((v: string, i: number) => (
                            <DimensionChip key={i} label={v} />
                          ))}
                          {values.length > 3 && (
                            <Chip
                              size="small"
                              label={`+${values.length - 3}`}
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.65rem', 
                                height: 22, 
                                borderColor: 'rgba(255,255,255,0.05)',
                                color: 'text.secondary' 
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>

              <CardActions sx={{ mt: 'auto', p: 3, pt: 1, borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 1.5 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => handleHybridize(arranger.id)}
                  startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                  fullWidth
                >
                  Hibridar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAnalyze(arranger.id)}
                  startIcon={<InsightsIcon sx={{ fontSize: 16 }} />}
                  fullWidth
                >
                  Analizar
                </Button>
              </CardActions>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 5, gap: 2 }}>
          <Button
            variant="outlined"
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.primary', '&:hover': { borderColor: 'primary.main' } }}
          >
            Anterior
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Página {page} de {totalPages}
          </Typography>
          <Button
            variant="outlined"
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.primary', '&:hover': { borderColor: 'primary.main' } }}
          >
            Siguiente
          </Button>
        </Box>
      )}

      {filteredArrangers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No se encontraron arreglistas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Intenta usando otros términos en la búsqueda o limpiando los filtros seleccionados.
          </Typography>
        </Box>
      )}
    </Container>
  );
}