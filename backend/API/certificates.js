const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const { generateCertificate } = require('../services/certificateGenerator');
const QRCode = require('qrcode');

// Get all certificates with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // student, trainer, trainee
    const status = req.query.status; // pending, generated, issued, revoked
    const offset = (page - 1) * limit;

    let query = '';
    let countQuery = '';
    let params = [];

    if (type) {
      switch (type) {
        case 'student':
          query = `
            SELECT sc.*, c.course_name, b.batch_name, ct.template_name
            FROM student_certificates sc
            JOIN courses c ON sc.course_id = c.course_id
            JOIN batches b ON sc.batch_id = b.batch_id
            JOIN certificate_templates ct ON sc.template_id = ct.template_id
          `;
          countQuery = 'SELECT COUNT(*) as total FROM student_certificates sc';
          break;
        case 'trainer':
          query = `
            SELECT tc.*, c.course_name, b.batch_name, ct.template_name
            FROM trainer_certificates tc
            JOIN courses c ON tc.course_id = c.course_id
            JOIN batches b ON tc.batch_id = b.batch_id
            JOIN certificate_templates ct ON tc.template_id = ct.template_id
          `;
          countQuery = 'SELECT COUNT(*) as total FROM trainer_certificates tc';
          break;
        case 'trainee':
          query = `
            SELECT tc.*, c.course_name, b.batch_name, ct.template_name
            FROM trainee_certificates tc
            JOIN courses c ON tc.course_id = c.course_id
            JOIN batches b ON tc.batch_id = b.batch_id
            JOIN certificate_templates ct ON tc.template_id = ct.template_id
          `;
          countQuery = 'SELECT COUNT(*) as total FROM trainee_certificates tc';
          break;
      }

      if (status) {
        query += ` WHERE ${type === 'trainer' || type === 'trainee' ? 'tc' : 'sc'}.status = ?`;
        countQuery += ` WHERE status = ?`;
        params.push(status);
      }
    } else {
      // Return all certificate types
      query = `
        (SELECT 'student' as cert_type, certificate_id, certificate_ref_no, full_name, email, status, generated_at FROM student_certificates)
        UNION ALL
        (SELECT 'trainer' as cert_type, certificate_id, certificate_ref_no, full_name, email, status, generated_at FROM trainer_certificates)
        UNION ALL
        (SELECT 'trainee' as cert_type, certificate_id, certificate_ref_no, full_name, email, status, generated_at FROM trainee_certificates)
      `;
      countQuery = `
        SELECT SUM(total) as total FROM (
          (SELECT COUNT(*) as total FROM student_certificates)
          UNION ALL
          (SELECT COUNT(*) as total FROM trainer_certificates)
          UNION ALL
          (SELECT COUNT(*) as total FROM trainee_certificates)
        ) as counts
      `;
    }

    query += ` ORDER BY generated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [certificates] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, status ? [status] : []);
    const total = countResult[0].total;

    res.json({
      certificates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Generate certificate
router.post('/generate/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // Validate certificate type
    if (!['student', 'trainer', 'trainee'].includes(type)) {
      return res.status(400).json({ error: 'Invalid certificate type' });
    }

    // Get certificate data
    const certificateData = await getCertificateData(type, id);
    if (!certificateData) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Check if already generated
    if (certificateData.status === 'generated' || certificateData.status === 'issued') {
      return res.json({
        message: 'Certificate already generated',
        certificateUrl: `${process.env.BACKEND_URL}/certificates/${certificateData.certificate_file_path}`
      });
    }

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(certificateData.verification_url);

    // Generate certificate image
    const certificateFilePath = await generateCertificate(certificateData, type);

    // Update database
    await updateCertificateStatus(type, id, 'generated', certificateFilePath, qrCodeData);

    res.json({
      success: true,
      message: 'Certificate generated successfully',
      certificateUrl: `${process.env.BACKEND_URL}/certificates/${certificateFilePath}`,
      verificationUrl: certificateData.verification_url,
      referenceNumber: certificateData.certificate_ref_no
    });

  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// Get specific certificate
router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    const certificateData = await getCertificateData(type, id);
    if (!certificateData) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json(certificateData);

  } catch (error) {
    console.error('❌ Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Update certificate status
router.patch('/:type/:id/status', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'generated', 'issued', 'revoked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await updateCertificateStatus(type, id, status);

    res.json({
      success: true,
      message: `Certificate status updated to ${status}`
    });

  } catch (error) {
    console.error('❌ Error updating certificate status:', error);
    res.status(500).json({ error: 'Failed to update certificate status' });
  }
});

// Bulk generate certificates
router.post('/bulk-generate', async (req, res) => {
  try {
    const { certificates } = req.body; // Array of {type, id}
    
    if (!Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({ error: 'Invalid certificates array' });
    }

    const results = [];
    
    for (const cert of certificates) {
      try {
        const certificateData = await getCertificateData(cert.type, cert.id);
        if (certificateData && certificateData.status === 'pending') {
          const qrCodeData = await QRCode.toDataURL(certificateData.verification_url);
          const certificateFilePath = await generateCertificate(certificateData, cert.type);
          await updateCertificateStatus(cert.type, cert.id, 'generated', certificateFilePath, qrCodeData);
          
          results.push({
            id: cert.id,
            type: cert.type,
            status: 'success',
            certificateUrl: `${process.env.BACKEND_URL}/certificates/${certificateFilePath}`
          });
        } else {
          results.push({
            id: cert.id,
            type: cert.type,
            status: 'skipped',
            reason: 'Already generated or not found'
          });
        }
      } catch (error) {
        results.push({
          id: cert.id,
          type: cert.type,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${certificates.length} certificates`,
      results
    });

  } catch (error) {
    console.error('❌ Error in bulk generation:', error);
    res.status(500).json({ error: 'Failed to bulk generate certificates' });
  }
});

// Helper functions
async function getCertificateData(type, id) {
  let query;
  
  switch (type) {
    case 'student':
      query = `
        SELECT sc.*, c.course_name, b.batch_name, b.batch_initials, ct.template_name, ct.template_file_path
        FROM student_certificates sc
        JOIN courses c ON sc.course_id = c.course_id
        JOIN batches b ON sc.batch_id = b.batch_id
        JOIN certificate_templates ct ON sc.template_id = ct.template_id
        WHERE sc.certificate_id = ?
      `;
      break;
    case 'trainer':
      query = `
        SELECT tc.*, c.course_name, b.batch_name, b.batch_initials, ct.template_name, ct.template_file_path
        FROM trainer_certificates tc
        JOIN courses c ON tc.course_id = c.course_id
        JOIN batches b ON tc.batch_id = b.batch_id
        JOIN certificate_templates ct ON tc.template_id = ct.template_id
        WHERE tc.certificate_id = ?
      `;
      break;
    case 'trainee':
      query = `
        SELECT tc.*, c.course_name, b.batch_name, b.batch_initials, ct.template_name, ct.template_file_path
        FROM trainee_certificates tc
        JOIN courses c ON tc.course_id = c.course_id
        JOIN batches b ON tc.batch_id = b.batch_id
        JOIN certificate_templates ct ON tc.template_id = ct.template_id
        WHERE tc.certificate_id = ?
      `;
      break;
  }

  const [rows] = await pool.execute(query, [id]);
  return rows[0] || null;
}

async function updateCertificateStatus(type, id, status, filePath = null, qrCodeData = null) {
  let query;
  let params = [status];
  
  if (filePath) params.push(filePath);
  if (qrCodeData) params.push(qrCodeData);
  params.push(id);

  switch (type) {
    case 'student':
      query = `UPDATE student_certificates SET status = ?`;
      if (filePath) query += `, certificate_file_path = ?`;
      if (qrCodeData) query += `, qr_code_data = ?`;
      query += ` WHERE certificate_id = ?`;
      break;
    case 'trainer':
      query = `UPDATE trainer_certificates SET status = ?`;
      if (filePath) query += `, certificate_file_path = ?`;
      if (qrCodeData) query += `, qr_code_data = ?`;
      query += ` WHERE certificate_id = ?`;
      break;
    case 'trainee':
      query = `UPDATE trainee_certificates SET status = ?`;
      if (filePath) query += `, certificate_file_path = ?`;
      if (qrCodeData) query += `, qr_code_data = ?`;
      query += ` WHERE certificate_id = ?`;
      break;
  }

  await pool.execute(query, params);
}

module.exports = router;
