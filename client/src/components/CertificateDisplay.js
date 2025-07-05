import React from 'react';
import StudentCertificate from './StudentCertificate';
import TrainerCertificate from './TrainerCertificate';

const CertificateDisplay = ({ certificate, showQRCode = true, className = "" }) => {
  if (!certificate) {
    return (
      <div className="certificate-container">
        <div className="text-center text-gray-500">
          No certificate data available
        </div>
      </div>
    );
  }

  // Determine certificate type and render appropriate component
  const certificateType = certificate.certificateType || 'student';
  
  if (certificateType === 'trainer') {
    return (
      <TrainerCertificate 
        certificate={certificate} 
        showQRCode={showQRCode} 
        className={className} 
      />
    );
  }
  
  return (
    <StudentCertificate 
      certificate={certificate} 
      showQRCode={showQRCode} 
      className={className} 
    />
  );
};

export default CertificateDisplay;
