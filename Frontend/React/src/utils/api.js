import axios from 'axios';

// For combined deployment, API is served from the same domain
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : `${window.location.origin}/api`
);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const certificateAPI = {
  // Verify certificate by reference number
  verify: async (refNo) => {
    const response = await api.get(`/certificates/verify/${refNo}`);
    return response.data;
  },

  // Search certificates
  search: async (query) => {
    const response = await api.get('/certificates', {
      params: { search: query }
    });
    return response.data;
  },

  // Get verification statistics
  getStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Submit form data
  submitForm: async (formData) => {
    const response = await api.post('/forms/submit', formData);
    return response.data;
  },

  // Get certificate image/file
  getCertificateFile: async (type, id) => {
    const response = await api.get(`/certificates/file/${type}/${id}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default api;
