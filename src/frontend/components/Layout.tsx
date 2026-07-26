import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            UOAM Arranger
          </Typography>
          <Button color="inherit" onClick={() => navigate('/catalog')}>Catálogo</Button>
          {user ? (
            <>
              <Button color="inherit" onClick={() => navigate('/hybridize')}>Hibridar</Button>
              <Button color="inherit" onClick={() => navigate('/analyze')}>Analizar</Button>
              <Button color="inherit" onClick={() => { logout(); navigate('/'); }}>Salir</Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>Entrar</Button>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
