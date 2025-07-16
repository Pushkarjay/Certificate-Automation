const express = require('express');
const router = express.Router();
const sheetsDb = require('../services/sheetsDatabase');
const { generateCertificate, generateSimpleCertificate } = require('../services/certificateGenerator');
const QRCode = require('qrcode');

// Test endpoint to check API health
router.get('/test', async (req, res) => {
  try {
    const connectionTest = await sheetsDb.testConnection();
    res.json({ 
      status: 'OK', 
      message: 'Certificates API is working',
      sheetsConnection: connectionTest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all certificates with pagination (now working with Google Sheets)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type || 'student'; // student, trainer, trainee
    const status = req.query.status; // pending, generated, issued, revoked
    const search = req.query.search;

    console.log('📋 Fetching certificates:', { page, limit, type, status, search });

    const result = await sheetsDb.getSubmissions({
      certificateType: type,
      page,
      limit,
      status,
      search
    });

    // Transform data to match expected format
    const certificates = result.data.map(submission => ({
      id: submission._id,
      submission_id: submission._id,
      full_name: submission.full_name,
      email: submission.email_address,
      phone: submission.phone,
      course_name: submission.course_name,
      batch_initials: submission.batch_initials,
      certificate_type: submission.certificate_type,
      status: submission.status,
      gpa: submission.gpa,
      attendance_percentage: submission.attendance_percentage,
      assessment_score: submission.assessment_score,
      organization: submission.organization,
      position: submission.position,
      created_at: submission.timestamp,
      updated_at: submission.updated_at || submission.timestamp,
      certificate_ref_no: submission.certificate_id,
      certificate_id: submission.certificate_id,
      verification_url: submission.certificate_url,
      generated_at: submission.issued_date
    }));

    res.json({
      certificates,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.totalPages
      }
    });

  } catch (error) {
    console.error('❌ Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Get single certificate/submission
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📋 Fetching certificate:', id);
    const submission = await sheetsDb.getSubmissionById(id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Certificate/submission not found' });
    }

    // Transform to match expected format
    const certificate = {
      ...submission,
      email: submission.email_address,
      certificate_ref_no: submission.certificate_id,
      verification_url: submission.certificate_url,
      qr_code_data: submission.qr_code,
      certificate_image_path: '', // These could be derived from certificate_url
      certificate_pdf_path: submission.certificate_url,
      generated_at: submission.issued_date,
      certificate_status: submission.status,
      created_at: submission.timestamp,
      updated_at: submission.updated_at || submission.timestamp
    };

    res.json(certificate);

  } catch (error) {
    console.error('❌ Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Generate certificate from form submission
router.post('/generate/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const forceRegenerate = req.query.force === 'true' || req.body.force === true;
    
    console.log('🎓 Generating certificate for submission:', submissionId);
    
    // Get form submission data from sheets
    const submission = await sheetsDb.getSubmissionById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ 
        error: 'Form submission not found' 
      });
    }

    // Check if certificate already exists
    if (submission.certificate_id && submission.status === 'issued' && !forceRegenerate) {
      return res.status(400).json({ 
        error: 'Certificate already generated',
        referenceNumber: submission.certificate_id,
        verificationUrl: submission.certificate_url,
        message: 'Certificate already exists. Use force=true to regenerate.'
      });
    }

    // Generate new certificate reference number and verification URL
    const refNo = await generateCertificateRefNo(submission);
    const verificationUrl = `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${refNo}`;

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(verificationUrl);

    // Get appropriate template based on certificate type and course
    const templatePath = getTemplateForSubmission(submission);

    // Generate the actual certificate files (using simplified generation)
    const certificateData = {
      name: submission.full_name,
      course: submission.course_name || 'General Course',
      batch: submission.batch_initials || 'General',
      refNo: refNo,
      verificationUrl: verificationUrl,
      type: submission.certificate_type,
      templatePath: templatePath,
      gpa: submission.gpa,
      attendance: submission.attendance_percentage,
      startDate: submission.start_date,
      endDate: submission.end_date
    };

    console.log('🎨 Generating certificate with data:', { 
      name: certificateData.name, 
      refNo: certificateData.refNo, 
      template: templatePath 
    });

    const generatedFiles = await generateSimpleCertificate(certificateData);

    // Convert PDF to base64 for storage in sheets
    const fs = require('fs').promises;
    const pdfBuffer = await fs.readFile(generatedFiles.pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Update the submission in sheets with certificate data
    const certificateInfo = {
      certificateId: refNo,
      certificateUrl: generatedFiles.pdfUrl || verificationUrl,
      qrCode: qrCodeData,
      verificationCode: refNo
    };

    await sheetsDb.storeCertificatePDF(submissionId, pdfBase64, certificateInfo);

    console.log('✅ Certificate generated and stored successfully:', refNo);

    res.json({
      success: true,
      message: 'Certificate generated successfully',
      certificateId: refNo,
      referenceNumber: refNo,
      verificationUrl: verificationUrl,
      files: generatedFiles
    });

  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    res.status(500).json({ 
      error: 'Failed to generate certificate',
      message: error.message 
    });
  }
});

// Bulk generate certificates for pending submissions
router.post('/generate-batch', async (req, res) => {
  try {
    const { submissionIds, certificateType } = req.body;
    
    if (!submissionIds || !Array.isArray(submissionIds)) {
      return res.status(400).json({ error: 'submissionIds array is required' });
    }

    const results = {
      generated: [],
      failed: [],
      skipped: []
    };

    for (const submissionId of submissionIds) {
      try {
        console.log(`🔄 Processing batch generation for: ${submissionId}`);
        
        // Get submission from sheets
        const submission = await sheetsDb.getSubmissionById(submissionId);
        
        if (!submission) {
          results.failed.push({ submissionId, error: 'Submission not found' });
          continue;
        }

        if (submission.certificate_id) {
          results.skipped.push({ 
            submissionId, 
            reason: 'Certificate already exists',
            refNo: submission.certificate_id 
          });
          continue;
        }

        if (submission.status !== 'pending') {
          results.skipped.push({ 
            submissionId, 
            reason: `Status is ${submission.status}, not pending` 
          });
          continue;
        }

        // Generate certificate (reuse the generation logic)
        const refNo = await generateCertificateRefNo(submission);
        const verificationUrl = `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${refNo}`;
        const qrCodeData = await QRCode.toDataURL(verificationUrl);

        const certificateData = {
          name: submission.full_name,
          course: submission.course_name || 'General Course',
          batch: submission.batch_initials || 'General',
          refNo: refNo,
          verificationUrl: verificationUrl,
          type: submission.certificate_type,
          templatePath: getTemplateForSubmission(submission),
          gpa: submission.gpa,
          attendance: submission.attendance_percentage
        };

        const generatedFiles = await generateSimpleCertificate(certificateData);

        // Convert PDF to base64 for storage
        const fs = require('fs').promises;
        const pdfBuffer = await fs.readFile(generatedFiles.pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');

        // Store in sheets
        const certificateInfo = {
          certificateId: refNo,
          certificateUrl: generatedFiles.pdfUrl || verificationUrl,
          qrCode: qrCodeData,
          verificationCode: refNo
        };

        await sheetsDb.storeCertificatePDF(submissionId, pdfBase64, certificateInfo);

        results.generated.push({
          submissionId,
          certificateId: refNo,
          referenceNumber: refNo,
          name: submission.full_name
        });

      } catch (error) {
        console.error(`❌ Error generating certificate for submission ${submissionId}:`, error);
        results.failed.push({ 
          submissionId, 
          error: error.message 
        });
      }
    }

    res.json({
      success: true,
      message: 'Batch generation completed',
      results: results,
      summary: {
        total: submissionIds.length,
        generated: results.generated.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      }
    });

  } catch (error) {
    console.error('❌ Error in batch generation:', error);
    res.status(500).json({ 
      error: 'Failed to process batch generation',
      message: error.message 
    });
  }
});

// Verify certificate by reference number
router.get('/verify/:refNo', async (req, res) => {
  try {
    const { refNo } = req.params;
    
    console.log('🔍 Verifying certificate:', refNo);
    const certificate = await sheetsDb.findByVerificationCode(refNo);
    
    if (!certificate) {
      return res.status(404).json({
        valid: false,
        error: 'Certificate not found',
        message: 'The provided reference number does not match any certificate in our records.'
      });
    }

    // Check if certificate is properly issued
    if (certificate.status !== 'issued') {
      return res.status(400).json({
        valid: false,
        error: 'Certificate not issued',
        message: 'This certificate has not been officially issued yet.'
      });
    }

    res.json({
      valid: true,
      status: 'valid',
      message: 'Certificate is valid and authentic.',
      certificateData: {
        referenceNumber: certificate.verification_code || certificate.certificate_id,
        certificateType: certificate.certificate_type,
        holderName: certificate.full_name,
        email: certificate.email_address,
        course: certificate.course_name,
        batch: certificate.batch_initials,
        gpa: certificate.gpa,
        attendance: certificate.attendance_percentage,
        startDate: certificate.start_date,
        endDate: certificate.end_date,
        issuedDate: certificate.issued_date,
        verificationUrl: certificate.certificate_url
      }
    });

  } catch (error) {
    console.error('❌ Error verifying certificate:', error);
    res.status(500).json({
      valid: false,
      error: 'Verification failed',
      message: 'An error occurred while verifying the certificate.'
    });
  }
});

// Manual verification by certificate details
router.post('/verify/manual', async (req, res) => {
  try {
    const { holderName, course, email } = req.body;
    
    if (!holderName || !course || !email) {
      return res.status(400).json({
        valid: false,
        error: 'Missing required fields',
        message: 'Please provide holder name, course, and email address.'
      });
    }

    console.log('🔍 Manual verification search:', { holderName, course, email });

    // Search across all sheet types
    const searchPromises = ['student', 'trainer', 'trainee'].map(async (type) => {
      const results = await sheetsDb.getSubmissions({
        certificateType: type,
        search: holderName,
        limit: 100
      });
      
      return results.data.filter(cert => 
        cert.full_name?.toLowerCase().includes(holderName.toLowerCase()) &&
        cert.course_name?.toLowerCase().includes(course.toLowerCase()) &&
        cert.email_address?.toLowerCase() === email.toLowerCase() &&
        cert.status === 'issued'
      );
    });

    const searchResults = await Promise.all(searchPromises);
    const allMatches = searchResults.flat();

    if (allMatches.length === 0) {
      return res.json({
        valid: false,
        error: 'Certificate not found',
        message: 'No certificate found matching the provided details.'
      });
    }

    // Return the first match
    const certificate = allMatches[0];

    res.json({
      valid: true,
      status: 'valid',
      message: 'Certificate found and is valid.',
      certificateData: {
        referenceNumber: certificate.verification_code || certificate.certificate_id,
        certificateType: certificate.certificate_type,
        holderName: certificate.full_name,
        email: certificate.email_address,
        course: certificate.course_name,
        batch: certificate.batch_initials,
        gpa: certificate.gpa,
        attendance: certificate.attendance_percentage,
        startDate: certificate.start_date,
        endDate: certificate.end_date,
        issuedDate: certificate.issued_date,
        verificationUrl: certificate.certificate_url
      }
    });

  } catch (error) {
    console.error('❌ Error in manual verification:', error);
    res.status(500).json({
      valid: false,
      error: 'Verification failed',
      message: 'An error occurred while searching for the certificate.'
    });
  }
});

// Revoke certificate
router.post('/revoke/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log('🚫 Revoking certificate:', id);
    
    const updatedSubmission = await sheetsDb.updateSubmission(id, {
      status: 'revoked',
      revocation_reason: reason || 'No reason provided',
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (!updatedSubmission) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      certificateId: updatedSubmission.certificate_id,
      reason: reason
    });

  } catch (error) {
    console.error('❌ Error revoking certificate:', error);
    res.status(500).json({ 
      error: 'Failed to revoke certificate',
      message: error.message 
    });
  }
});

// Helper function to get template for submission
function getTemplateForSubmission(submission) {
  const courseMap = {
    'cloud computing': 'CC.jpg',
    'java': 'G12 Java.jpg',
    'python': 'G28 Python.jpg',
    'vlsi': 'G16 VLSI.jpg',
    'autocad': 'Autocad.jpg',
    'data structures': 'DSA.jpg',
    'robotics': 'ROBOTICS.jpg',
    'sap fico': 'SAP FICO.jpg'
  };

  const courseLower = (submission.course_name || '').toLowerCase();
  
  // Try to find a matching template
  for (const [keyword, template] of Object.entries(courseMap)) {
    if (courseLower.includes(keyword)) {
      return template;
    }
  }

  // Default based on certificate type
  switch (submission.certificate_type) {
    case 'trainer':
      return 'G12 Java.jpg'; // Default trainer template
    case 'trainee':
      return 'G13 JAVA.jpg'; // Default trainee template  
    default:
      return 'CC.jpg'; // Default student template
  }
}

// Generate reference number (sheets-based)
async function generateCertificateRefNo(submission) {
  const year = new Date().getFullYear();
  const type = submission.certificate_type.toUpperCase();
  const course = (submission.course_name || 'GEN').replace(/\s+/g, '').substring(0, 4).toUpperCase();
  const batch = (submission.batch_initials || 'B00').toUpperCase();
  
  // Get count of certificates for this type this year from sheets
  let counter = 1;
  try {
    const stats = await sheetsDb.getStats();
    const typeStats = stats[submission.certificate_type];
    if (typeStats) {
      counter = (typeStats.issued || 0) + 1;
    }
  } catch (error) {
    console.log('⚠️ Could not get certificate count, using default counter');
    counter = Math.floor(Math.random() * 1000) + 1; // Fallback to random number
  }
  
  return `${type}_${course}_${batch}_${year}_${counter.toString().padStart(4, '0')}`;
}

module.exports = router;
