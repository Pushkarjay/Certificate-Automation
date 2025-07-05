import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const VerificationStatus = ({ status, message, certificate = null }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: FaCheckCircle,
          className: 'verification-status verified',
          title: 'Certificate Verified',
          bgColor: 'bg-success-50',
          textColor: 'text-success-600',
          borderColor: 'border-success-200'
        };
      case 'not-verified':
        return {
          icon: FaTimesCircle,
          className: 'verification-status not-verified',
          title: 'Certificate Not Found',
          bgColor: 'bg-danger-50',
          textColor: 'text-danger-600',
          borderColor: 'border-danger-200'
        };
      case 'loading':
        return {
          icon: FaSpinner,
          className: 'verification-status loading',
          title: 'Verifying Certificate...',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          icon: null,
          className: 'verification-status',
          title: 'Verification Status Unknown',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.textColor} ${config.borderColor} text-center py-6 px-6 rounded-lg border font-semibold text-lg shadow-sm`}>
      <div className="flex items-center justify-center space-x-3">
        {Icon && (
          <Icon 
            className={`text-2xl ${status === 'loading' ? 'animate-spin' : ''}`} 
          />
        )}
        <span>{config.title}</span>
      </div>
      
      {message && (
        <p className="mt-2 text-sm font-normal opacity-90">
          {message}
        </p>
      )}

      {status === 'verified' && certificate && (
        <div className="mt-4 text-sm font-normal opacity-90 space-y-1">
          <p><strong>Name:</strong> {certificate.name}</p>
          <p><strong>Program:</strong> {certificate.program}</p>
          <p><strong>Issue Date:</strong> {new Date(certificate.issueDate).toLocaleDateString()}</p>
          {certificate.verificationCount && (
            <p><strong>Times Verified:</strong> {certificate.verificationCount}</p>
          )}
        </div>
      )}

      {status === 'not-verified' && (
        <div className="mt-3 text-sm font-normal opacity-90">
          <p>This certificate could not be found in our database.</p>
          <p>Please check the DOF number and try again.</p>
        </div>
      )}
    </div>
  );
};

export default VerificationStatus;
