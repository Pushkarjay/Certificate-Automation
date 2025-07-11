const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Verify certificate by reference number
router.get('/:refNo', async (req, res) => {
  try {
    const { refNo } = req.params;
    
    // Search in all certificate tables
    const certificateData = await findCertificateByRefNo(refNo);
    
    if (!certificateData) {
      return res.status(404).json({
        valid: false,
        error: 'Certificate not found',
        message: 'The provided reference number does not match any certificate in our records.'
      });
    }

    // Check if certificate is revoked
    if (certificateData.status === 'revoked') {
      return res.json({
        valid: false,
        status: 'revoked',
        message: 'This certificate has been revoked.',
        certificateData: {
          referenceNumber: certificateData.certificate_ref_no,
          holderName: certificateData.full_name,
          course: certificateData.course_name,
          issuedDate: certificateData.generated_at
        }
      });
    }

    // Check if certificate is issued
    if (certificateData.status !== 'issued' && certificateData.status !== 'generated') {
      return res.json({
        valid: false,
        status: 'pending',
        message: 'This certificate is still being processed.',
        certificateData: {
          referenceNumber: certificateData.certificate_ref_no,
          holderName: certificateData.full_name,
          course: certificateData.course_name
        }
      });
    }

    // Certificate is valid
    res.json({
      valid: true,
      status: 'valid',
      message: 'Certificate is valid and authentic.',
      certificateData: {
        referenceNumber: certificateData.certificate_ref_no,
        certificateType: certificateData.cert_type,
        holderName: certificateData.full_name,
        email: certificateData.email,
        course: certificateData.course_name,
        batch: certificateData.batch_name,
        batchInitials: certificateData.batch_initials,
        startDate: certificateData.start_date || certificateData.training_start_date,
        endDate: certificateData.end_date || certificateData.training_end_date,
        gpa: certificateData.gpa,
        performanceRating: certificateData.performance_rating,
        trainingHours: certificateData.training_hours || certificateData.training_duration_hours,
        attendancePercentage: certificateData.attendance_percentage,
        assessmentScore: certificateData.assessment_score,
        organization: certificateData.organization,
        position: certificateData.position,
        issuedDate: certificateData.generated_at,
        verificationUrl: certificateData.verification_url,
        templateUsed: certificateData.template_name
      }
    });

  } catch (error) {
    console.error('❌ Error verifying certificate:', error);
    res.status(500).json({
      valid: false,
      error: 'Verification failed',
      message: 'An error occurred while verifying the certificate. Please try again later.'
    });
  }
});

// Get verification statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        'student' as type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated,
        SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked
      FROM student_certificates
      UNION ALL
      SELECT 
        'trainer' as type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated,
        SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked
      FROM trainer_certificates
      UNION ALL
      SELECT 
        'trainee' as type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated,
        SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked
      FROM trainee_certificates
    `);

    // Calculate totals
    const totals = stats.reduce((acc, row) => {
      acc.total += row.total;
      acc.pending += row.pending;
      acc.generated += row.generated;
      acc.issued += row.issued;
      acc.revoked += row.revoked;
      return acc;
    }, { total: 0, pending: 0, generated: 0, issued: 0, revoked: 0 });

    res.json({
      overview: totals,
      byType: stats
    });

  } catch (error) {
    console.error('❌ Error fetching verification stats:', error);
    res.status(500).json({ error: 'Failed to fetch verification statistics' });
  }
});

// Search certificates by name or email
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const searchTerm = `%${query}%`;

    const [results] = await pool.execute(`
      SELECT 'student' as cert_type, certificate_id, certificate_ref_no, full_name, email, status, generated_at
      FROM student_certificates 
      WHERE full_name LIKE ? OR email LIKE ?
      UNION ALL
      SELECT 'trainer' as cert_type, certificate_id, certificate_ref_no, full_name, email, status, generated_at
      FROM trainer_certificates 
      WHERE full_name LIKE ? OR email LIKE ?
      UNION ALL
      SELECT 'trainee' as cert_type, certificate_id, certificate_ref_no, full_name, email, status, generated_at
      FROM trainee_certificates 
      WHERE full_name LIKE ? OR email LIKE ?
      ORDER BY generated_at DESC
      LIMIT 50
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);

    res.json({
      query,
      results,
      count: results.length
    });

  } catch (error) {
    console.error('❌ Error searching certificates:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Helper function to find certificate by reference number
async function findCertificateByRefNo(refNo) {
  // Search in student certificates
  const [studentResults] = await pool.execute(`
    SELECT 'student' as cert_type, sc.*, c.course_name, b.batch_name, b.batch_initials, ct.template_name
    FROM student_certificates sc
    JOIN courses c ON sc.course_id = c.course_id
    JOIN batches b ON sc.batch_id = b.batch_id
    JOIN certificate_templates ct ON sc.template_id = ct.template_id
    WHERE sc.certificate_ref_no = ?
  `, [refNo]);

  if (studentResults.length > 0) {
    return studentResults[0];
  }

  // Search in trainer certificates
  const [trainerResults] = await pool.execute(`
    SELECT 'trainer' as cert_type, tc.*, c.course_name, b.batch_name, b.batch_initials, ct.template_name
    FROM trainer_certificates tc
    JOIN courses c ON tc.course_id = c.course_id
    JOIN batches b ON tc.batch_id = b.batch_id
    JOIN certificate_templates ct ON tc.template_id = ct.template_id
    WHERE tc.certificate_ref_no = ?
  `, [refNo]);

  if (trainerResults.length > 0) {
    return trainerResults[0];
  }

  // Search in trainee certificates
  const [traineeResults] = await pool.execute(`
    SELECT 'trainee' as cert_type, tc.*, c.course_name, b.batch_name, b.batch_initials, ct.template_name
    FROM trainee_certificates tc
    JOIN courses c ON tc.course_id = c.course_id
    JOIN batches b ON tc.batch_id = b.batch_id
    JOIN certificate_templates ct ON tc.template_id = ct.template_id
    WHERE tc.certificate_ref_no = ?
  `, [refNo]);

  if (traineeResults.length > 0) {
    return traineeResults[0];
  }

  return null;
}

module.exports = router;
