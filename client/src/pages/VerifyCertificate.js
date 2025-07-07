import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSearch, FaQrcode, FaSpinner } from 'react-icons/fa';
import { certificateAPI } from '../services/api';
import VerificationStatus from '../components/VerificationStatus';
import CertificateDisplay from '../components/CertificateDisplay';
import ModernCertificateDisplay from '../components/ModernCertificateDisplay';

const VerifyCertificate = () => {
  const { dofNo: urlDofNo } = useParams();
  const navigate = useNavigate();
  
  const [dofNo, setDofNo] = useState(urlDofNo || '');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-verify if DOF number is in URL
  useEffect(() => {
    if (urlDofNo) {
      handleVerification(urlDofNo);
    }
  }, [urlDofNo]);

  const handleVerification = async (dofNumber = dofNo) => {
    if (!dofNumber.trim()) {
      toast.error('Please enter a DOF number');
      return;
    }

    setLoading(true);
    setVerificationStatus('loading');
    setVerificationMessage('Checking certificate authenticity...');
    setCertificate(null);

    try {
      const response = await certificateAPI.verifyCertificate(dofNumber);
      
      if (response.success && response.verified) {
        setVerificationStatus('verified');
        setVerificationMessage('This certificate is authentic and verified.');
        setCertificate(response.data);
        toast.success('Certificate verified successfully!');
      } else {
        setVerificationStatus('not-verified');
        setVerificationMessage('Certificate not found or invalid.');
        setCertificate(null);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('not-verified');
      setVerificationMessage(error.message || 'Certificate not found in our database.');
      setCertificate(null);
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerification();
  };

  const handleReset = () => {
    setDofNo('');
    setVerificationStatus(null);
    setVerificationMessage('');
    setCertificate(null);
    navigate('/verify', { replace: true });
  };

  const handleQRScan = () => {
    // This would open a QR code scanner
    // For now, just show a message
    toast.info('QR Code scanner feature coming soon! Please enter DOF number manually.');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Verify Certificate
        </h1>
        <p className="text-gray-600">
          Enter the DOF number or scan the QR code to verify certificate authenticity.
        </p>
      </div>

      {/* Verification Form */}
      <div className="form-container mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="form-label flex items-center space-x-2">
              <FaSearch className="text-gray-500" />
              <span>DOF Number</span>
            </label>
            <input
              type="text"
              value={dofNo}
              onChange={(e) => setDofNo(e.target.value)}
              className="form-input"
              placeholder="Enter DOF number (e.g., DOF-1234567890-ABCD1234)"
              required
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="form-button flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <FaSearch />
                  <span>Verify Certificate</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleQRScan}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center space-x-2"
            >
              <FaQrcode />
              <span>Scan QR Code</span>
            </button>
          </div>

          {verificationStatus && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-200"
            >
              Verify Another Certificate
            </button>
          )}
        </form>
      </div>

      {/* Verification Status */}
      {verificationStatus && (
        <div className="mb-8">
          <VerificationStatus
            status={verificationStatus}
            message={verificationMessage}
            certificate={certificate}
          />
        </div>
      )}

      {/* Certificate Display */}
      {certificate && verificationStatus === 'verified' && (
        <div className="mb-8">
          <ModernCertificateDisplay certificate={certificate} showQRCode={true} />
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How to verify a certificate:
        </h3>
        <div className="space-y-3 text-gray-700">
          <div className="flex items-start space-x-3">
            <span className="bg-primary-100 text-primary-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
            <p>Locate the DOF number on the certificate (usually found below the QR code)</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="bg-primary-100 text-primary-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
            <p>Enter the complete DOF number in the field above</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="bg-primary-100 text-primary-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</span>
            <p>Click "Verify Certificate" to check authenticity</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="bg-primary-100 text-primary-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">4</span>
            <p>Or scan the QR code directly for instant verification</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
