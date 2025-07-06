import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCertificate, FaQrcode, FaListAlt, FaPlus } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: FaCertificate },
    { path: '/generate', label: 'Generate', icon: FaPlus },
    { path: '/verify', label: 'Verify', icon: FaQrcode },
    { path: '/certificates', label: 'Certificates', icon: FaListAlt }
  ];

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
          
          <div className="nav-links hidden md:flex">
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
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700 hover:text-primary-600 p-2"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link flex items-center space-x-2 block ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <Icon className="text-sm" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
