import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

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
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
}));

// ─── Componente principal ─────────────────────────────────────────

export default function ArrangerCatalog() {
  const [arrangers, setArrangers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      } catch (err) {
        setError('Error al cargar los arreglistas');
      } finally {
        setLoading(false);
      }
    };

    fetchArrangers();
  }, []);

  const filteredArrangers = arrangers.filter((arranger) =>
    arranger.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleHybridize = (id) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/hybridize?profile=${id}`);
  };

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
      <Typography variant="h2" gutterBottom component="h1">
        Catálogo de Arreglistas
      </Typography>

      <TextField
        fullWidth
        label="Buscar arreglistas"
        variant="outlined"
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
      />

      <Grid container spacing={4}>
        {filteredArrangers.map((arranger) => (
          <Grid item xs={12} sm={6} md={4} key={arranger.id}> 
            <StyledCard>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {arranger.name}
                </Typography>

                <Box sx={{ mb: 2 }}> 
                  <Typography variant="subtitle1" gutterBottom>
                    Organología:
                  </Typography>
                  <Box display="flex" flexWrap="wrap">
                    {arranger.dimensions.organology.map((item, index) => (
                      <DimensionChip key={index} label={item} />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}> 
                  <Typography variant="subtitle1" gutterBottom>
                    Armonía:
                  </Typography>
                  <Box display="flex" flexWrap="wrap">
                    {arranger.dimensions.harmony.map((item, index) => (
                      <DimensionChip key={index} label={item} />
                    ))}
                  </Box>
                </Box>

                {/* Más dimensiones... */}
              </CardContent>

              <CardActions sx={{ mt: 'auto', p: 2 }}> 
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleHybridize(arranger.id)}
                  disabled={!user}
                >
                  Hibridar
                </Button>
                <Button size="small">Analizar</Button>
              </CardActions>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
