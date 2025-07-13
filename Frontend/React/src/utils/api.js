import axios from 'axios';

// For combined deployment, API is served from the same domain
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : window.location.hostname.includes('certificate-automation-dmoe.onrender.com')
      ? 'https://certificate-automation-dmoe.onrender.com/api'
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

  // Get certificate PDF file
  getCertificateFile: async (refNo) => {
    try {
      const response = await api.get(`/certificate-files/${refNo}/pdf`, {
        responseType: 'blob',
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get certificate PDF ${refNo}:`, error.message);
      
      // If the main endpoint fails, try the direct production URL as fallback
      if (!window.location.hostname.includes('localhost')) {
        try {
          const fallbackUrl = `https://certificate-automation-dmoe.onrender.com/api/certificate-files/${refNo}/pdf`;
          
          const fallbackResponse = await axios.get(fallbackUrl, {
            responseType: 'blob',
            timeout: 30000,
            headers: {
              'Accept': 'application/pdf'
            }
          });
          
          console.log(`Certificate PDF received via fallback URL`);
          return fallbackResponse.data;
        } catch (fallbackError) {
          console.error(`Fallback request also failed:`, fallbackError.message);
        }
      }
      
      throw error;
    }
  },

  // Get certificate info
  getCertificateInfo: async (refNo) => {
    try {
      const response = await api.get(`/certificate-files/${refNo}/info`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get certificate info ${refNo}:`, error.message);
      throw error;
    }
  },

  // Manual verification by details
  manualVerify: async (details) => {
    const response = await api.post('/certificates/verify/manual', details);
    return response.data;
  },
};

export default api;
