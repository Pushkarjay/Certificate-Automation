import React from 'react';
import { Link } from 'react-router-dom';

const DeveloperTools = () => {
  const DEVELOPER_MODE = process.env.REACT_APP_DEVELOPER_MODE === 'true' || process.env.NODE_ENV === 'development';
  
  if (!DEVELOPER_MODE) return null;

  const allPages = [
    { name: 'Home', path: '/' },
    { name: 'Verify Certificate', path: '/verify' },
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Profile', path: '/profile' },
    { name: 'My Certificates', path: '/certificates' },
    { name: 'Issue Certificate', path: '/generate-certificate' },
    { name: 'Admin Dashboard', path: '/admin/dashboard' },
    { name: 'User Management', path: '/admin/users' },
    { name: 'Organizations', path: '/admin/organizations' },
    { name: 'Analytics', path: '/admin/analytics' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-2 text-xs z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-yellow-400">🔧 DEV MODE</span>
            <span>Quick Navigation:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {allPages.map((page) => (
              <Link
                key={page.path}
                to={page.path}
                className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs transition-colors"
                title={`Go to ${page.name}`}
              >
                {page.name}
              </Link>
            ))}
          </div>
          <button
            onClick={() => {
              localStorage.setItem('HIDE_DEV_TOOLS', 'true');
              window.location.reload();
            }}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeveloperTools;
