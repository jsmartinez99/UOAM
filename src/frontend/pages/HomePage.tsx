import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h2" gutterBottom>
        Bienvenido a UOAM Arranger Ecosystem
      </Typography>
      <Typography variant="h5" color="textSecondary" paragraph>
        Explora, analiza e hibrida perfiles de arreglistas musicales.
      </Typography>
      <Button variant="contained" color="primary" size="large" onClick={() => navigate('/catalog')}>
        Ver Catálogo
      </Button>
    </Box>
  );
}
