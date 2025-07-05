import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const certificateAPI = {
  // Generate a new certificate
  generateCertificate: async (certificateData) => {
    try {
      const response = await api.post('/certificates', certificateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify a certificate by DOF number
  verifyCertificate: async (dofNo) => {
    try {
      const response = await api.get(`/certificates/verify/${dofNo}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get certificate by ID
  getCertificate: async (id) => {
    try {
      const response = await api.get(`/certificates/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all certificates with pagination
  getCertificates: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/certificates?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Deactivate a certificate
  deactivateCertificate: async (id) => {
    try {
      const response = await api.delete(`/certificates/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default api;
