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
    // Um token inválido não pode deixar a interface em estado de login aparente.
    if (error.response?.status === 401 && localStorage.getItem('authToken') &&
        !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('authChange'));
    }
    return Promise.reject(error);
  }
);


// --- Portal público e proteção de dados ---
export const publicoAPI = {
  listVeiculos: () => api.get('/publico/veiculos').then(res => res.data),
  solicitar: (data) => api.post('/publico/solicitacoes', data).then(res => res.data),
  privacidade: () => api.get('/publico/politica-privacidade').then(res => res.data),
  termos: () => api.get('/publico/termos-uso').then(res => res.data),
};

export const solicitacoesAPI = {
  list: (params = {}) => api.get('/solicitacoes', { params }).then(res => res.data),
  aprovar: (id) => api.put(`/solicitacoes/${id}/aprovar`).then(res => res.data),
  recusar: (id) => api.put(`/solicitacoes/${id}/recusar`).then(res => res.data),
  excluirDados: (id) => api.delete(`/solicitacoes/${id}/dados`).then(res => res.data),
};

export const integracoesAPI = {
  ufs: () => api.get('/integracoes/ufs').then(res => res.data),
};

export const auditoriaAPI = {
  list: () => api.get('/auditoria').then(res => res.data),
};

// --- Dashboard ---
export const dashboardAPI = {
  get: () => api.get('/dashboard').then(res => res.data),
};

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
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  delete: (id) => api.delete(`/usuarios/${id}`),
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