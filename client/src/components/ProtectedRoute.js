import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component for protecting routes that require authentication
export const ProtectedRoute = ({ children, requireVerification = false, requireRole = null }) => {
  const { isAuthenticated, isLoading, user, isInitialized } = useAuth();
  const location = useLocation();

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
