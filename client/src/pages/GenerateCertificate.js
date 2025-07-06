import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaUser, FaGraduationCap, FaHashtag, FaCalendarAlt, FaSpinner } from 'react-icons/fa';
import { certificateAPI } from '../services/api';
import CertificateDisplay from '../components/CertificateDisplay';

const GenerateCertificate = () => {
  const [formData, setFormData] = useState({
    name: '',
    program: '',
    refNo: '',
    issueDate: new Date().toISOString().split('T')[0] // Today's date
  });
  
  const [loading, setLoading] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) {
      errors.push('Name is required');
    } else if (formData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!formData.program.trim()) {
      errors.push('Program name is required');
    } else if (formData.program.trim().length < 2) {
      errors.push('Program name must be at least 2 characters long');
    }
    
    if (!formData.refNo.trim()) {
      errors.push('Reference number is required');
    }
    
    if (!formData.issueDate) {
      errors.push('Issue date is required');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    
    try {
      const response = await certificateAPI.generateCertificate(formData);
      
      if (response.success) {
        setGeneratedCertificate(response.data);
        setShowPreview(true);
        toast.success('Certificate generated successfully!');
        
        // Reset form
        setFormData({
          name: '',
          program: '',
          refNo: '',
          issueDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error(error.message || 'Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnother = () => {
    setGeneratedCertificate(null);
    setShowPreview(false);
  };

  const handleDownloadCertificate = () => {
    // In a real application, you might want to generate a PDF here
    toast.info('PDF download feature coming soon!');
  };

  if (showPreview && generatedCertificate) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Certificate Generated Successfully!
          </h1>
          <p className="text-gray-600">
            Your certificate has been created and is ready for verification.
          </p>
        </div>

        <CertificateDisplay certificate={generatedCertificate} />

        <div className="text-center mt-8 space-x-4">
          <button
            onClick={handleDownloadCertificate}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
          >
            Download PDF
          </button>
          <button
            onClick={handleGenerateAnother}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition duration-200"
          >
            Generate Another
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <h3 className="font-semibold text-blue-800 mb-2">Certificate Details:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>DOF Number:</strong> {generatedCertificate.dofNo}</p>
            <p><strong>Reference Number:</strong> {generatedCertificate.refNo}</p>
            <p><strong>Verification URL:</strong> 
              <a 
                href={generatedCertificate.verificationUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                {generatedCertificate.verificationUrl}
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Generate Certificate
        </h1>
        <p className="text-gray-600">
          Create a new digital certificate with QR code verification.
        </p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="form-group">
            <label className="form-label flex items-center space-x-2">
              <FaUser className="text-gray-500" />
              <span>Recipient Name</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter recipient's full name"
              required
            />
          </div>

          {/* Program Field */}
          <div className="form-group">
            <label className="form-label flex items-center space-x-2">
              <FaGraduationCap className="text-gray-500" />
              <span>Program/Course Name</span>
            </label>
            <input
              type="text"
              name="program"
              value={formData.program}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter program or course name"
              required
            />
          </div>

          {/* Reference Number Field */}
          <div className="form-group">
            <label className="form-label flex items-center space-x-2">
              <FaHashtag className="text-gray-500" />
              <span>Reference Number</span>
            </label>
            <input
              type="text"
              name="refNo"
              value={formData.refNo}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter unique reference number"
              required
            />
          </div>

          {/* Issue Date Field */}
          <div className="form-group">
            <label className="form-label flex items-center space-x-2">
              <FaCalendarAlt className="text-gray-500" />
              <span>Issue Date</span>
            </label>
            <input
              type="date"
              name="issueDate"
              value={formData.issueDate}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="form-button flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <span>Generate Certificate</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Make sure all information is correct before generating the certificate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenerateCertificate;
