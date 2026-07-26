import axios from 'axios';
import { ArrangerProfile, Dimensions6D } from '../domain/arranger-profile';
import { HybridResult, SearchResult, AnalysisReport } from '../types/api-types';

// ─── Configuración de Axios ─────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptores ─────────────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Manejar token expirado
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ─── Servicios de API ─────────────────────────────────────────────

export const apiService = {
  // ── Arreglistas ──

  async getArrangers(): Promise<ArrangerProfile[]> {
    const response = await api.get('/arrangers');
    return response.data;
  },

  async createArranger(
    name: string,
    dimensions: Dimensions6D,
  ): Promise<ArrangerProfile> {
    const response = await api.post('/arrangers', { name, dimensions });
    return response.data;
  },

  // ── Hibridación ──

  async hybridizeProfiles(profileIds: string[]): Promise<HybridResult> {
    const response = await api.post('/hybridize', { profileIds });
    return response.data;
  },

  // ── Búsqueda semántica ──

  async searchSimilar(vector: number[]): Promise<SearchResult[]> {
    const response = await api.post('/search', { vector });
    return response.data;
  },

  // ── Análisis LLM ──

  async generateAnalysis(
    context: {
      arranger: string;
      confidence: number;
      matchedDimension: string;
    },
  ): Promise<AnalysisReport> {
    const response = await api.post('/analyze', { context });
    return response.data;
  },

  // ── Autenticación ──

  async register(
    email: string,
    password: string,
    role: 'STANDARD' | 'ARRANGER' | 'ADMIN',
  ): Promise<{ id: string; email: string; role: string }> {
    const response = await api.post('/auth/register', { email, password, role });
    return response.data;
  },

  async login(email: string, password: string): Promise<{ token: string }> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};
