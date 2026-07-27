import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ArrangerCatalog from './pages/ArrangerCatalog';
import HybridizationTool from './pages/HybridizationTool';
import AnalysisTool from './pages/AnalysisTool';
import StandaloneArrangerPage from './pages/StandaloneArrangerPage';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

// ─── Tema de Material UI ───────────────────────────────────────────

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#c5a059', // Brass / Gold
      light: '#e1c28f',
      dark: '#93722e',
      contrastText: '#0a0b10',
    },
    secondary: {
      main: '#00C49F', // Waveform Teal
      light: '#33d0b2',
      dark: '#008c6f',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0b10', // Obsidian
      paper: '#121420',   // Deep Slate
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#9ca3af',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(197, 160, 89, 0.25)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a0b10',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'none',
        },
      },
    },
  },
});

// ─── Aplicación principal ─────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route element={<PrivateRoute />}>
                <Route path="/catalog" element={<ArrangerCatalog />} />
                <Route path="/hybridize" element={<HybridizationTool />} />
                <Route path="/generate" element={<StandaloneArrangerPage />} />
                <Route path="/analyze" element={<AnalysisTool />} />
              </Route>
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
