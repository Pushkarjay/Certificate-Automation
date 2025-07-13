const express = require('express');
const router = express.Router();
const certificateStorage = require('../services/certificateStorageService');

/**
 * Certificate File Serving API
 * Serves PDF certificate files stored in PostgreSQL database
 */

/**
 * Get certificate PDF from database
 * GET /api/certificate-files/:refNo/pdf
 */
router.get('/:refNo/pdf', async (req, res) => {
  try {
    const { refNo } = req.params;
    console.log(`📄 Serving PDF certificate for ${refNo}`);
    
    const file = await certificateStorage.getCertificateFile(refNo, 'pdf');
    
    if (!file) {
      return res.status(404).json({ 
        error: 'Certificate not found',
        message: `No PDF certificate found for reference: ${refNo}`
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the binary data
    res.send(file.data);
    console.log(`✅ PDF certificate served for ${refNo} (${file.size} bytes)`);
    
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
    
    // Only check for PDF file
    const pdfFile = await certificateStorage.getCertificateFile(refNo, 'pdf');
    
    const info = {
      certificateRefNo: refNo,
      files: {
        pdf: pdfFile ? { 
          available: true, 
          size: pdfFile.size, 
          contentType: pdfFile.contentType,
          url: `/api/certificate-files/${refNo}/pdf`
        } : { available: false }
      },
      generatedAt: pdfFile?.generatedAt,
      format: 'pdf'
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
    
    const stats = await certificateStorage.getStorageStats();
    
    if (!stats) {
      return res.status(500).json({ 
        error: 'Failed to retrieve storage statistics'
      });
    }
    
    res.json({
      success: true,
      statistics: stats,
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
