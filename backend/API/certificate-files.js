const express = require('express');
const router = express.Router();
const certificateStorage = require('../services/certificateStorageService');

/**
 * Certificate File Serving API
 * Serves certificate files stored in PostgreSQL database
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
 * Get certificate image from database
 * GET /api/certificate-files/:refNo/img
 * GET /api/certificate-files/:refNo/png
 */
router.get('/:refNo/:type(img|png|image)', async (req, res) => {
  try {
    const { refNo } = req.params;
    console.log(`🖼️ Serving image certificate for ${refNo}`);
    
    // Try to get PNG image first, then SVG as fallback
    let file = await certificateStorage.getCertificateFile(refNo, 'png');
    
    if (!file) {
      // Fallback to SVG
      file = await certificateStorage.getCertificateFile(refNo, 'svg');
    }
    
    if (!file) {
      // Create dynamic SVG placeholder if no file exists
      const svgData = certificateStorage.createSVGPlaceholder(refNo);
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `inline; filename="${refNo}.svg"`);
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      
      return res.send(svgData);
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the binary data or text data (for SVG)
    res.send(file.data);
    console.log(`✅ Image certificate served for ${refNo} (${file.size} bytes)`);
    
  } catch (error) {
    console.error('❌ Error serving image certificate:', error);
    
    // Fallback to creating SVG placeholder
    try {
      const svgData = certificateStorage.createSVGPlaceholder(req.params.refNo);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgData);
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to retrieve certificate image',
        message: 'An error occurred while retrieving the certificate image'
      });
    }
  }
});

/**
 * Get certificate SVG from database
 * GET /api/certificate-files/:refNo/svg
 */
router.get('/:refNo/svg', async (req, res) => {
  try {
    const { refNo } = req.params;
    console.log(`🎨 Serving SVG certificate for ${refNo}`);
    
    let file = await certificateStorage.getCertificateFile(refNo, 'svg');
    
    if (!file) {
      // Create dynamic SVG placeholder
      const svgData = certificateStorage.createSVGPlaceholder(refNo);
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `inline; filename="${refNo}.svg"`);
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      
      return res.send(svgData);
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the SVG data
    res.send(file.data);
    console.log(`✅ SVG certificate served for ${refNo}`);
    
  } catch (error) {
    console.error('❌ Error serving SVG certificate:', error);
    
    // Fallback to creating SVG placeholder
    try {
      const svgData = certificateStorage.createSVGPlaceholder(req.params.refNo);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgData);
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to retrieve certificate SVG',
        message: 'An error occurred while retrieving the certificate SVG'
      });
    }
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
    
    // Try to get information from each file type
    const [pdfFile, imageFile, svgFile] = await Promise.all([
      certificateStorage.getCertificateFile(refNo, 'pdf'),
      certificateStorage.getCertificateFile(refNo, 'png'),
      certificateStorage.getCertificateFile(refNo, 'svg')
    ]);
    
    const info = {
      certificateRefNo: refNo,
      files: {
        pdf: pdfFile ? { 
          available: true, 
          size: pdfFile.size, 
          contentType: pdfFile.contentType,
          url: `/api/certificate-files/${refNo}/pdf`
        } : { available: false },
        image: imageFile ? { 
          available: true, 
          size: imageFile.size, 
          contentType: imageFile.contentType,
          url: `/api/certificate-files/${refNo}/png`
        } : { available: false },
        svg: svgFile ? { 
          available: true, 
          size: svgFile.size, 
          contentType: svgFile.contentType,
          url: `/api/certificate-files/${refNo}/svg`
        } : { 
          available: true, // SVG is always available (dynamic generation)
          url: `/api/certificate-files/${refNo}/svg`
        }
      },
      generatedAt: pdfFile?.generatedAt || imageFile?.generatedAt || svgFile?.generatedAt,
      recommendedFormat: pdfFile ? 'pdf' : (imageFile ? 'png' : 'svg')
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
