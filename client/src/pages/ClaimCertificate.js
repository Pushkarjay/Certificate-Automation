import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const ClaimCertificate = () => {
  const { claimToken } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificateInfo = async () => {
      if (!claimToken) {
        setError('Invalid claim token');
        setIsLoading(false);
        return;
      }

      try {
        const response = await authService.getCertificateByClaimToken(claimToken);
        setCertificate(response);
      } catch (error) {
        console.error('Failed to fetch certificate info:', error);
        setError(error.message || 'Certificate not found or claim token is invalid');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificateInfo();
  }, [claimToken]);

  const handleClaim = async () => {
    if (!user) {
      toast.error('Please log in to claim this certificate');
      navigate('/login', { state: { returnTo: `/claim/${claimToken}` } });
      return;
    }

    setIsClaiming(true);
    try {
      await authService.claimCertificate(claimToken);
      toast.success('Certificate claimed successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to claim certificate');
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading certificate information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.349 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Certificate Not Found</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Claim Your Certificate</h1>
            <p className="text-blue-100 mt-1">
              A certificate has been issued for you. Claim it to add to your profile.
            </p>
          </div>

          <div className="p-8">
            {/* Certificate Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 mb-8 border-2 border-dashed border-blue-200">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Certificate of {certificate?.certificateType || 'Achievement'}
                </h2>
                
                <p className="text-lg text-gray-700 mb-4">
                  This certifies that
                </p>
                
                <h3 className="text-3xl font-bold text-blue-600 mb-4">
                  {certificate?.recipientName}
                </h3>
                
                <p className="text-lg text-gray-700 mb-2">
                  has successfully completed
                </p>
                
                <h4 className="text-xl font-semibold text-gray-900 mb-6">
                  {certificate?.courseName}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Issue Date</p>
                    <p>{new Date(certificate?.issueDate).toLocaleDateString()}</p>
                  </div>
                  {certificate?.completionDate && (
                    <div>
                      <p className="font-medium">Completion Date</p>
                      <p>{new Date(certificate.completionDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">Issued By</p>
                    <p>{certificate?.issuerName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Certificate Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recipient Email:</span>
                      <span className="font-medium">{certificate?.recipientEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Certificate Type:</span>
                      <span className="font-medium capitalize">{certificate?.certificateType}</span>
                    </div>
                    {certificate?.grade && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Grade:</span>
                        <span className="font-medium">{certificate.grade}</span>
                      </div>
                    )}
                    {certificate?.credits && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Credits:</span>
                        <span className="font-medium">{certificate.credits}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Organization</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{certificate?.issuerName}</span>
                    </div>
                    {certificate?.organization && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Organization:</span>
                          <span className="font-medium">{certificate.organization.name}</span>
                        </div>
                        {certificate.organization.website && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Website:</span>
                            <a 
                              href={certificate.organization.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6">
              {!user ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    You need to be logged in to claim this certificate.
                  </p>
                  <div className="space-x-4">
                    <button
                      onClick={() => navigate('/login', { state: { returnTo: `/claim/${claimToken}` } })}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                    >
                      Log In to Claim
                    </button>
                    <button
                      onClick={() => navigate('/register', { state: { returnTo: `/claim/${claimToken}` } })}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              ) : certificate?.claimedBy ? (
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Already Claimed</h3>
                  <p className="text-gray-600 mb-4">
                    This certificate has already been claimed.
                  </p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : user.email === certificate?.recipientEmail ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Click the button below to add this certificate to your profile.
                  </p>
                  <button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-medium text-lg disabled:opacity-50"
                  >
                    {isClaiming ? 'Claiming...' : 'Claim Certificate'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.349 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Email Mismatch</h3>
                  <p className="text-gray-600 mb-4">
                    This certificate was issued to {certificate?.recipientEmail}, but you are logged in as {user.email}.
                    Please log in with the correct account to claim this certificate.
                  </p>
                  <div className="space-x-4">
                    <button
                      onClick={() => navigate('/login', { state: { returnTo: `/claim/${claimToken}` } })}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                    >
                      Switch Account
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimCertificate;
