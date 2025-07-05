import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

class AuthService {
  // Set authorization token
  setAuthToken(token) {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }

  // Register user
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  // Login user
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  }

  // Google OAuth login
  async googleLogin(tokenId) {
    const response = await api.post('/auth/google', { tokenId });
    return response.data;
  }

  // Logout user
  async logout(refreshToken) {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  }

  // Refresh token
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  // Verify email
  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  }

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }

  // Get current user profile
  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  }

  // Update user profile
  async updateProfile(userData) {
    const response = await api.put('/users/me', userData);
    return response.data;
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await api.put('/users/me/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // Upload profile picture
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get user's certificates
  async getUserCertificates(page = 1, limit = 10) {
    const response = await api.get(`/users/me/certificates?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Delete user account
  async deleteAccount(password, confirmDelete) {
    const response = await api.delete('/users/me', {
      data: { password, confirmDelete },
    });
    return response.data;
  }

  // Admin methods
  async getAdminStats() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  }

  async getUsers(page = 1, limit = 10, search = '', role = '', status = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);

    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  }

  async getUserById(userId) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  }

  async activateUser(userId) {
    const response = await api.put(`/admin/users/${userId}/activate`);
    return response.data;
  }

  async deactivateUser(userId) {
    const response = await api.put(`/admin/users/${userId}/deactivate`);
    return response.data;
  }

  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async updateUserRole(userId, role) {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  }

  async getAllCertificates(page = 1, limit = 10, search = '', status = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await api.get(`/certificates/mysql?${params}`);
    return response.data;
  }

  // Certificate claiming
  async getCertificateByClaimToken(claimToken) {
    const response = await api.get(`/claims/certificate/${claimToken}`);
    return response.data;
  }

  async claimCertificate(claimToken) {
    const response = await api.post(`/claims/claim/${claimToken}`);
    return response.data;
  }
}

export const authService = new AuthService();
export default api;
