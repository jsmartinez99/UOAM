import axios from 'axios';
import { ArrangerProfile, Dimensions6D } from '../../domain/arranger-profile.js';
import { HybridResult, SearchResult, AnalysisReport } from '../../types/api-types.js';

// ─── Configuración de Axios ─────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  timeout: 30000, // Longer timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptores ─────────────────────────────────────────────────

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ─── Servicios de API ─────────────────────────────────────────────

export const apiService = {
  // ── Arreglistas ──

  async getArrangers(page?: number, limit?: number): Promise<any> {
    if (page !== undefined || limit !== undefined) {
      const response = await api.get('/arrangers', {
        params: { page, limit },
      });
      return response.data;
    }
    const response = await api.get('/arrangers', {
      params: { page: 1, limit: 100 },
    });
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  async createArranger(
    name: string,
    dimensions: Dimensions6D,
  ): Promise<ArrangerProfile> {
    const response = await api.post('/arrangers', { name, dimensions });
    return response.data as ArrangerProfile;
  },

  // ── Hibridación ──

  async hybridizeProfiles(profileIds: string[]): Promise<HybridResult> {
    const response = await api.post('/hybridize', { profileIds });
    return response.data as HybridResult;
  },

  // ── Búsqueda semántica ──

  async searchSimilar(vector: number[]): Promise<SearchResult[]> {
    const response = await api.post('/search', { vector });
    return response.data as SearchResult[];
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
    return response.data as AnalysisReport;
  },

  // ── Subida de archivos ──

  async uploadArrangement(file: File): Promise<ArrangerProfile> {
    const formData = new FormData();
    formData.append('musicFile', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as ArrangerProfile;
  },

  // ── Generación autónoma de arreglos en 5 secciones ──

  async generateArrangement(options: {
    title?: string;
    keyCenter?: string;
    tempoBpm?: number;
    timeSignature?: string;
    profileId?: string;
    dimensionsOverride?: Record<string, string[]>;
  }): Promise<any> {
    const response = await api.post('/arrangements/generate', options);
    return response.data;
  },

  async exportMusicXML(arrangement: any): Promise<Blob> {
    const response = await api.post('/arrangements/export/xml', arrangement, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ── Autenticación ──

   async register(
     email: string,
     password: string,
     role: 'STANDARD' | 'ARRANGER' | 'ADMIN' = 'STANDARD',
   ): Promise<{ id: string; email: string; role: string }> {
     const response = await api.post('/auth/register', { email, password, role });
     return response.data as { id: string; email: string; role: string };
   },

  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; role: string } }> {
    const response = await api.post('/auth/login', { email, password });
    return response.data as { token: string; user: { id: string; email: string; role: string } };
  },
};
