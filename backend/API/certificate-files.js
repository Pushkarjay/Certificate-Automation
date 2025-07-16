const express = require('express');
const router = express.Router();
const sheetsDb = require('../services/sheetsDatabase');

/**
 * Certificate File Serving API
 * Serves PDF certificate files stored in Google Sheets as base64
 */

/**
 * Get certificate PDF from database
 * GET /api/certificate-files/:refNo/pdf
 */
router.get('/:refNo/pdf', async (req, res) => {
  try {
    const { refNo } = req.params;
    console.log(`📄 Serving PDF certificate for ${refNo}`);
    
    const certificate = await sheetsDb.findByVerificationCode(refNo);
    
    if (!certificate || !certificate.certificate_pdf_base64) {
      return res.status(404).json({ 
        error: 'Certificate not found',
        message: `No PDF certificate found for reference: ${refNo}`
      });
    }
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(certificate.certificate_pdf_base64, 'base64');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${refNo}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the binary data
    res.send(pdfBuffer);
    console.log(`✅ PDF certificate served for ${refNo} (${pdfBuffer.length} bytes)`);
    
  } catch (error) {
    console.error('❌ Error serving PDF certificate:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve certificate',
      message: 'An error occurred while retrieving the certificate'
    });
  }
});

/**
 * Get certificate metadata
 * GET /api/certificate-files/:refNo/info
 */
router.get('/:refNo/info', async (req, res) => {
  try {
    const { refNo } = req.params;
    console.log(`ℹ️ Getting certificate info for ${refNo}`);
    
    const certificate = await sheetsDb.findByVerificationCode(refNo);
    
    const info = {
      certificateRefNo: refNo,
      files: {
        pdf: certificate && certificate.certificate_pdf_base64 ? { 
          available: true, 
          size: Math.round(certificate.certificate_pdf_base64.length * 0.75), // Approximate size from base64
          contentType: 'application/pdf',
          url: `/api/certificate-files/${refNo}/pdf`
        } : { available: false }
      },
      generatedAt: certificate?.issue_date || certificate?.updated_at,
      format: 'pdf',
      certificateInfo: certificate ? {
        holderName: certificate.full_name,
        courseName: certificate.course_name,
        issueDate: certificate.issue_date,
        status: certificate.status
      } : null
    };
    
    res.json(info);
    console.log(`✅ Certificate info served for ${refNo}`);
    
  } catch (error) {
    console.error('❌ Error getting certificate info:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve certificate information',
      message: 'An error occurred while retrieving certificate information'
    });
  }
});

/**
 * Get storage statistics
 * GET /api/certificate-files/stats
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Getting certificate storage statistics');
    
    const stats = await sheetsDb.getStats();
    
    if (!stats) {
      return res.status(500).json({ 
        error: 'Failed to retrieve storage statistics'
      });
    }
    
    // Calculate total storage from stats
    const totalCertificates = Object.values(stats).reduce((sum, stat) => sum + stat.total, 0);
    const totalIssued = Object.values(stats).reduce((sum, stat) => sum + stat.issued, 0);
    
    res.json({
      success: true,
      statistics: {
        totalCertificates,
        totalIssued,
        storageType: 'Google Sheets (Base64)',
        byType: stats,
        estimatedStorageUsed: `${Math.round(totalIssued * 2)}MB` // Rough estimate
      },
      retrievedAt: new Date().toISOString()
    });
    
    console.log('✅ Storage statistics served');
    
  } catch (error) {
    console.error('❌ Error getting storage statistics:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve storage statistics',
      message: 'An error occurred while retrieving storage statistics'
    });
  }
});

module.exports = router;
