const express = require('express');
const router = express.Router();
const sheetsDb = require('../services/sheetsDatabase');

// Verify certificate by reference number
router.get('/:refNo', async (req, res) => {
  try {
    const { refNo } = req.params;
    
    console.log('🔍 Verifying certificate:', refNo);
    
    // Search across all sheets for the certificate
    const certificateData = await sheetsDb.findByVerificationCode(refNo);
    
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
          referenceNumber: certificateData.verification_code || certificateData.certificate_id,
          holderName: certificateData.full_name,
          course: certificateData.course_name,
          issuedDate: certificateData.issued_date
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
          referenceNumber: certificateData.verification_code || certificateData.certificate_id,
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
        referenceNumber: certificateData.verification_code || certificateData.certificate_id,
        certificateType: certificateData.certificate_type,
        holderName: certificateData.full_name,
        email: certificateData.email_address,
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
        issuedDate: certificateData.issued_date,
        verificationUrl: certificateData.certificate_url,
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
    console.log('📊 Getting verification statistics...');
    const stats = await sheetsDb.getStats();
    
    res.json({
      success: true,
      statistics: stats,
      summary: {
        totalCertificates: Object.values(stats).reduce((sum, stat) => sum + stat.total, 0),
        totalPending: Object.values(stats).reduce((sum, stat) => sum + stat.pending, 0),
        totalIssued: Object.values(stats).reduce((sum, stat) => sum + stat.issued, 0),
        totalRevoked: Object.values(stats).reduce((sum, stat) => sum + stat.revoked, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error getting verification statistics:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

// Search certificates by name or email
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    console.log('🔍 Searching certificates for:', query);
    
    const searchResults = [];
    
    // Search across all certificate types
    for (const certificateType of ['student', 'trainer', 'trainee']) {
      try {
        const results = await sheetsDb.getSubmissions({
          certificateType,
          search: query,
          limit: 20 // Limit per type
        });
        
        // Transform results to match expected format
        const transformedResults = results.data.map(cert => ({
          cert_type: certificateType,
          certificate_id: cert._id,
          certificate_ref_no: cert.verification_code || cert.certificate_id,
          full_name: cert.full_name,
          email: cert.email_address,
          status: cert.status,
          generated_at: cert.issued_date || cert.timestamp
        }));
        
        searchResults.push(...transformedResults);
      } catch (error) {
        console.error(`Error searching ${certificateType} certificates:`, error.message);
      }
    }
    
    // Sort by date (newest first)
    searchResults.sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
    
    // Limit total results
    const limitedResults = searchResults.slice(0, 50);
    
    res.json({
      query,
      results: limitedResults,
      count: limitedResults.length
    });

  } catch (error) {
    console.error('❌ Error searching certificates:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
