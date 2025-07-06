import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component for protecting routes that require authentication
export const ProtectedRoute = ({ children, requireVerification = false, requireRole = null }) => {
  const { isAuthenticated, isLoading, user, isInitialized } = useAuth();
  const location = useLocation();

  // Developer Mode: Bypass authentication (set to true for development)
  const DEVELOPER_MODE = process.env.REACT_APP_DEVELOPER_MODE === 'true' || process.env.NODE_ENV === 'development';
  
  if (DEVELOPER_MODE) {
    // In developer mode, show a banner and allow access
    return (
      <div>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 text-center text-sm">
          🚧 <strong>DEVELOPER MODE</strong> - Authentication bypassed for testing
        </div>
        {children}
      </div>
    );
  }

  // Show loading while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if email verification is required
  if (requireVerification && !user?.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // Check role-based access
  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Component for protecting admin routes
export const AdminRoute = ({ children, requireVerification = true }) => {
  // Developer Mode: Bypass authentication
  const DEVELOPER_MODE = process.env.REACT_APP_DEVELOPER_MODE === 'true' || process.env.NODE_ENV === 'development';
  
  if (DEVELOPER_MODE) {
    return (
      <div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 text-center text-sm">
          🔧 <strong>ADMIN DEV MODE</strong> - Admin access granted for testing
        </div>
        {children}
      </div>
    );
  }

  return (
    <ProtectedRoute 
      requireVerification={requireVerification} 
      requireRole="admin"
    >
      {children}
    </ProtectedRoute>
  );
};

// Component for redirecting authenticated users away from auth pages
export const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  // Show loading while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
