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

export interface Arranger {
  id: string;
  name: string;
  dimensions: Record<string, string[]>;
}

export interface User {
  id: string;
  email: string;
  role: 'STANDARD' | 'ARRANGER' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface HybridizeRequest {
  sourceIds: string[];
  weights?: number[];
}

export interface HybridizeResult {
  dimensions: Record<string, string[]>;
  conflicts: string[];
  resolutionLog: string[];
}

export interface GenerateArrangementRequest {
  title?: string;
  keyCenter?: string;
  tempoBpm?: number;
  timeSignature?: string;
  profileId?: string;
  dimensionsOverride?: Record<string, string[]>;
}

export const apiService = {
  // ── Arreglistas ──

  async getArrangers(page?: number, limit?: number): Promise<{ arrangers: Arranger[]; total: number }> {
    if (page !== undefined || limit !== undefined) {
      const response = await api.get('/arrangers', {
        params: { page, limit },
      });
      return response.data;
    }
    const response = await api.get('/arrangers');
    return response.data;
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
  }): Promise<Record<string, unknown>> {
    const response = await api.post('/arrangements/generate', options);
    return response.data;
  },

  async exportMusicXML(arrangement: Record<string, unknown>): Promise<Blob> {
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
   ): Promise<User> {
     const response = await api.post('/auth/register', { email, password, role });
     return response.data as User;
   },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data as AuthResponse;
  },
};
