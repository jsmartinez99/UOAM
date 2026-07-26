import axios from 'axios';
// ─── Configuración de Axios ─────────────────────────────────────────
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
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
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
// ─── Servicios de API ─────────────────────────────────────────────
export const apiService = {
    // ── Arreglistas ──
    async getArrangers() {
        const response = await api.get('/arrangers');
        return response.data;
    },
    async createArranger(name, dimensions) {
        const response = await api.post('/arrangers', { name, dimensions });
        return response.data;
    },
    // ── Hibridación ──
    async hybridizeProfiles(profileIds) {
        const response = await api.post('/hybridize', { profileIds });
        return response.data;
    },
    // ── Búsqueda semántica ──
    async searchSimilar(vector) {
        const response = await api.post('/search', { vector });
        return response.data;
    },
    // ── Análisis LLM ──
    async generateAnalysis(context) {
        const response = await api.post('/analyze', { context });
        return response.data;
    },
    // ── Subida de archivos ──
    async uploadArrangement(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    // ── Autenticación ──
    async register(email, password, role = 'STANDARD') {
        const response = await api.post('/auth/register', { email, password, role });
        return response.data;
    },
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
};
//# sourceMappingURL=apiService.js.map