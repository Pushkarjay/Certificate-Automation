import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isInitialized: true
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        user: action.payload.user || state.user
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        if (token && refreshToken && user) {
          // Verify token is still valid
          authService.setAuthToken(token);
          
          try {
            // Try to get current user profile to verify token
            const response = await authService.getCurrentUser();
            
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: response.user,
                token,
                refreshToken
              }
            });
          } catch (error) {
            // Token might be expired, try to refresh
            try {
              const refreshResult = await authService.refreshToken(refreshToken);
              
              localStorage.setItem('token', refreshResult.token);
              localStorage.setItem('refreshToken', refreshResult.refreshToken);
              localStorage.setItem('user', JSON.stringify(refreshResult.user));
              
              authService.setAuthToken(refreshResult.token);
              
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: refreshResult
              });
            } catch (refreshError) {
              // Refresh failed, clear auth data
              logout();
            }
          }
        } else {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_FAILURE,
            payload: null
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: 'Failed to initialize authentication'
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authService.login(email, password);
      
      // Store auth data
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Set auth token for future requests
      authService.setAuthToken(response.token);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: response
      });

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authService.register(userData);
      
      // Store auth data
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Set auth token for future requests
      authService.setAuthToken(response.token);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: response
      });

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  };

  // Google OAuth login
  const googleLogin = async (tokenId) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authService.googleLogin(tokenId);
      
      // Store auth data
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Set auth token for future requests
      authService.setAuthToken(response.token);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: response
      });

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Google login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear auth token
      authService.setAuthToken(null);
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
    
    // Update localStorage
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  // Check if user is verified
  const isVerified = () => {
    return state.user?.isVerified === true;
  };

  const value = {
    ...state,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    clearError,
    hasRole,
    isAdmin,
    isVerified
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
