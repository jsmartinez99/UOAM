import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert, InputAdornment, IconButton, Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { apiService } from '../services/apiService';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOpenIcon from '@mui/icons-material/LockOpen';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiService.login(email, password);
      login(data.token, data.user);
      navigate('/catalog');
    } catch (err: any) {
      console.error('Login failed', err);
      setError(err.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '75vh',
        }}
      >
        <Paper 
          elevation={0}
          component="form"
          onSubmit={handleLogin}
          sx={{ 
            p: 5, 
            width: '100%',
            background: 'rgba(18, 20, 32, 0.65)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(197, 160, 89, 0.1)', color: 'primary.main', mb: 2 }}>
              <LockOpenIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h2" sx={{ fontFamily: 'Outfit', fontWeight: 800, mb: 1 }}>
              Iniciar Sesión
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Accede al Catálogo de Arreglos y Herramientas del Sistema
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Correo electrónico"
            type="email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(10, 11, 16, 0.4)',
              }
            }}
          />
          <TextField
            fullWidth
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: 'text.secondary' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(10, 11, 16, 0.4)',
              }
            }}
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            size="large"
            sx={{ 
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 700,
              mt: 1
            }}
          >
            {loading ? 'Autenticando...' : 'Iniciar Sesión'}
          </Button>

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              ¿No tienes cuenta? Regístrate en el sistema o usa las credenciales de demo:
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'primary.main', fontWeight: 600 }}>
              admin@uoam.com / Admin@1234
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
