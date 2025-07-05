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
    certificateType: 'student',
    issueDate: new Date().toISOString().split('T')[0], // Today's date
    // Student-specific fields
    trainingDuration: '4 month',
    subject: '',
    startDate: '',
    endDate: '',
    gpa: '',
    instituteName: 'Sure Trust Institute',
    founderSign: 'Dr. Founder Name',
    trainerSign: 'Lead Trainer',
    // Trainer-specific fields
    specialization: '',
    experience: 'Professional',
    certificationLevel: 'Certified Trainer',
    validUntil: ''
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
          certificateType: 'student',
          issueDate: new Date().toISOString().split('T')[0],
          trainingDuration: '4 month',
          subject: '',
          startDate: '',
          endDate: '',
          gpa: '',
          instituteName: 'Sure Trust Institute',
          founderSign: 'Dr. Founder Name',
          trainerSign: 'Lead Trainer',
          specialization: '',
          experience: 'Professional',
          certificationLevel: 'Certified Trainer',
          validUntil: ''
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
    <div className="max-w-2xl mx-auto">{/* Changed from max-w-md to max-w-2xl */}
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
          {/* Certificate Type Selection */}
          <div className="form-group">
            <label className="form-label">
              Certificate Type
            </label>
            <select
              name="certificateType"
              value={formData.certificateType}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="student">Student Certificate</option>
              <option value="trainer">Trainer Certificate</option>
            </select>
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label className="form-label flex items-center space-x-2">
              <FaUser className="text-gray-500" />
              <span>{formData.certificateType === 'trainer' ? 'Trainer Name' : 'Student Name'}</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder={`Enter ${formData.certificateType === 'trainer' ? 'trainer' : 'student'}'s full name`}
              required
            />
          </div>

          {/* Program Field */}
          <div className="form-group">
            <label className="form-label flex items-center space-x-2">
              <FaGraduationCap className="text-gray-500" />
              <span>{formData.certificateType === 'trainer' ? 'Training Program' : 'Course/Program'}</span>
            </label>
            <input
              type="text"
              name="program"
              value={formData.program}
              onChange={handleInputChange}
              className="form-input"
              placeholder={`Enter ${formData.certificateType === 'trainer' ? 'training program' : 'course/program'} name`}
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

          {/* Student-specific fields */}
          {formData.certificateType === 'student' && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3">Student Certificate Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Training Duration</label>
                    <input
                      type="text"
                      name="trainingDuration"
                      value={formData.trainingDuration}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 4 month"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subject/Specialization</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter subject area"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Training Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Training End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">GPA/Grade</label>
                    <input
                      type="text"
                      name="gpa"
                      value={formData.gpa}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 3.8, A+, 85%"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Institute Name</label>
                    <input
                      type="text"
                      name="instituteName"
                      value={formData.instituteName}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Founder Signature</label>
                    <input
                      type="text"
                      name="founderSign"
                      value={formData.founderSign}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Trainer Signature</label>
                    <input
                      type="text"
                      name="trainerSign"
                      value={formData.trainerSign}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Trainer-specific fields */}
          {formData.certificateType === 'trainer' && (
            <>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-3">Trainer Certificate Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Area of expertise"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience Level</label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Professional">Professional</option>
                      <option value="Senior">Senior</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Certification Level</label>
                    <select
                      name="certificationLevel"
                      value={formData.certificationLevel}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="Certified Trainer">Certified Trainer</option>
                      <option value="Master Trainer">Master Trainer</option>
                      <option value="Lead Trainer">Lead Trainer</option>
                      <option value="Senior Trainer">Senior Trainer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valid Until (Optional)</label>
                    <input
                      type="date"
                      name="validUntil"
                      value={formData.validUntil}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

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
              <span>Generate {formData.certificateType === 'trainer' ? 'Trainer' : 'Student'} Certificate</span>
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
