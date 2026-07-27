import React from 'react';
import { Box, Typography, Button, Grid, Paper, Container } from '@mui/material';
import { useNavigate } from 'react-router';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import SecurityIcon from '@mui/icons-material/Security';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 10,
          position: 'relative',
          py: 6,
          px: 4,
          borderRadius: 4,
          background: 'radial-gradient(circle at 50% 30%, rgba(197, 160, 89, 0.08) 0%, transparent 60%)',
        }}
      >
        <Typography 
          variant="h1" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '3rem', md: '4rem' },
            background: 'linear-gradient(135deg, #f3f4f6 30%, #c5a059 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            mb: 2
          }}
        >
          Ecosistema Híbrido de Arreglos Musicales
        </Typography>
        <Typography 
          variant="h5" 
          color="text.secondary" 
          paragraph
          sx={{ maxWidth: 800, mx: 'auto', mb: 5, lineHeight: 1.6 }}
        >
          Audita influencias estilísticas, analiza partituras y genera perfiles de orquestación híbridos a partir de firmas hexadimensionales avanzadas basadas en IA.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            onClick={() => navigate('/catalog')}
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Ver Catálogo de Arreglistas
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            size="large" 
            onClick={() => navigate('/login')}
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Iniciar Sesión
          </Button>
        </Box>
      </Box>

      {/* Feature Cards Grid */}
      <Typography variant="h2" align="center" gutterBottom sx={{ mb: 6, fontWeight: 700 }}>
        Características del Sistema
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              height: '100%', 
              background: 'rgba(18, 20, 32, 0.6)', 
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'transform 0.3s ease, border-color 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                borderColor: 'rgba(197, 160, 89, 0.3)',
              }
            }}
          >
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(197, 160, 89, 0.1)', color: 'primary.main', mb: 3 }}>
              <MusicNoteIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h3" gutterBottom sx={{ fontSize: '1.4rem', fontWeight: 700 }}>
              Firma Hexadimensional (6D)
            </Typography>
            <Typography color="text.secondary">
              Cada perfil de arreglista es modelado técnicamente a través de 6 dimensiones fundamentales: Organología, Armonía, Contrapunto, Textura, Rítmica y Gusto.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              height: '100%', 
              background: 'rgba(18, 20, 32, 0.6)', 
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'transform 0.3s ease, border-color 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                borderColor: 'rgba(197, 160, 89, 0.3)',
              }
            }}
          >
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(0, 196, 159, 0.1)', color: 'secondary.main', mb: 3 }}>
              <AutoAwesomeIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h3" gutterBottom sx={{ fontSize: '1.4rem', fontWeight: 700 }}>
              Motor de Hibridación AST
            </Typography>
            <Typography color="text.secondary">
              Combina las dimensiones estilísticas de múltiples maestros. El motor utiliza un AST musical para resolver colisiones tímbricas y tesituras instrumentales complejas.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              height: '100%', 
              background: 'rgba(18, 20, 32, 0.6)', 
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'transform 0.3s ease, border-color 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                borderColor: 'rgba(197, 160, 89, 0.3)',
              }
            }}
          >
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(197, 160, 89, 0.1)', color: 'primary.main', mb: 3 }}>
              <EqualizerIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h3" gutterBottom sx={{ fontSize: '1.4rem', fontWeight: 700 }}>
              Búsqueda Vectorial y RAG
            </Typography>
            <Typography color="text.secondary">
              Indexa perfiles en Qdrant para búsquedas de afinidad por K-Vecinos más cercanos. Genera reportes teóricos mediante pipelines de LLM basados en RAG controlado.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Security note / seed data info */}
      <Box sx={{ mt: 10, textAlign: 'center' }}>
        <Paper 
          sx={{ 
            p: 3, 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 2,
            background: 'rgba(18, 20, 32, 0.3)',
            borderColor: 'rgba(255, 255, 255, 0.03)'
          }}
        >
          <SecurityIcon color="primary" />
          <Typography variant="body2" color="text.secondary">
            Credenciales de Auditoría / Demo: <strong>admin@uoam.com</strong> / <strong>Admin@1234</strong>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
