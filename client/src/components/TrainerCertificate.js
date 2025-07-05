import React from 'react';
import QRCode from 'qrcode.react';

const TrainerCertificate = ({ certificate, showQRCode = true, className = "" }) => {
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

  // Extract trainer-specific data
  const specialization = certificate.specialization || certificate.program;
  const experience = certificate.experience || "Professional";
  const certificationLevel = certificate.certificationLevel || "Certified Trainer";
  const validUntil = certificate.validUntil ? formatDate(certificate.validUntil) : "Lifetime";

  return (
    <div className={`bg-white ${className}`} style={{ 
      width: '21cm', 
      height: '29.7cm', 
      padding: '2cm',
      margin: '0 auto',
      border: '3px solid #059669',
      fontFamily: 'Times, serif',
      position: 'relative',
      boxSizing: 'border-box',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)'
    }}>
      
      {/* Header with Logos */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-2">
            <span className="text-white font-bold text-sm">SURE</span>
          </div>
          <div className="text-xs text-center">
            <div className="font-semibold">SURE TRUST</div>
            <div>TRAINING</div>
          </div>
        </div>

        <div className="flex-1 text-center mx-8">
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            SURE TRUST TRAINING ACADEMY
          </h1>
          <p className="text-sm text-gray-700 leading-tight">
            Professional Development & Trainer Certification Program<br />
            Empowering Educators with Excellence
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
            <span className="text-white font-bold text-sm">CERT</span>
          </div>
          <div className="text-xs text-center">
            <div className="font-semibold">CERTIFIED</div>
            <div>TRAINER</div>
          </div>
        </div>
      </div>

      {/* Certificate Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-green-800 mb-2">
          TRAINER CERTIFICATION
        </h2>
        <div className="w-32 h-1 bg-green-600 mx-auto mb-2"></div>
        <p className="text-lg text-gray-700">Professional Training Excellence</p>
      </div>

      {/* Certification Statement */}
      <div className="text-center mb-6">
        <p className="text-lg text-gray-700">
          This is to certify that
        </p>
      </div>

      {/* Trainer Name */}
      <div className="text-center mb-8">
        <div className="border-b-2 border-green-600 inline-block px-8 pb-2">
          <h3 className="text-4xl font-bold text-green-800">
            {certificate.name}
          </h3>
        </div>
      </div>

      {/* Certification Details */}
      <div className="text-center mb-8 px-4">
        <p className="text-lg text-gray-800 leading-relaxed">
          has successfully completed the <strong>"{certificationLevel}"</strong> program 
          and is hereby certified as a <strong>{experience}</strong> trainer in 
          "<strong>{specialization}</strong>" with demonstrated expertise in curriculum 
          development, instructional design, and student assessment methodologies 
          as per Sure Trust Training Academy standards.
        </p>
      </div>

      {/* Authority & Privileges */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 mx-4">
        <h4 className="text-lg font-semibold text-green-800 mb-2 text-center">
          Trainer Privileges & Authority
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Authorized to conduct training sessions in {specialization}</li>
          <li>• Qualified to assess and certify student competencies</li>
          <li>• Permitted to design and modify curriculum content</li>
          <li>• Eligible to mentor junior trainers and trainees</li>
          <li>• Authorized to issue completion certificates to students</li>
        </ul>
      </div>

      {/* Footer Section */}
      <div className="absolute bottom-8 left-8 right-8">
        <div className="flex justify-between items-end">
          
          {/* QR Code and Verification */}
          <div className="text-center">
            {showQRCode && (
              <div className="mb-2">
                {certificate.qrCodeUrl ? (
                  <img 
                    src={certificate.qrCodeUrl} 
                    alt="Trainer Certificate QR Code"
                    className="mx-auto w-20 h-20"
                  />
                ) : (
                  <QRCode 
                    value={certificate.verificationUrl || `verify/${certificate.dofNo}`}
                    size={80}
                    level="M"
                    includeMargin={true}
                  />
                )}
              </div>
            )}
            <div className="text-xs text-gray-600 max-w-32">
              <div className="font-semibold mb-1">Verify Trainer:</div>
              <div className="break-all">
                {certificate.dofNo}
              </div>
            </div>
          </div>

          {/* Academic Director Signature */}
          <div className="text-center">
            <div className="border-t border-gray-400 w-32 mb-1"></div>
            <div className="text-sm font-semibold">Dr. Academic Director</div>
            <div className="text-xs text-gray-600">Academic Affairs</div>
            <div className="text-xs text-gray-600">Sure Trust Academy</div>
          </div>

          {/* CEO Signature */}
          <div className="text-center">
            <div className="border-t border-gray-400 w-32 mb-1"></div>
            <div className="text-sm font-semibold">Founder & CEO</div>
            <div className="text-xs text-gray-600">Chief Executive</div>
            <div className="text-xs text-gray-600">Sure Trust</div>
          </div>

          {/* Certification Details Table */}
          <div className="text-xs">
            <table className="border border-gray-400">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 font-semibold bg-green-50">
                    Issue Date
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {formatDate(certificate.issueDate)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 font-semibold bg-green-50">
                    Valid Until
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {validUntil}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 font-semibold bg-green-50">
                    Cert ID
                  </td>
                  <td className="border border-gray-400 px-2 py-1 font-mono">
                    {certificate.refNo}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Certification Badge */}
        <div className="absolute bottom-0 right-0 transform translate-x-4 translate-y-4">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
            <div className="text-white text-xs font-bold text-center">
              <div>SURE</div>
              <div>CERT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-8xl font-bold text-green-600 transform rotate-45">
            CERTIFIED TRAINER
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerCertificate;
