const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { generateCertificate } = require('../services/certificateGenerator');
const QRCode = require('qrcode');

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
      dbService.query(query, params),
      dbService.query(countQuery, countParams)
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
    
    // Get form submission data
    const submissionQuery = `
      SELECT * FROM form_submissions 
      WHERE submission_id = $1 AND status = 'pending'
    `;
    
    const submissionResult = await dbService.query(submissionQuery, [submissionId]);
    
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Form submission not found or not in pending status' 
      });
    }

    const submission = submissionResult.rows[0];

    // Check if certificate already exists
    const existingCertQuery = `
      SELECT certificate_ref_no FROM certificate_generations 
      WHERE submission_id = $1
    `;
    
    const existingResult = await dbService.query(existingCertQuery, [submissionId]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Certificate already generated',
        referenceNumber: existingResult.rows[0].certificate_ref_no
      });
    }

    // Generate certificate reference number
    const refNo = await generateCertificateRefNo(submission);

    // Generate QR code
    const verificationUrl = `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${refNo}`;
    const qrCodeData = await QRCode.toDataURL(verificationUrl);

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

    // Generate the actual certificate files
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

    const generatedFiles = await generateCertificate(certificateData);

    // Store certificate generation record
    const insertCertQuery = `
      INSERT INTO certificate_generations (
        submission_id, certificate_ref_no, verification_url, qr_code_data,
        certificate_image_path, certificate_pdf_path, template_id,
        generated_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, 'generated')
      RETURNING certificate_id
    `;

    const certResult = await dbService.query(insertCertQuery, [
      submissionId, refNo, verificationUrl, qrCodeData,
      generatedFiles.imagePath, generatedFiles.pdfPath, templateId
    ]);

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

        const generatedFiles = await generateCertificate(certificateData);

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

module.exports = router;
