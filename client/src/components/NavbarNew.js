import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCertificate, FaQrcode, FaListAlt, FaPlus, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaTachometerAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Public navigation items
  const publicNavItems = [
    { path: '/', label: 'Home', icon: FaCertificate },
    { path: '/verify', label: 'Verify', icon: FaQrcode }
  ];

  // Protected navigation items (shown when authenticated)
  const protectedNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { path: '/generate', label: 'Generate', icon: FaPlus },
    { path: '/certificates', label: 'My Certificates', icon: FaListAlt }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navItems = isAuthenticated ? [...publicNavItems, ...protectedNavItems] : publicNavItems;

  return (
    <nav className="nav-container">
      <div className="nav-content">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="nav-brand flex items-center space-x-2">
              <FaCertificate className="text-2xl" />
              <span>CertifyPro</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="nav-links hidden md:flex items-center space-x-6">
            {/* Navigation Items */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link flex items-center space-x-1 ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <Icon className="text-sm" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Authentication Section */}
            <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-2 text-gray-700">
                    <FaUser className="text-sm" />
                    <span className="text-sm font-medium">
                      {user?.firstName || user?.email}
                    </span>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                  >
                    <FaSignOutAlt className="text-sm" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* Login Button */}
                  <Link
                    to="/login"
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                  >
                    <FaSignInAlt className="text-sm" />
                    <span>Login</span>
                  </Link>
                  
                  {/* Register Button */}
                  <Link
                    to="/register"
                    className="flex items-center space-x-1 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition duration-200"
                  >
                    <FaUserPlus className="text-sm" />
                    <span>Register</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-primary-600 p-2"
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`nav-link flex items-center space-x-2 w-full px-3 py-2 ${
                      isActive ? 'active' : ''
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Authentication */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center space-x-2 px-3 py-2 text-gray-700">
                      <FaUser className="text-sm" />
                      <span className="text-sm font-medium">
                        {user?.firstName || user?.email}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-gray-700 hover:text-red-600 transition duration-200"
                    >
                      <FaSignOutAlt className="text-sm" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-gray-700 hover:text-primary-600 transition duration-200"
                    >
                      <FaSignInAlt className="text-sm" />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 w-full px-3 py-2 bg-primary-600 text-white hover:bg-primary-700 transition duration-200 rounded-md mx-3 mt-2"
                    >
                      <FaUserPlus className="text-sm" />
                      <span>Register</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
