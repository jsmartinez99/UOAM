import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container, Avatar, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="sticky" 
        sx={{ 
          backdropFilter: 'blur(20px)',
          background: 'rgba(10, 11, 16, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ height: 70, justifyContent: 'space-between' }}>
            <Box 
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                <GraphicEqIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography 
                variant="h6" 
                noWrap 
                sx={{ 
                  fontFamily: 'Outfit',
                  fontWeight: 800,
                  letterSpacing: '.05rem',
                  color: 'text.primary',
                  fontSize: '1.25rem'
                }}
              >
                UOAM <span style={{ color: '#c5a059' }}>Arranger</span>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {user && (
                <>
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/catalog')}
                    sx={{ 
                      color: isActive('/catalog') ? 'primary.main' : 'text.secondary',
                      borderBottom: isActive('/catalog') ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                      borderRadius: 0,
                      px: 2,
                      py: 1,
                      height: 48
                    }}
                  >
                    Catálogo
                  </Button>
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/hybridize')}
                    sx={{ 
                      color: isActive('/hybridize') ? 'primary.main' : 'text.secondary',
                      borderBottom: isActive('/hybridize') ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                      borderRadius: 0,
                      px: 2,
                      py: 1,
                      height: 48
                    }}
                  >
                    Hibridar
                  </Button>
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/analyze')}
                    sx={{ 
                      color: isActive('/analyze') ? 'primary.main' : 'text.secondary',
                      borderBottom: isActive('/analyze') ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                      borderRadius: 0,
                      px: 2,
                      py: 1,
                      height: 48
                    }}
                  >
                    Analizar
                  </Button>
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {user ? (
                <>
                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {user.email}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
                      {user.role}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main', color: 'background.default', width: 36, height: 36, fontWeight: 700, fontSize: '0.9rem' }}>
                    {(user.email || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    size="small"
                    onClick={() => { logout(); navigate('/'); }}
                    sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary', py: 0.5 }}
                  >
                    Salir
                  </Button>
                </>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/login')}
                  sx={{ px: 3 }}
                >
                  Entrar
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        {children}
      </Box>
    </Box>
  );
}
