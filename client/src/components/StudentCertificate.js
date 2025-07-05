import React from 'react';
import QRCode from 'qrcode.react';

const StudentCertificate = ({ certificate, showQRCode = true, className = "" }) => {
  if (!certificate) {
    return (
      <div className="certificate-container">
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

  // Extract additional data components from certificate
  const trainingDuration = certificate.trainingDuration || "4 month";
  const subject = certificate.subject || certificate.program;
  const startDate = certificate.startDate ? formatDate(certificate.startDate) : "Start Date";
  const endDate = certificate.endDate ? formatDate(certificate.endDate) : formatDate(certificate.issueDate);
  const gpa = certificate.gpa || "N/A";
  const founderSign = certificate.founderSign || "Dr. Founder Name";
  const trainerSign = certificate.trainerSign || "Trainer Name";

  return (
    <div className={`bg-white ${className}`} style={{ 
      width: '21cm', 
      height: '29.7cm', 
      padding: '2cm',
      margin: '0 auto',
      border: '3px solid #2563eb',
      fontFamily: 'Times, serif',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      
      {/* 1st Line - Logos and Header */}
      <div className="flex justify-between items-start mb-6">
        {/* Sure Trust Logo (Left) */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
            <span className="text-white font-bold text-sm">SURE</span>
          </div>
          <div className="text-xs text-center">
            <div className="font-semibold">SURE TRUST</div>
            <div>LOGO</div>
          </div>
        </div>

        {/* Middle - Sure Trust + Description */}
        <div className="flex-1 text-center mx-8">
          <h1 className="text-2xl font-bold text-blue-800 mb-2">
            SURE TRUST
          </h1>
          <p className="text-sm text-gray-700 leading-tight">
            Skill development and training organization committed to<br />
            empowering individuals with industry-relevant skills
          </p>
        </div>

        {/* ACTIE Logo (Right) */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-2">
            <span className="text-white font-bold text-sm">ACTIE</span>
          </div>
          <div className="text-xs text-center">
            <div className="font-semibold">ACTIE</div>
            <div>LOGO</div>
          </div>
        </div>
      </div>

      {/* Certificate Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          CERTIFICATE OF COMPLETION
        </h2>
        <div className="w-32 h-1 bg-blue-600 mx-auto"></div>
      </div>

      {/* 2nd Line - Certificate Issue Statement */}
      <div className="text-center mb-6">
        <p className="text-lg text-gray-700">
          This certificate is issued to
        </p>
      </div>

      {/* 3rd Line - Name */}
      <div className="text-center mb-8">
        <div className="border-b-2 border-blue-600 inline-block px-8 pb-2">
          <h3 className="text-4xl font-bold text-blue-800">
            {certificate.name}
          </h3>
        </div>
      </div>

      {/* 4th Line - Training Details Paragraph */}
      <div className="text-center mb-8 px-4">
        <p className="text-lg text-gray-800 leading-relaxed">
          for successful completion of <strong>{trainingDuration}</strong> training in 
          "<strong>{subject}</strong>" course from{' '}
          <strong>{certificate.instituteName || "Sure Trust Institute"}</strong>{' '}
          from <strong>{startDate}</strong> to <strong>{endDate}</strong> securing GPA{' '}
          <strong>"{gpa}"</strong> and attending mandatory{' '}
          <strong>"Life Skills Training"</strong> sessions by Sure Trust.
        </p>
      </div>

      {/* 5th Line - Footer Section */}
      <div className="absolute bottom-8 left-8 right-8">
        <div className="flex justify-between items-end">
          
          {/* QR Code and Verification Link */}
          <div className="text-center">
            {showQRCode && (
              <div className="mb-2">
                {certificate.qrCodeUrl ? (
                  <img 
                    src={certificate.qrCodeUrl} 
                    alt="Certificate QR Code"
                    className="mx-auto w-20 h-20"
                  />
                ) : certificate.verificationUrl ? (
                  <QRCode 
                    value={certificate.verificationUrl}
                    size={80}
                    level="M"
                    includeMargin={true}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 flex items-center justify-center mx-auto">
                    <span className="text-gray-500 text-xs">QR</span>
                  </div>
                )}
              </div>
            )}
            <div className="text-xs text-gray-600 max-w-32">
              <div className="font-semibold mb-1">Verification Link:</div>
              <div className="break-all">
                {certificate.verificationUrl || `verify/${certificate.dofNo}`}
              </div>
            </div>
          </div>

          {/* Founder Signature */}
          <div className="text-center">
            <div className="border-t border-gray-400 w-32 mb-1"></div>
            <div className="text-sm font-semibold">{founderSign}</div>
            <div className="text-xs text-gray-600">Founder & CEO</div>
            <div className="text-xs text-gray-600">Sure Trust</div>
          </div>

          {/* Trainer Signature */}
          <div className="text-center">
            <div className="border-t border-gray-400 w-32 mb-1"></div>
            <div className="text-sm font-semibold">{trainerSign}</div>
            <div className="text-xs text-gray-600">Lead Trainer</div>
            <div className="text-xs text-gray-600">{subject}</div>
          </div>

          {/* Issue Date and Ref No Table */}
          <div className="text-xs">
            <table className="border border-gray-400">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 font-semibold bg-gray-50">
                    Issue Date
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {formatDate(certificate.issueDate)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 font-semibold bg-gray-50">
                    Ref No
                  </td>
                  <td className="border border-gray-400 px-2 py-1 font-mono">
                    {certificate.refNo}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Watermark/Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-9xl font-bold text-blue-600 transform rotate-45">
            SURE TRUST
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCertificate;
