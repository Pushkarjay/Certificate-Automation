import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import { FaLinkedin, FaTwitter, FaFacebook, FaDownload, FaShare, FaQrcode, FaShieldAlt } from 'react-icons/fa';

const ModernCertificateDisplay = ({ certificate, showQRCode = true, className = "" }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);

  if (!certificate) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center text-gray-500">
          No certificate data available
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareOnLinkedIn = () => {
    const url = `${window.location.origin}/verify/${certificate.dofNo}`;
    const text = `I'm excited to share that I've completed ${certificate.program}!`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
    window.open(linkedInUrl, '_blank');
  };

  const shareOnTwitter = () => {
    const url = `${window.location.origin}/verify/${certificate.dofNo}`;
    const text = `Just completed ${certificate.program}! 🎉 Check out my certificate:`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  const downloadCertificate = () => {
    // This would trigger certificate download
    console.log('Download certificate functionality to be implemented');
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Modern Certificate Layout */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header with Branding */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <FaShieldAlt className="text-2xl text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">CertifyPro</h3>
                <p className="text-primary-100 text-sm">Digital Certificate Platform</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-sm">Issue Date</p>
              <p className="text-white font-semibold">{formatDate(certificate.issueDate)}</p>
            </div>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="p-8 lg:p-12">
          
          {/* Certificate Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              Certificate of Achievement
            </h1>
            <div className="w-24 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>

          {/* Issued To Section */}
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg mb-2 font-medium">ISSUED TO</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-primary-600 mb-4">
              {certificate.name}
            </h2>
            <p className="text-gray-700 text-lg">
              For successful completion of
            </p>
          </div>

          {/* Program/Course Name */}
          <div className="text-center mb-8">
            <div className="bg-gray-50 rounded-lg p-6 inline-block">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-800">
                {certificate.program}
              </h3>
              {certificate.trainingDuration && (
                <p className="text-gray-600 mt-2">
                  Duration: {certificate.trainingDuration}
                </p>
              )}
            </div>
          </div>

          {/* Certificate Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-medium text-gray-600">Certificate ID:</span>
                <span className="font-mono text-sm text-gray-800">{certificate.dofNo}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-medium text-gray-600">Reference No:</span>
                <span className="font-mono text-sm text-gray-800">{certificate.refNo}</span>
              </div>
              {certificate.gpa && (
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-medium text-gray-600">GPA:</span>
                  <span className="font-semibold text-green-600">{certificate.gpa}</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {certificate.startDate && certificate.endDate && (
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-medium text-gray-600">Training Period:</span>
                  <span className="text-sm text-gray-800">
                    {formatDate(certificate.startDate)} - {formatDate(certificate.endDate)}
                  </span>
                </div>
              )}
              {certificate.metadata?.verificationCount && (
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-medium text-gray-600">Times Verified:</span>
                  <span className="text-gray-800">{certificate.metadata.verificationCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code and Verification */}
          {showQRCode && (
            <div className="flex flex-col lg:flex-row items-center justify-between bg-gray-50 rounded-lg p-6 mb-8">
              <div className="text-center lg:text-left mb-4 lg:mb-0">
                <h4 className="font-semibold text-gray-800 mb-2">Verify Certificate</h4>
                <p className="text-gray-600 text-sm">
                  Scan the QR code or visit the verification link to confirm authenticity
                </p>
                <div className="mt-3">
                  <a 
                    href={`/verify/${certificate.dofNo}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    {window.location.origin}/verify/{certificate.dofNo}
                  </a>
                </div>
              </div>
              <div className="flex-shrink-0">
                <QRCode 
                  value={`${window.location.origin}/verify/${certificate.dofNo}`}
                  size={120}
                  level="M"
                  includeMargin={true}
                  className="border-2 border-white rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6">
            <div className="text-center mb-6">
              <h4 className="font-semibold text-gray-800 mb-4">SHARE YOUR CREDENTIAL</h4>
              
              {/* Social Share Buttons */}
              <div className="flex justify-center space-x-4 mb-4">
                <button
                  onClick={shareOnLinkedIn}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaLinkedin />
                  <span>Share on LinkedIn</span>
                </button>
                <button
                  onClick={shareOnTwitter}
                  className="flex items-center space-x-2 bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <FaTwitter />
                  <span>Tweet</span>
                </button>
              </div>

              {/* More Actions */}
              <div className="border-t border-gray-200 pt-4">
                <h5 className="font-medium text-gray-700 mb-3">MORE ACTIONS</h5>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={downloadCertificate}
                    className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FaDownload />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setShowShareOptions(!showShareOptions)}
                    className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FaShare />
                    <span>More Share Options</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Description */}
          <div className="text-center">
            <div className="bg-primary-50 rounded-lg p-4 inline-block max-w-2xl">
              <h5 className="font-semibold text-gray-800 mb-2">DESCRIPTION</h5>
              <p className="text-gray-700 text-sm">
                This certificate is presented for successful completion of {certificate.program}.
                {certificate.trainingDuration && ` The program duration was ${certificate.trainingDuration}.`}
                {certificate.gpa && ` Achieved with a GPA of ${certificate.gpa}.`}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 flex items-center justify-center space-x-2">
              <FaShieldAlt className="text-primary-500" />
              <span>This certificate is digitally verified and secure</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Powered by CertifyPro Digital Certificate Platform
            </p>
          </div>
        </div>
      </div>

      {/* Additional Share Options Modal */}
      {showShareOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Share Options</h3>
              <button
                onClick={() => setShowShareOptions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/verify/${certificate.dofNo}`);
                  setShowShareOptions(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg"
              >
                Copy verification link
              </button>
              <button
                onClick={() => {
                  // Add to wallet functionality
                  setShowShareOptions(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg"
              >
                Add to Digital Wallet
              </button>
              <button
                onClick={() => {
                  const emailSubject = `My ${certificate.program} Certificate`;
                  const emailBody = `I've successfully completed ${certificate.program}! You can verify my certificate here: ${window.location.origin}/verify/${certificate.dofNo}`;
                  window.open(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);
                  setShowShareOptions(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg"
              >
                Share via Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCertificateDisplay;
