const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { generateCertificate, generateSimpleCertificate } = require('../services/certificateGenerator');
const QRCode = require('qrcode');

// Initialize database connection
let pool;
try {
  pool = dbService.getPool();
  console.log('✅ Database service initialized for certificates API');
} catch (error) {
  console.error('❌ Database service initialization failed:', error);
}

// Test endpoint to check API health
router.get('/test', async (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      message: 'Certificates API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all certificates with pagination (now working with form_submissions)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // student, trainer, trainee
    const status = req.query.status; // pending, generated, issued, revoked
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (type) {
      whereClause += ` WHERE fs.certificate_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      whereClause += whereClause ? ` AND fs.status = $${paramIndex}` : ` WHERE fs.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const query = `
      SELECT 
        fs.submission_id as id,
        fs.submission_id,
        fs.full_name,
        fs.email_address as email,
        fs.phone,
        fs.course_name,
        fs.batch_initials,
        fs.certificate_type,
        fs.status,
        fs.gpa,
        fs.attendance_percentage,
        fs.assessment_score,
        fs.organization,
        fs.position,
        fs.created_at,
        fs.updated_at,
        cg.certificate_ref_no,
        cg.certificate_id,
        cg.verification_url,
        cg.generated_at
      FROM form_submissions fs
      LEFT JOIN certificate_generations cg ON fs.submission_id = cg.submission_id
      ${whereClause}
      ORDER BY fs.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const countQuery = `SELECT COUNT(*) as total FROM form_submissions fs ${whereClause}`;
    const countParams = params.slice(0, -2); // Remove limit and offset

    const [certificates, countResult] = await Promise.all([
      pool ? pool.query(query, params) : dbService.query(query, params),
      pool ? pool.query(countQuery, countParams) : dbService.query(countQuery, countParams)
    ]);

    res.json({
      certificates: certificates.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
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
    
    const query = `
      SELECT 
        fs.*,
        cg.certificate_ref_no,
        cg.certificate_id,
        cg.verification_url,
        cg.qr_code_data,
        cg.certificate_image_path,
        cg.certificate_pdf_path,
        cg.generated_at,
        cg.status as certificate_status
      FROM form_submissions fs
      LEFT JOIN certificate_generations cg ON fs.submission_id = cg.submission_id
      WHERE fs.submission_id = $1
    `;
    
    const result = await dbService.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate/submission not found' });
    }

    res.json(result.rows[0]);

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
    
    // Get form submission data
    const submissionQuery = `
      SELECT * FROM form_submissions 
      WHERE submission_id = $1
    `;
    
    const submissionResult = await dbService.query(submissionQuery, [submissionId]);
    
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Form submission not found' 
      });
    }

    const submission = submissionResult.rows[0];

    // Initialize variables
    let refNo;
    let verificationUrl;

    // Check if certificate already exists and has actual files
    const existingCertQuery = `
      SELECT certificate_ref_no, certificate_image_path, certificate_pdf_path 
      FROM certificate_generations 
      WHERE submission_id = $1
    `;
    
    const existingResult = await dbService.query(existingCertQuery, [submissionId]);
    
    if (existingResult.rows.length > 0 && !forceRegenerate) {
      const existing = existingResult.rows[0];
      
      // Check if actual files exist
      const fs = require('fs').promises;
      const path = require('path');
      let filesExist = false;
      
      try {
        if (existing.certificate_image_path && existing.certificate_pdf_path) {
          const imgPath = path.join(__dirname, '..', existing.certificate_image_path);
          const pdfPath = path.join(__dirname, '..', existing.certificate_pdf_path);
          
          await fs.access(imgPath);
          await fs.access(pdfPath);
          filesExist = true;
        }
      } catch (error) {
        console.log(`📂 Certificate files missing for ${existing.certificate_ref_no}, allowing re-generation`);
        filesExist = false;
      }
      
      if (filesExist) {
        return res.status(400).json({ 
          error: 'Certificate already generated with files',
          referenceNumber: existing.certificate_ref_no,
          message: 'Certificate files already exist. Use force=true to regenerate.'
        });
      } else {
        console.log(`🔄 Re-generating certificate ${existing.certificate_ref_no} (files missing)`);
        // Continue with generation using existing reference number
        refNo = existing.certificate_ref_no;
        verificationUrl = `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${refNo}`;
      }
    } else {
      // Generate new certificate reference number and verification URL
      refNo = await generateCertificateRefNo(submission);
      verificationUrl = `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${refNo}`;
    }

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(verificationUrl || `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${refNo}`);

    // Get appropriate template
    const templateQuery = `
      SELECT template_id, template_path 
      FROM certificate_templates 
      WHERE template_type = $1 AND is_active = true 
      LIMIT 1
    `;
    
    const templateResult = await dbService.query(templateQuery, [submission.certificate_type]);
    let templateId = null;
    let templatePath = 'G1 CC.jpg'; // Default template
    
    if (templateResult.rows.length > 0) {
      templateId = templateResult.rows[0].template_id;
      templatePath = templateResult.rows[0].template_path;
    }

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

    const generatedFiles = await generateSimpleCertificate(certificateData);

    // Store or update certificate generation record
    let certResult;
    if (existingResult.rows.length > 0) {
      // Update existing certificate record with new file paths
      const updateCertQuery = `
        UPDATE certificate_generations SET
          verification_url = $1, qr_code_data = $2,
          certificate_image_path = $3, certificate_pdf_path = $4,
          generated_at = CURRENT_TIMESTAMP, status = 'generated'
        WHERE submission_id = $5
        RETURNING certificate_id
      `;

      certResult = await dbService.query(updateCertQuery, [
        verificationUrl, qrCodeData,
        generatedFiles.imagePath, generatedFiles.pdfPath, submissionId
      ]);
    } else {
      // Insert new certificate record
      const insertCertQuery = `
        INSERT INTO certificate_generations (
          submission_id, certificate_ref_no, verification_url, qr_code_data,
          certificate_image_path, certificate_pdf_path, template_id,
          generated_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, 'generated')
        RETURNING certificate_id
      `;

      certResult = await dbService.query(insertCertQuery, [
        submissionId, refNo, verificationUrl, qrCodeData,
        generatedFiles.imagePath, generatedFiles.pdfPath, templateId
      ]);
    }

    // Update form submission status
    await dbService.query(
      'UPDATE form_submissions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE submission_id = $2',
      ['generated', submissionId]
    );

    console.log('✅ Certificate generated successfully:', refNo);

    res.json({
      success: true,
      message: 'Certificate generated successfully',
      certificateId: certResult.rows[0].certificate_id,
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

// Generate reference number
async function generateCertificateRefNo(submission) {
  const year = new Date().getFullYear();
  const type = submission.certificate_type.toUpperCase();
  const course = (submission.course_name || 'GEN').replace(/\s+/g, '').substring(0, 4).toUpperCase();
  const batch = (submission.batch_initials || 'B00').toUpperCase();
  
  // Get count of certificates for this type this year
  const countQuery = `
    SELECT COUNT(*) as count FROM certificate_generations cg
    JOIN form_submissions fs ON cg.submission_id = fs.submission_id
    WHERE fs.certificate_type = $1 
    AND EXTRACT(YEAR FROM cg.created_at) = $2
  `;
  
  const countResult = await dbService.query(countQuery, [submission.certificate_type, year]);
  const counter = parseInt(countResult.rows[0].count) + 1;
  
  return `${type}_${course}_${batch}_${year}_${counter.toString().padStart(4, '0')}`;
}

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
        // Check submission status
        const checkQuery = `
          SELECT fs.*, cg.certificate_ref_no 
          FROM form_submissions fs
          LEFT JOIN certificate_generations cg ON fs.submission_id = cg.submission_id
          WHERE fs.submission_id = $1
        `;
        
        const checkResult = await dbService.query(checkQuery, [submissionId]);
        
        if (checkResult.rows.length === 0) {
          results.failed.push({ submissionId, error: 'Submission not found' });
          continue;
        }

        const submission = checkResult.rows[0];

        if (submission.certificate_ref_no) {
          results.skipped.push({ 
            submissionId, 
            reason: 'Certificate already exists',
            refNo: submission.certificate_ref_no 
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
          templatePath: 'G1 CC.jpg', // Default template
          gpa: submission.gpa,
          attendance: submission.attendance_percentage
        };

        const generatedFiles = await generateSimpleCertificate(certificateData);

        // Store certificate generation record
        const insertCertQuery = `
          INSERT INTO certificate_generations (
            submission_id, certificate_ref_no, verification_url, qr_code_data,
            certificate_image_path, certificate_pdf_path,
            generated_at, status
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 'generated')
          RETURNING certificate_id
        `;

        const certResult = await dbService.query(insertCertQuery, [
          submissionId, refNo, verificationUrl, qrCodeData,
          generatedFiles.imagePath, generatedFiles.pdfPath
        ]);

        // Update form submission status
        await dbService.query(
          'UPDATE form_submissions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE submission_id = $2',
          ['generated', submissionId]
        );

        results.generated.push({
          submissionId,
          certificateId: certResult.rows[0].certificate_id,
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
    
    const query = `
      SELECT 
        fs.full_name,
        fs.email_address,
        fs.course_name,
        fs.batch_initials,
        fs.certificate_type,
        fs.gpa,
        fs.attendance_percentage,
        fs.start_date,
        fs.end_date,
        cg.certificate_ref_no,
        cg.verification_url,
        cg.generated_at,
        cg.status
      FROM certificate_generations cg
      JOIN form_submissions fs ON cg.submission_id = fs.submission_id
      WHERE cg.certificate_ref_no = $1
    `;
    
    const result = await dbService.query(query, [refNo]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        error: 'Certificate not found',
        message: 'The provided reference number does not match any certificate in our records.'
      });
    }

    const cert = result.rows[0];

    // Update verification count
    await dbService.query(
      'UPDATE certificate_generations SET verification_count = verification_count + 1, last_verified = CURRENT_TIMESTAMP WHERE certificate_ref_no = $1',
      [refNo]
    );

    res.json({
      valid: true,
      status: 'valid',
      message: 'Certificate is valid and authentic.',
      certificateData: {
        referenceNumber: cert.certificate_ref_no,
        certificateType: cert.certificate_type,
        holderName: cert.full_name,
        email: cert.email_address,
        course: cert.course_name,
        batch: cert.batch_initials,
        gpa: cert.gpa,
        attendance: cert.attendance_percentage,
        startDate: cert.start_date,
        endDate: cert.end_date,
        issuedDate: cert.generated_at,
        verificationUrl: cert.verification_url
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

    const query = `
      SELECT 
        fs.full_name,
        fs.email_address,
        fs.course_name,
        fs.batch_initials,
        fs.certificate_type,
        fs.gpa,
        fs.attendance_percentage,
        fs.start_date,
        fs.end_date,
        cg.certificate_ref_no,
        cg.verification_url,
        cg.generated_at,
        cg.status
      FROM form_submissions fs
      LEFT JOIN certificate_generations cg ON fs.submission_id = cg.submission_id
      WHERE LOWER(fs.full_name) = LOWER($1) 
      AND LOWER(fs.course_name) = LOWER($2)
      AND LOWER(fs.email_address) = LOWER($3)
      AND cg.certificate_ref_no IS NOT NULL
    `;
    
    const result = await dbService.query(query, [holderName, course, email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        error: 'Certificate not found',
        message: 'No certificate found matching the provided details.'
      });
    }

    const cert = result.rows[0];

    // Update verification count
    if (cert.certificate_ref_no) {
      await dbService.query(
        'UPDATE certificate_generations SET verification_count = verification_count + 1, last_verified = CURRENT_TIMESTAMP WHERE certificate_ref_no = $1',
        [cert.certificate_ref_no]
      );
    }

    res.json({
      valid: true,
      status: 'valid',
      message: 'Certificate is valid and authentic.',
      certificateData: {
        referenceNumber: cert.certificate_ref_no,
        certificateType: cert.certificate_type,
        holderName: cert.full_name,
        email: cert.email_address,
        course: cert.course_name,
        batch: cert.batch_initials,
        gpa: cert.gpa,
        attendance: cert.attendance_percentage,
        startDate: cert.start_date,
        endDate: cert.end_date,
        issuedDate: cert.generated_at,
        verificationUrl: cert.verification_url
      }
    });

  } catch (error) {
    console.error('❌ Error in manual verification:', error);
    res.status(500).json({
      valid: false,
      error: 'Verification failed',
      message: 'An error occurred while verifying the certificate.'
    });
  }
});

// Revoke certificate
router.post('/revoke/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { reason, revokedBy } = req.body;
    
    console.log(`🔄 Attempting to revoke certificate for submission ID: ${submissionId}`);
    
    // Check if the certificate exists and is in a revokable state
    const checkQuery = `
      SELECT submission_id, full_name, email_address, status
      FROM form_submissions 
      WHERE submission_id = $1
    `;
    
    const checkResult = await (pool ? pool.query(checkQuery, [submissionId]) : dbService.query(checkQuery, [submissionId]));
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Certificate not found',
        message: 'No certificate found with the provided ID.' 
      });
    }
    
    const submission = checkResult.rows[0];
    
    // Check if certificate can be revoked (must be generated or issued)
    if (!['generated', 'issued'].includes(submission.status)) {
      return res.status(400).json({
        error: 'Cannot revoke certificate',
        message: `Certificate with status '${submission.status}' cannot be revoked. Only generated or issued certificates can be revoked.`
      });
    }
    
    // Check if already revoked
    if (submission.status === 'revoked') {
      return res.status(400).json({
        error: 'Certificate already revoked',
        message: 'This certificate has already been revoked.'
      });
    }

    // Get certificate generation details for reference
    const certGenQuery = `
      SELECT certificate_ref_no, certificate_id 
      FROM certificate_generations 
      WHERE submission_id = $1
    `;
    
    const certGenResult = await (pool ? pool.query(certGenQuery, [submissionId]) : dbService.query(certGenQuery, [submissionId]));
    
    let certificateRefNo = null;
    let certificateId = null;
    if (certGenResult.rows.length > 0) {
      certificateRefNo = certGenResult.rows[0].certificate_ref_no;
      certificateId = certGenResult.rows[0].certificate_id;
    }
    
    // Update the submission status to revoked
    const revokeSubmissionQuery = `
      UPDATE form_submissions 
      SET 
        status = 'revoked',
        revoked_at = CURRENT_TIMESTAMP,
        revocation_reason = $2,
        revoked_by = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE submission_id = $1
      RETURNING submission_id, full_name, email_address, status, revoked_at, revocation_reason, revoked_by
    `;
    
    const revokeSubmissionParams = [
      submissionId,
      reason || 'Revoked by administrator',
      revokedBy || 'admin'
    ];
    
    const revokeSubmissionResult = await (pool ? pool.query(revokeSubmissionQuery, revokeSubmissionParams) : dbService.query(revokeSubmissionQuery, revokeSubmissionParams));
    
    if (revokeSubmissionResult.rows.length === 0) {
      return res.status(500).json({
        error: 'Failed to revoke certificate submission',
        message: 'Certificate submission revocation failed due to database error.'
      });
    }

    // Also update the certificate generation status if it exists
    if (certificateId) {
      const revokeCertGenQuery = `
        UPDATE certificate_generations 
        SET 
          status = 'revoked',
          updated_at = CURRENT_TIMESTAMP
        WHERE certificate_id = $1
      `;
      
      await (pool ? pool.query(revokeCertGenQuery, [certificateId]) : dbService.query(revokeCertGenQuery, [certificateId]));
    }
    
    const revokedSubmission = revokeSubmissionResult.rows[0];

    console.log(`✅ Certificate revoked successfully:`, {
      id: submissionId,
      name: revokedSubmission.full_name,
      refNo: certificateRefNo,
      reason: reason
    });

    // Return success response
    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      certificate: {
        id: revokedSubmission.submission_id,
        certificate_ref_no: certificateRefNo,
        full_name: revokedSubmission.full_name,
        email: revokedSubmission.email_address,
        status: revokedSubmission.status,
        revoked_at: revokedSubmission.revoked_at,
        revocation_reason: revokedSubmission.revocation_reason,
        revoked_by: revokedSubmission.revoked_by
      }
    });

  } catch (error) {
    console.error('❌ Error revoking certificate:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to revoke certificate. Please try again later.',
      details: error.message 
    });
  }
});

// Test QR code generation endpoint
router.get('/test-qr/:text?', async (req, res) => {
  try {
    const testText = req.params.text || 'http://localhost:3000/verify/TEST_123';
    
    console.log('🔄 Testing QR code generation for:', testText);
    
    // Test basic QR code generation
    const qrDataURL = await QRCode.toDataURL(testText, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    // Test buffer generation
    const qrBuffer = await QRCode.toBuffer(testText, {
      width: 150,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      type: 'png'
    });
    
    console.log('✅ QR code generation test successful');
    
    res.json({
      success: true,
      message: 'QR code generation working',
      qrDataURL: qrDataURL,
      bufferSize: qrBuffer.length,
      testText: testText,
      qrCodeStats: {
        dataURLLength: qrDataURL.length,
        bufferLength: qrBuffer.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ QR code generation test failed:', error);
    res.status(500).json({
      success: false,
      error: 'QR code generation failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// Test revocation functionality
router.get('/test-revoke/:id?', async (req, res) => {
  try {
    const testId = req.params.id || '1';
    
    console.log('🔄 Testing revocation functionality for ID:', testId);
    
    // Test database connection
    const testQuery = `SELECT submission_id, full_name, status FROM form_submissions LIMIT 5`;
    const testResult = await (pool ? pool.query(testQuery) : dbService.query(testQuery));
    
    console.log('✅ Database connection test successful');
    
    res.json({
      success: true,
      message: 'Revocation functionality test',
      databaseStatus: 'Connected',
      sampleRecords: testResult.rows.length,
      availableCertificates: testResult.rows.map(row => ({
        id: row.submission_id,
        name: row.full_name,
        status: row.status
      })),
      instructions: {
        revoke: `POST /api/certificates/revoke/${testId}`,
        payload: {
          reason: 'Test revocation',
          revokedBy: 'admin'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Revocation test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Revocation test failed',
      message: error.message,
      databaseStatus: 'Error'
    });
  }
});

// Direct certificate generation endpoint (for testing and API usage)
router.post('/generate-direct', async (req, res) => {
  try {
    console.log('🔄 Direct certificate generation request received');
    console.log('📝 Request body:', req.body);
    
    const certificateData = {
      name: req.body.full_name || req.body.name,
      course: req.body.course_name || req.body.course,
      batch: req.body.batch_initials || req.body.batch,
      type: req.body.certificate_type || 'completion',
      startDate: req.body.start_date,
      endDate: req.body.end_date,
      gpa: req.body.gpa || '8.5'
    };
    
    console.log('🎯 Processed certificate data:', certificateData);
    
    // Generate certificate using our enhanced system
    const result = await generateSimpleCertificate(certificateData);
    
    console.log('✅ Certificate generation completed');
    
    // Return comprehensive response with QR code data
    res.json({
      success: true,
      message: 'Certificate generated successfully via direct API',
      certificateData: result.certificateData,
      paths: {
        imagePath: result.imagePath,
        pdfPath: result.pdfPath
      },
      qrCodeData: result.certificateData.qrCodeData,
      verificationUrl: result.certificateData.verificationUrl,
      referenceNumber: result.certificateData.referenceNumber,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Direct certificate generation failed:', error);
    res.status(500).json({
      error: 'Certificate generation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
