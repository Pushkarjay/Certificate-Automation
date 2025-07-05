import React from 'react';
import { Link } from 'react-router-dom';
import { FaCertificate, FaQrcode, FaListAlt, FaPlus, FaShieldAlt, FaSearch } from 'react-icons/fa';

const Home = () => {
  const features = [
    {
      icon: FaPlus,
      title: 'Generate Certificates',
      description: 'Create professional digital certificates with QR codes for verification',
      link: '/generate',
      color: 'bg-blue-500'
    },
    {
      icon: FaQrcode,
      title: 'Verify Certificates',
      description: 'Quickly verify certificate authenticity by scanning QR codes or entering DOF numbers',
      link: '/verify',
      color: 'bg-green-500'
    },
    {
      icon: FaListAlt,
      title: 'View All Certificates',
      description: 'Browse and manage all generated certificates in one place',
      link: '/certificates',
      color: 'bg-purple-500'
    }
  ];

  const stats = [
    { label: 'Secure', value: '100%', description: 'All certificates are digitally secure' },
    { label: 'Fast', value: '<2s', description: 'Quick generation and verification' },
    { label: 'Reliable', value: '24/7', description: 'Always available verification system' }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="bg-primary-100 p-4 rounded-full">
            <FaCertificate className="text-5xl text-primary-600" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Certificate Verification System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          A secure, reliable, and efficient platform for generating, managing, and verifying 
          digital certificates with QR code technology.
        </p>
        <div className="space-x-4">
          <Link
            to="/generate"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition duration-200 inline-flex items-center space-x-2"
          >
            <FaPlus />
            <span>Generate Certificate</span>
          </Link>
          <Link
            to="/verify"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition duration-200 inline-flex items-center space-x-2"
          >
            <FaSearch />
            <span>Verify Certificate</span>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Key Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.link}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition duration-300 transform hover:-translate-y-1"
              >
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Why Choose Our System?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                {stat.label}
              </div>
              <div className="text-gray-600">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl text-white p-8 text-center">
        <FaShieldAlt className="text-4xl mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">
          Secure & Reliable Verification
        </h2>
        <p className="text-primary-100 max-w-2xl mx-auto">
          Our system uses advanced security measures to ensure certificate authenticity. 
          Each certificate is digitally signed and stored securely in our database with 
          unique verification codes.
        </p>
      </div>
    </div>
  );
};

export default Home;
