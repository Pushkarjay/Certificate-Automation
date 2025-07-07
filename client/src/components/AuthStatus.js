import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';

const AuthStatus = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isDeveloperMode = process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEVELOPER_MODE === 'true';

  if (isLoading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
          <span className="text-yellow-800 text-sm">Loading authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-3 mb-4 ${
      isAuthenticated 
        ? 'bg-green-50 border-green-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              <FaUser className="text-green-600" />
              <span className="text-green-800 font-medium">
                Logged in as: {user?.firstName || user?.email}
              </span>
              {isDeveloperMode && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                  DEV MODE
                </span>
              )}
            </>
          ) : (
            <>
              <FaExclamationTriangle className="text-gray-500" />
              <span className="text-gray-700">Not authenticated</span>
            </>
          )}
        </div>
        
        {isAuthenticated && user?.role && (
          <div className="flex items-center space-x-1">
            <FaShieldAlt className="text-blue-600 text-sm" />
            <span className="text-blue-800 text-sm capitalize font-medium">
              {user.role}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthStatus;
