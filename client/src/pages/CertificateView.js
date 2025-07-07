import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { certificateAPI } from '../services/api';
import ModernCertificateDisplay from '../components/ModernCertificateDisplay';

const CertificateView = () => {
  const { id } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const response = await certificateAPI.getCertificate(id);
        
        if (response.success) {
          setCertificate(response.data);
        } else {
          setError('Certificate not found');
        }
      } catch (error) {
        console.error('Error fetching certificate:', error);
        setError(error.message || 'Failed to load certificate');
        toast.error('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCertificate();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real application, you would generate and download a PDF
    toast.info('PDF download feature coming soon!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Certificate Not Found
          </h2>
          <p className="text-red-700 mb-4">
            {error}
          </p>
          <Link
            to="/certificates"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200"
          >
            Back to Certificates
          </Link>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Certificate Data
          </h2>
          <p className="text-gray-600 mb-4">
            Certificate data is not available.
          </p>
          <Link
            to="/certificates"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition duration-200"
          >
            Back to Certificates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link
          to="/certificates"
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
        >
          <FaArrowLeft />
          <span>Back to Certificates</span>
        </Link>
        
        <div className="space-x-4">
          <button
            onClick={handlePrint}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
          >
            Print
          </button>
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Certificate Display */}
      <div className="print:shadow-none">
        <ModernCertificateDisplay certificate={certificate} showQRCode={true} />
      </div>

      {/* Certificate Metadata */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 print:hidden">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Certificate Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-gray-700">Certificate ID:</strong>
            <span className="ml-2 font-mono">{certificate._id}</span>
          </div>
          <div>
            <strong className="text-gray-700">Created:</strong>
            <span className="ml-2">
              {new Date(certificate.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div>
            <strong className="text-gray-700">Status:</strong>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              certificate.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {certificate.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {certificate.metadata?.verificationCount && (
            <div>
              <strong className="text-gray-700">Verifications:</strong>
              <span className="ml-2">{certificate.metadata.verificationCount}</span>
            </div>
          )}
          {certificate.metadata?.lastVerified && (
            <div>
              <strong className="text-gray-700">Last Verified:</strong>
              <span className="ml-2">
                {new Date(certificate.metadata.lastVerified).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
          {certificate.metadata?.generatedBy && (
            <div>
              <strong className="text-gray-700">Generated By:</strong>
              <span className="ml-2">{certificate.metadata.generatedBy}</span>
            </div>
          )}
        </div>
      </div>

      {/* Verification Link */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 print:hidden">
        <h4 className="font-semibold text-blue-800 mb-2">
          Verification Details
        </h4>
        <div className="text-sm text-blue-700">
          <p className="mb-2">
            <strong>DOF Number:</strong> 
            <code className="bg-blue-100 px-2 py-1 rounded ml-2">{certificate.dofNo}</code>
          </p>
          <p>
            <strong>Verification URL:</strong>
            <br />
            <a 
              href={certificate.verificationUrl || `/verify/${certificate.dofNo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {certificate.verificationUrl || `${window.location.origin}/verify/${certificate.dofNo}`}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
