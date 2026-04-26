import axios from 'axios';

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({ baseURL: BASE });

// Request interceptor - inject JWT token from localStorage if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Veículos ---
export const veiculosAPI = {
  list: (params = {}) => api.get('/veiculos', { params }).then(res => res.data),
  get: (id) => api.get(`/veiculos/${id}`),
  create: (data) => api.post('/veiculos', data),
  update: (id, data) => api.put(`/veiculos/${id}`, data),
  delete: (id) => api.delete(`/veiculos/${id}`),
};

// --- Usuários ---
export const usuariosAPI = {
  list: (params = {}) => api.get('/usuarios', { params }).then(res => res.data),
  create: (data) => api.post('/usuarios', data),
};

// --- Clientes ---
export const clientesAPI = {
  list: (params = {}) => api.get('/clientes', { params }).then(res => res.data),
  get: (id) => api.get(`/clientes/${id}`),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  delete: (id) => api.delete(`/clientes/${id}`),
};

// --- Aluguéis ---
export const alugueisAPI = {
  list: (params = {}) => api.get('/alugueis', { params }).then(res => res.data),
  get: (id) => api.get(`/alugueis/${id}`),
  create: (data) => api.post('/alugueis', data),
  update: (id, data) => api.put(`/alugueis/${id}`, data),
  delete: (id) => api.delete(`/alugueis/${id}`),
  updateStatus: (id, data) => api.put(`/alugueis/${id}/status`, data),
  finalizar: (id, data) => api.put(`/alugueis/${id}/finalizar`, data),
};

export { api };
export default api;